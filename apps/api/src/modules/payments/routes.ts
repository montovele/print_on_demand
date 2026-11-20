import { randomUUID } from "node:crypto";
import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { config } from "../../config.js";
import { prisma } from "../../database.js";
import { asyncRoute, assertBody, HttpError, requireCsrf } from "../../lib/http.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const router = Router();
const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;
const verifyCheckoutSchema = z.object({
  orderId: z.string().trim().min(1).max(191),
});

async function finalizeCheckout(session: Stripe.Checkout.Session, paymentStatus: "paid" | "failed") {
  const tenantId = session.metadata?.tenantId;
  const orderId = session.metadata?.orderId;
  if (!tenantId || !orderId || !session.id) return;
  await prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findFirst({
      where: { id: orderId, tenantId },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;
    if (order.stripeCheckoutSessionId && order.stripeCheckoutSessionId !== session.id) return;
    if (
      paymentStatus === "paid"
      && (
        session.amount_total !== Math.round(order.customerTotal.toNumber() * 100)
        || session.currency !== order.currency.toLowerCase()
      )
    ) {
      throw new HttpError(400, "El total confirmado por Stripe no coincide con el pedido.", "STRIPE_AMOUNT_MISMATCH");
    }
    if (paymentStatus === "failed") {
      if (order.paymentStatus === "pending") {
        await transaction.order.update({
          where: { id: order.id },
          data: { stripeCheckoutSessionId: session.id, paymentStatus: "failed", status: "failed" },
        });
      }
      return;
    }
    const paidOrder = await transaction.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "paid" } },
      data: {
        stripeCheckoutSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });
    if (paidOrder.count === 0) return;
    for (const item of order.items) {
      const product = item.product;
      if (!product || product.fulfillmentMode !== "in_house") continue;
      const job = await transaction.productionJob.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          orderItemId: item.id,
          productId: product.id,
          code: `JOB-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
          quantity: item.quantity,
          productionMethod: product.productionMethod,
          estimatedMinutes: product.productionMinutes,
          notes: [product.manufacturingNotes, item.printInstructions].filter(Boolean).join("\n\n") || null,
        },
      });
      await transaction.productionJobHistory.create({
        data: {
          jobId: job.id,
          toStatus: "queued",
          note: "Trabajo creado automáticamente tras confirmar el pago.",
          actorUserId: order.customerUserId ?? "system",
        },
      });
    }
  });
}

router.post("/checkout/verify", requireAuth, requireCsrf, requireRole("owner", "admin", "editor"), asyncRoute(async (req, res) => {
  const { orderId } = assertBody(verifyCheckoutSchema, req.body);
  if (!stripe) throw new HttpError(503, "Stripe no está configurado.", "PAYMENTS_NOT_CONFIGURED");

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId: res.locals.auth.tenantId },
    select: {
      id: true,
      stripeCheckoutSessionId: true,
      paymentStatus: true,
      customerTotal: true,
      currency: true,
      tenantId: true,
    },
  });
  if (!order) throw new HttpError(404, "Pedido no encontrado.", "ORDER_NOT_FOUND");
  if (order.paymentStatus === "paid") {
    res.json({ paymentStatus: "paid" });
    return;
  }
  if (!order.stripeCheckoutSessionId) {
    throw new HttpError(409, "El pedido no tiene una sesión de pago de Stripe asociada.", "CHECKOUT_SESSION_NOT_FOUND");
  }

  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
  if (session.metadata?.orderId !== order.id || session.metadata.tenantId !== order.tenantId) {
    throw new HttpError(409, "La sesión de pago no corresponde a este pedido.", "CHECKOUT_SESSION_MISMATCH");
  }
  if (session.payment_status === "paid") {
    await finalizeCheckout(session, "paid");
  }
  res.json({ paymentStatus: session.payment_status === "paid" ? "paid" : "pending" });
}));

router.post("/stripe/webhook", asyncRoute(async (req, res) => {
  if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, "Stripe no está configurado.", "PAYMENTS_NOT_CONFIGURED");
  }
  const signature = req.get("stripe-signature");
  if (!signature || !Buffer.isBuffer(req.body)) {
    throw new HttpError(400, "La firma del webhook de Stripe no es válida.", "INVALID_STRIPE_SIGNATURE");
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new HttpError(400, "La firma del webhook de Stripe no es válida.", "INVALID_STRIPE_SIGNATURE");
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") await finalizeCheckout(session, "paid");
  } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
    await finalizeCheckout(event.data.object as Stripe.Checkout.Session, "failed");
  }
  res.json({ received: true });
}));

export default router;
