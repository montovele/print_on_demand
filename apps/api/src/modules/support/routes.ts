import {
  Prisma,
  SupportTicketActivityType,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, pathParam, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { calculateSlaMetrics } from "./sla-metrics.js";

const router = Router();

const ticketInclude = {
  order: {
    select: { id: true, orderNumber: true, customerName: true, status: true, createdAt: true },
  },
  productionJob: {
    select: { id: true, code: true, status: true, productionMethod: true, orderId: true },
  },
  comments: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.SupportTicketInclude;

const ticketListInclude = {
  order: ticketInclude.order,
  productionJob: ticketInclude.productionJob,
  comments: { orderBy: { createdAt: "desc" as const }, take: 1 },
} satisfies Prisma.SupportTicketInclude;

const ticketDetailInclude = {
  order: ticketInclude.order,
  productionJob: ticketInclude.productionJob,
  comments: { orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }], take: 51 },
} satisfies Prisma.SupportTicketInclude;

type TicketWithRelations = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>;
type TicketListItem = Prisma.SupportTicketGetPayload<{ include: typeof ticketListInclude }>;
type TicketDetail = Prisma.SupportTicketGetPayload<{ include: typeof ticketDetailInclude }>;

const ticketPrioritySchema = z.nativeEnum(SupportTicketPriority);
const ticketStatusSchema = z.nativeEnum(SupportTicketStatus);
const initialTicketStatusSchema = z.enum([
  SupportTicketStatus.open,
  SupportTicketStatus.in_progress,
  SupportTicketStatus.waiting_customer,
]);

const ticketStatusLabels: Record<SupportTicketStatus, string> = {
  open: "abierto",
  in_progress: "en progreso",
  waiting_customer: "esperando al cliente",
  resolved: "resuelto",
  closed: "cerrado",
};
const ticketPriorityLabels: Record<SupportTicketPriority, string> = {
  low: "baja",
  normal: "normal",
  high: "alta",
  urgent: "urgente",
};

const createTicketSchema = z.object({
  orderId: z.string().trim().min(1).max(191).optional(),
  productionJobId: z.string().trim().min(1).max(191).optional(),
  orderNumber: z.string().trim().max(100).optional(),
  customerName: z.string().trim().min(1).max(191).optional(),
  subject: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  priority: ticketPrioritySchema.default(SupportTicketPriority.normal),
  status: initialTicketStatusSchema.default(SupportTicketStatus.open),
});

const updateTicketSchema = z.object({
  subject: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
}).refine((value) => Object.values(value).some((entry) => entry !== undefined), {
  message: "Indica al menos un campo para actualizar.",
});

const addCommentSchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

function serializeTicket(ticket: TicketWithRelations | TicketDetail) {
  return {
    id: ticket.id,
    orderId: ticket.orderId,
    productionJobId: ticket.productionJobId,
    orderNumber: ticket.orderNumber ?? ticket.order?.orderNumber ?? null,
    customerName: ticket.customerName ?? ticket.order?.customerName ?? "Cliente",
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    firstResponseAt: ticket.firstResponseAt?.toISOString() ?? null,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    order: ticket.order ? {
      id: ticket.order.id,
      orderNumber: ticket.order.orderNumber,
      customerName: ticket.order.customerName,
      status: ticket.order.status,
      createdAt: ticket.order.createdAt.toISOString(),
    } : null,
    productionJob: ticket.productionJob ? {
      id: ticket.productionJob.id,
      code: ticket.productionJob.code,
      status: ticket.productionJob.status,
      productionMethod: ticket.productionJob.productionMethod,
    } : null,
    comments: ticket.comments.map((comment) => ({
      id: comment.id,
      authorUserId: comment.authorUserId,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      activityType: comment.activityType,
      previousStatus: comment.previousStatus,
      newStatus: comment.newStatus,
      previousPriority: comment.previousPriority,
      newPriority: comment.newPriority,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    })),
  };
}

function serializeTicketDetail(ticket: TicketDetail) {
  const hasMoreComments = ticket.comments.length > 50;
  const latestComments = ticket.comments.slice(0, 50).reverse();
  return {
    ...serializeTicket({ ...ticket, comments: latestComments }),
    hasMoreComments,
  };
}

function queryEnum<T extends string>(
  value: unknown,
  schema: z.ZodType<T>,
  label: string,
): T | undefined {
  if (value === undefined) return undefined;
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new HttpError(400, `El filtro ${label} no es válido.`, "INVALID_SUPPORT_FILTER");
  }
  return parsed.data;
}

router.use(requireAuth, requireRole("owner", "admin", "editor", "viewer"));

router.get("/tickets", asyncRoute(async (req, res) => {
  const page = z.coerce.number().int().min(1).safeParse(req.query.page ?? 1);
  const pageSize = z.coerce.number().int().min(1).max(50).safeParse(req.query.pageSize ?? 20);
  if (!page.success || !pageSize.success) {
    throw new HttpError(400, "La paginación del listado no es válida.", "INVALID_PAGINATION");
  }

  const status = queryEnum(req.query.status, ticketStatusSchema, "estado");
  const priority = queryEnum(req.query.priority, ticketPrioritySchema, "prioridad");
  const where: Prisma.SupportTicketWhereInput = { tenantId: res.locals.auth.tenantId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [total, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      include: ticketListInclude,
      orderBy: { createdAt: "desc" },
      skip: (page.data - 1) * pageSize.data,
      take: pageSize.data,
    }),
  ]);

  res.json({
    items: tickets.map((ticket: TicketListItem) => serializeTicket(ticket)),
    page: page.data,
    pageSize: pageSize.data,
    total,
  });
}));

router.get("/metrics", requireRole("owner", "admin"), asyncRoute(async (req, res) => {
  const parsedDays = z.enum(["7", "30", "90"]).safeParse(req.query.days ?? "30");
  if (!parsedDays.success) {
    throw new HttpError(400, "El rango de métricas debe ser de 7, 30 o 90 días.", "INVALID_METRICS_RANGE");
  }

  const days = Number(parsedDays.data);
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId: res.locals.auth.tenantId, createdAt: { gte: from, lte: now } },
    select: { status: true, createdAt: true, firstResponseAt: true, resolvedAt: true },
  });
  const metrics = calculateSlaMetrics(tickets, now);
  const dailyMap = new Map<string, { date: string; created: number; resolved: number }>();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + offset);
    const key = date.toISOString().slice(0, 10);
    dailyMap.set(key, { date: key, created: 0, resolved: 0 });
  }
  for (const ticket of tickets) {
    const createdDay = ticket.createdAt.toISOString().slice(0, 10);
    const createdBucket = dailyMap.get(createdDay);
    if (createdBucket) createdBucket.created += 1;
    if (ticket.resolvedAt) {
      const resolvedDay = ticket.resolvedAt.toISOString().slice(0, 10);
      const resolvedBucket = dailyMap.get(resolvedDay);
      if (resolvedBucket) resolvedBucket.resolved += 1;
    }
  }

  res.json({ ...metrics, days, from: from.toISOString(), daily: [...dailyMap.values()] });
}));

router.get("/tickets/summary", requireRole("owner", "admin"), asyncRoute(async (_req, res) => {
  const active = await prisma.supportTicket.count({
    where: {
      tenantId: res.locals.auth.tenantId,
      status: { in: [
        SupportTicketStatus.open,
        SupportTicketStatus.in_progress,
        SupportTicketStatus.waiting_customer,
      ] },
    },
  });
  res.json({ active });
}));

router.post("/tickets", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(createTicketSchema, req.body);
  const tenantId = res.locals.auth.tenantId;

  const productionJob = body.productionJobId
    ? await prisma.productionJob.findFirst({
      where: { id: body.productionJobId, tenantId },
      include: { order: { select: { id: true, orderNumber: true, customerName: true } } },
    })
    : null;
  if (body.productionJobId && !productionJob) {
    throw new HttpError(404, "El trabajo de producción no existe o no pertenece a esta cuenta.", "PRODUCTION_JOB_NOT_FOUND");
  }

  if (body.orderId && productionJob && body.orderId !== productionJob.orderId) {
    throw new HttpError(400, "El trabajo de producción seleccionado no pertenece al pedido indicado.", "ORDER_JOB_MISMATCH");
  }

  const orderId = productionJob?.orderId ?? body.orderId;
  const order = orderId
    ? await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { id: true, orderNumber: true, customerName: true },
    })
    : null;
  if (orderId && !order) {
    throw new HttpError(404, "El pedido no existe o no pertenece a esta cuenta.", "ORDER_NOT_FOUND");
  }

  const user = await prisma.user.findUnique({
    where: { id: res.locals.auth.userId },
    select: { name: true },
  });
  const createdTicket = await prisma.$transaction(async (transaction) => {
    const ticket = await transaction.supportTicket.create({
      data: {
        tenantId,
        orderId: order?.id ?? null,
        productionJobId: productionJob?.id ?? null,
        orderNumber: order?.orderNumber ?? body.orderNumber ?? null,
        customerName: order?.customerName ?? body.customerName ?? "Cliente",
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        status: body.status,
        createdByUserId: res.locals.auth.userId,
      },
    });
    await transaction.supportTicketComment.create({
      data: {
        ticketId: ticket.id,
        authorUserId: res.locals.auth.userId,
        authorName: user?.name ?? "Soporte",
        authorRole: res.locals.auth.role,
        activityType: SupportTicketActivityType.created,
        body: "Ticket creado.",
      },
    });
    return transaction.supportTicket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketInclude,
    });
  });

  res.status(201).json(serializeTicket(createdTicket));
}));

router.patch("/tickets/:id", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(updateTicketSchema, req.body);
  const tenantId = res.locals.auth.tenantId;
  const ticketId = pathParam(req, "id");
  const user = await prisma.user.findUnique({
    where: { id: res.locals.auth.userId },
    select: { name: true },
  });

  const updatedTicket = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.supportTicket.findFirst({ where: { id: ticketId, tenantId } });
    if (!existing) {
      throw new HttpError(404, "El ticket de soporte no existe.", "SUPPORT_TICKET_NOT_FOUND");
    }

    const now = new Date();
    const updateData: Prisma.SupportTicketUpdateInput = {};
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === SupportTicketStatus.resolved || body.status === SupportTicketStatus.closed) {
        updateData.resolvedAt = existing.resolvedAt ?? now;
      } else if (existing.status === SupportTicketStatus.resolved || existing.status === SupportTicketStatus.closed) {
        updateData.resolvedAt = null;
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;

    const ticket = await transaction.supportTicket.update({ where: { id: existing.id }, data: updateData });
    if (body.status !== undefined && body.status !== existing.status) {
      await transaction.supportTicketComment.create({
        data: {
          ticketId: existing.id,
          authorUserId: res.locals.auth.userId,
          authorName: user?.name ?? "Soporte",
          authorRole: res.locals.auth.role,
          activityType: SupportTicketActivityType.status_changed,
          previousStatus: existing.status,
          newStatus: body.status,
          body: `Estado cambiado de ${ticketStatusLabels[existing.status]} a ${ticketStatusLabels[body.status]}.`,
        },
      });
    }
    if (body.priority !== undefined && body.priority !== existing.priority) {
      await transaction.supportTicketComment.create({
        data: {
          ticketId: existing.id,
          authorUserId: res.locals.auth.userId,
          authorName: user?.name ?? "Soporte",
          authorRole: res.locals.auth.role,
          activityType: SupportTicketActivityType.priority_changed,
          previousPriority: existing.priority,
          newPriority: body.priority,
          body: `Prioridad cambiada de ${ticketPriorityLabels[existing.priority]} a ${ticketPriorityLabels[body.priority]}.`,
        },
      });
    }

    return transaction.supportTicket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketDetailInclude,
    });
  });

  res.json(serializeTicketDetail(updatedTicket));
}));

router.post("/tickets/:id/comments", requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const body = assertBody(addCommentSchema, req.body);
  const ticketId = pathParam(req, "id");
  const tenantId = res.locals.auth.tenantId;
  const user = await prisma.user.findUnique({
    where: { id: res.locals.auth.userId },
    select: { name: true },
  });

  const comment = await prisma.$transaction(async (transaction) => {
    const ticket = await transaction.supportTicket.findFirst({
      where: { id: ticketId, tenantId },
      select: { id: true, firstResponseAt: true },
    });
    if (!ticket) {
      throw new HttpError(404, "El ticket de soporte no existe.", "SUPPORT_TICKET_NOT_FOUND");
    }

    const createdComment = await transaction.supportTicketComment.create({
      data: {
        ticketId: ticket.id,
        authorUserId: res.locals.auth.userId,
        authorName: user?.name ?? "Soporte",
        authorRole: res.locals.auth.role,
        activityType: SupportTicketActivityType.comment,
        body: body.message,
      },
    });
    if (!ticket.firstResponseAt) {
      await transaction.supportTicket.update({
        where: { id: ticket.id },
        data: { firstResponseAt: createdComment.createdAt },
      });
    }
    return createdComment;
  });

  res.status(201).json({
    id: comment.id,
    authorUserId: comment.authorUserId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    activityType: comment.activityType,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  });
}));

router.get("/tickets/:id", asyncRoute(async (req, res) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: pathParam(req, "id"), tenantId: res.locals.auth.tenantId },
    include: ticketDetailInclude,
  });
  if (!ticket) {
    throw new HttpError(404, "El ticket de soporte no existe.", "SUPPORT_TICKET_NOT_FOUND");
  }
  res.json(serializeTicketDetail(ticket));
}));

router.get("/tickets/:id/comments", asyncRoute(async (req, res) => {
  const ticketId = pathParam(req, "id");
  const tenantId = res.locals.auth.tenantId;
  const beforeCreatedAt = z.string().datetime().safeParse(req.query.beforeCreatedAt);
  const beforeId = z.string().trim().min(1).max(191).safeParse(req.query.beforeId);
  if (!beforeCreatedAt.success || !beforeId.success) {
    throw new HttpError(400, "La paginación del historial no es válida.", "INVALID_PAGINATION");
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId },
    select: { id: true },
  });
  if (!ticket) {
    throw new HttpError(404, "El ticket de soporte no existe.", "SUPPORT_TICKET_NOT_FOUND");
  }

  const comments = await prisma.supportTicketComment.findMany({
    where: {
      ticketId: ticket.id,
      OR: [
        { createdAt: { lt: new Date(beforeCreatedAt.data) } },
        { createdAt: new Date(beforeCreatedAt.data), id: { lt: beforeId.data } },
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 51,
  });
  const hasMore = comments.length > 50;
  const items = comments.slice(0, 50).reverse().map((comment) => ({
    id: comment.id,
    authorUserId: comment.authorUserId,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    activityType: comment.activityType,
    previousStatus: comment.previousStatus,
    newStatus: comment.newStatus,
    previousPriority: comment.previousPriority,
    newPriority: comment.newPriority,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  }));
  res.json({ items, hasMore });
}));

export default router;
