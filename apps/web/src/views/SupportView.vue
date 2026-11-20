<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import StatusBadge from "../components/StatusBadge.vue";
import api, { getErrorMessage } from "../services/api";
import type { Order, ProductionJobSummary, SupportTicket, SupportTicketPriority, SupportTicketStatus } from "../types";
import { formatCurrency } from "../utils/money";

const orders = ref<Order[]>([]);
const route = useRoute();
const productionJobs = ref<Array<ProductionJobSummary & {
  orderId: string;
  orderNumber: string;
  productName: string;
}>>([]);
const tickets = ref<SupportTicket[]>([]);
const activeTicketCount = ref<number | null>(null);
const loading = ref(true);
const ticketsLoading = ref(false);
const ticketDetailsLoading = ref(false);
const olderCommentsLoading = ref(false);
const hasMoreComments = ref(false);
const optionsLoading = ref(false);
const optionsError = ref("");
const error = ref("");
const selectedTicketId = ref<string | null>(null);
const loadedTicketDetails = new Set<string>();
let ticketDetailsRequestId = 0;
let olderCommentsRequestId = 0;
let ticketListRequestId = 0;
let ticketFilterRequestId = 0;
const draftMessage = ref("");
const creatingTicket = ref(false);
const sendingComment = ref(false);
const statusFilter = ref<SupportTicketStatus | "all">("all");
const priorityFilter = ref<SupportTicketPriority | "all">("all");
const ticketDraft = ref({
  orderId: "",
  productionJobId: "",
  subject: "",
  description: "",
  priority: "normal" as SupportTicketPriority,
  status: "open" as SupportTicketStatus,
});

const queue = computed(() => orders.value.filter((order) => ["received", "validation_pending", "awaiting_approval", "action_required"].includes(order.status)).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
const readyToShip = computed(() => orders.value.filter((order) => order.status === "accepted" || order.status === "submitted").length);
const totalSupportValue = computed(() => orders.value.reduce((sum, order) => sum + order.customerTotal, 0));
const openTickets = computed(() => activeTicketCount.value ?? 0);
const orderedTickets = computed(() => [...tickets.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
const selectedTicket = computed(() => orderedTickets.value.find((ticket) => ticket.id === selectedTicketId.value) ?? orderedTickets.value[0] ?? null);

async function loadOrders() {
  const { data } = await api.get("/orders?pageSize=100", { timeout: 8000 });
  orders.value = data.items as Order[];
}

async function loadProductionJobs() {
  const { data } = await api.get("/production/jobs/summary", { timeout: 8000 });
  productionJobs.value = (data.items as Array<{
    id: string;
    code: string;
    status: string;
    productionMethod: string | null;
    order: { id: string; orderNumber: string };
    orderItem: { productName: string };
  }>).map((job) => ({
    id: job.id,
    code: job.code,
    status: job.status,
    productionMethod: job.productionMethod,
    orderId: job.order.id,
    orderNumber: job.order.orderNumber,
    productName: job.orderItem.productName,
  }));
}

async function loadTickets() {
  const requestId = ++ticketListRequestId;
  let data;
  try {
    ({ data } = await api.get("/support/tickets", {
      timeout: 8000,
      params: {
        pageSize: 50,
        ...(statusFilter.value !== "all" ? { status: statusFilter.value } : {}),
        ...(priorityFilter.value !== "all" ? { priority: priorityFilter.value } : {}),
      },
    }));
  } catch (reason) {
    if (requestId === ticketListRequestId) throw reason;
    return;
  }
  if (requestId !== ticketListRequestId) return;

  const previousTickets = new Map(tickets.value.map((ticket) => [ticket.id, ticket]));
  tickets.value = (data.items as SupportTicket[]).map((ticket) => {
    const previous = previousTickets.get(ticket.id);
    return loadedTicketDetails.has(ticket.id) && previous
      ? { ...ticket, comments: previous.comments }
      : ticket;
  });
  const firstTicket = tickets.value[0];
  if (!selectedTicketId.value && firstTicket) {
    selectedTicketId.value = firstTicket.id;
  }
  if (selectedTicketId.value && !tickets.value.some((ticket) => ticket.id === selectedTicketId.value)) {
    selectedTicketId.value = firstTicket?.id ?? null;
  }
  if (selectedTicketId.value && !loadedTicketDetails.has(selectedTicketId.value)) {
    void loadTicketDetails(selectedTicketId.value);
  }
}

async function loadTicketDetails(ticketId: string) {
  const requestId = ++ticketDetailsRequestId;
  ticketDetailsLoading.value = true;
  try {
    const { data } = await api.get<SupportTicket>(`/support/tickets/${ticketId}`, { timeout: 8000 });
    const index = tickets.value.findIndex((ticket) => ticket.id === ticketId);
    if (index >= 0) {
      tickets.value[index] = data;
      loadedTicketDetails.add(ticketId);
      if (ticketId === selectedTicketId.value) hasMoreComments.value = data.hasMoreComments ?? false;
    }
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    if (requestId === ticketDetailsRequestId) ticketDetailsLoading.value = false;
  }
}

function selectTicket(ticketId: string) {
  if (ticketId === selectedTicketId.value) return;
  olderCommentsRequestId += 1;
  olderCommentsLoading.value = false;
  hasMoreComments.value = false;
  selectedTicketId.value = ticketId;
  const ticket = tickets.value.find((item) => item.id === ticketId);
  if (ticket && !loadedTicketDetails.has(ticketId)) {
    void loadTicketDetails(ticketId);
  }
}

async function loadOlderComments() {
  const ticket = selectedTicket.value;
  const oldestComment = ticket?.comments[0];
  if (!ticket || !oldestComment || !hasMoreComments.value || olderCommentsLoading.value) return;

  const requestId = ++olderCommentsRequestId;
  olderCommentsLoading.value = true;
  error.value = "";
  try {
    const { data } = await api.get<{
      items: SupportTicket["comments"];
      hasMore: boolean;
    }>(`/support/tickets/${ticket.id}/comments`, {
      timeout: 8000,
      params: { beforeCreatedAt: oldestComment.createdAt, beforeId: oldestComment.id },
    });
    if (requestId !== olderCommentsRequestId || selectedTicketId.value !== ticket.id) return;

    const ticketIndex = tickets.value.findIndex((item) => item.id === ticket.id);
    const existingTicket = tickets.value[ticketIndex];
    if (existingTicket) {
      tickets.value[ticketIndex] = {
        ...existingTicket,
        comments: [...data.items, ...existingTicket.comments],
      };
      hasMoreComments.value = data.hasMore;
    }
  } catch (reason) {
    if (requestId === olderCommentsRequestId) error.value = getErrorMessage(reason);
  } finally {
    if (requestId === olderCommentsRequestId) olderCommentsLoading.value = false;
  }
}

async function loadCreateOptions() {
  optionsLoading.value = true;
  optionsError.value = "";
  try {
    await Promise.all([loadOrders(), loadProductionJobs()]);
    applyRouteContext();
  } catch (reason) {
    optionsError.value = getErrorMessage(reason);
  } finally {
    optionsLoading.value = false;
  }
}

async function loadTicketSummary() {
  const { data } = await api.get<{ active: number }>("/support/tickets/summary", { timeout: 8000 });
  activeTicketCount.value = data.active;
}

function refreshTicketSummary() {
  void loadTicketSummary().catch((reason: unknown) => {
    error.value = getErrorMessage(reason);
  });
}

function applyRouteContext() {
  const orderId = typeof route.query.orderId === "string" ? route.query.orderId : "";
  const productionJobId = typeof route.query.productionJobId === "string" ? route.query.productionJobId : "";
  const order = orders.value.find((item) => item.id === orderId);
  const job = productionJobs.value.find((item) => item.id === productionJobId);

  if (order) {
    ticketDraft.value.orderId = order.id;
    ticketDraft.value.subject ||= job ? `Incidencia de producción ${job.code}` : `Seguimiento pedido ${order.orderNumber}`;
  }
  if (job && (!orderId || job.orderId === orderId)) {
    ticketDraft.value.orderId = job.orderId;
    ticketDraft.value.productionJobId = job.id;
    ticketDraft.value.subject ||= `Incidencia de producción ${job.code}`;
  }
}

async function changeTicketFilters() {
  const requestId = ++ticketFilterRequestId;
  ticketsLoading.value = true;
  error.value = "";
  try {
    await loadTickets();
  } catch (reason) {
    if (requestId === ticketFilterRequestId) error.value = getErrorMessage(reason);
  } finally {
    if (requestId === ticketFilterRequestId) ticketsLoading.value = false;
  }
}

async function refreshQueue() {
  loading.value = true;
  error.value = "";
  try {
    await loadTickets();
    refreshTicketSummary();
    void loadCreateOptions();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

async function createTicket() {
  if (!ticketDraft.value.subject.trim() || !ticketDraft.value.description.trim()) {
    error.value = "Completa el asunto y la descripción para crear el ticket.";
    return;
  }

  creatingTicket.value = true;
  error.value = "";

  try {
    const { data } = await api.post("/support/tickets", {
      orderId: ticketDraft.value.orderId || undefined,
      productionJobId: ticketDraft.value.productionJobId || undefined,
      subject: ticketDraft.value.subject,
      description: ticketDraft.value.description,
      priority: ticketDraft.value.priority,
      status: ticketDraft.value.status,
    }, { timeout: 8000 });

    if ((statusFilter.value === "all" || statusFilter.value === data.status) &&
      (priorityFilter.value === "all" || priorityFilter.value === data.priority)) {
      tickets.value = [data, ...tickets.value];
      selectedTicketId.value = data.id;
    }
    ticketDraft.value = {
      orderId: "",
      productionJobId: "",
      subject: "",
      description: "",
      priority: "normal",
      status: "open",
    };
    refreshTicketSummary();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    creatingTicket.value = false;
  }
}

async function addComment() {
  if (!selectedTicket.value || !draftMessage.value.trim()) {
    return;
  }

  const ticketId = selectedTicket.value.id;
  sendingComment.value = true;
  error.value = "";

  try {
    await api.post(`/support/tickets/${ticketId}/comments`, {
      message: draftMessage.value,
    }, { timeout: 8000 });
    loadedTicketDetails.delete(ticketId);
    hasMoreComments.value = false;
    draftMessage.value = "";
    await loadTickets();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    sendingComment.value = false;
  }
}

async function updateTicketStatus(ticketId: string, status: SupportTicketStatus) {
  try {
    await api.patch(`/support/tickets/${ticketId}`, { status }, { timeout: 8000 });
    loadedTicketDetails.delete(ticketId);
    await loadTickets();
    refreshTicketSummary();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function updateTicketPriority(ticketId: string, priority: SupportTicketPriority) {
  try {
    await api.patch(`/support/tickets/${ticketId}`, { priority }, { timeout: 8000 });
    loadedTicketDetails.delete(ticketId);
    await loadTickets();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

function handleOrderSelection() {
  ticketDraft.value.productionJobId = "";
}

function handleProductionJobSelection() {
  const job = productionJobs.value.find((item) => item.id === ticketDraft.value.productionJobId);
  if (job) ticketDraft.value.orderId = job.orderId;
}

function activityLabel(type: SupportTicket["comments"][number]["activityType"]) {
  return {
    created: "Ticket creado",
    comment: "Comentario",
    status_changed: "Cambio de estado",
    priority_changed: "Cambio de prioridad",
  }[type];
}

function roleLabel(role: SupportTicket["comments"][number]["authorRole"]) {
  if (!role) return "Rol no disponible";
  return {
    owner: "Propietario",
    admin: "Administrador",
    editor: "Editor",
    viewer: "Consulta",
    customer: "Cliente",
  }[role];
}

onMounted(async () => {
  try {
    await loadTickets();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
  refreshTicketSummary();
  void loadCreateOptions();
});

watch([statusFilter, priorityFilter], () => {
  void changeTicketFilters();
});

watch(() => [route.query.orderId, route.query.productionJobId], () => {
  applyRouteContext();
});
</script>

<template>
  <PageHeader title="Atención al cliente" description="Revisa tickets, comentarios y pedidos críticos del negocio en una sola vista.">
    <button class="button button-primary" type="button" @click="refreshQueue">↻ Actualizar</button>
  </PageHeader>

  <div v-if="error" class="alert alert-error">{{ error }}</div>

  <section class="metric-grid">
    <article class="metric-card">
      <div class="metric-top"><span>Tickets activos</span><span class="metric-icon lavender">✦</span></div>
      <strong>{{ loading ? "—" : openTickets }}</strong>
      <small>Casos activos de soporte</small>
    </article>
    <article class="metric-card">
      <div class="metric-top"><span>En cola</span><span class="metric-icon mint">▤</span></div>
      <strong>{{ loading ? "—" : queue.length }}</strong>
      <small>Pedidos que requieren revisión</small>
    </article>
    <article class="metric-card">
      <div class="metric-top"><span>Listos para envío</span><span class="metric-icon peach">✓</span></div>
      <strong>{{ loading ? "—" : readyToShip }}</strong>
      <small>Órdenes con flujo siguiente</small>
    </article>
    <article class="metric-card">
      <div class="metric-top"><span>Valor en atención</span><span class="metric-icon amber">$</span></div>
      <strong>{{ loading ? "—" : formatCurrency(totalSupportValue) }}</strong>
      <small>Importe de pedidos activos</small>
    </article>
  </section>

  <section class="content-card support-grid">
    <div class="support-panel">
      <div class="section-heading">
        <div>
          <h2>Nuevo ticket</h2>
          <p>{{ ticketDraft.productionJobId ? "El ticket quedará vinculado al pedido y al trabajo de producción seleccionado." : ticketDraft.orderId ? "El pedido de origen quedó seleccionado para este ticket." : "Reporta una incidencia o seguimiento por pedido." }}</p>
        </div>
      </div>

      <div class="ticket-form">
        <div v-if="optionsError" class="alert alert-error">{{ optionsError }}</div>
        <label>
          Pedido relacionado
          <select v-model="ticketDraft.orderId" :disabled="optionsLoading" @change="handleOrderSelection">
            <option value="">Sin pedido relacionado</option>
            <option v-for="order in orders" :key="order.id" :value="order.id">#{{ order.orderNumber }} · {{ order.customerName }}</option>
          </select>
        </label>

        <label>
          Trabajo de producción
          <select v-model="ticketDraft.productionJobId" :disabled="optionsLoading" @change="handleProductionJobSelection">
            <option value="">{{ optionsLoading ? "Cargando trabajos..." : "Sin trabajo relacionado" }}</option>
            <option v-for="job in productionJobs.filter((item) => !ticketDraft.orderId || item.orderId === ticketDraft.orderId)" :key="job.id" :value="job.id">
              {{ job.code }} · #{{ job.orderNumber }} · {{ job.productName }}
            </option>
          </select>
        </label>

        <label>
          Asunto
          <input v-model="ticketDraft.subject" type="text" placeholder="Ej. Pedido con ajuste de impresión" />
        </label>

        <label>
          Descripción
          <textarea v-model="ticketDraft.description" rows="4" placeholder="Describe la incidencia, prioridad o seguimiento requerido..."></textarea>
        </label>

        <div class="inline-fields">
          <label>
            Prioridad
            <select v-model="ticketDraft.priority">
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>

          <label>
            Estado inicial
            <select v-model="ticketDraft.status">
              <option value="open">Abierto</option>
              <option value="in_progress">En progreso</option>
              <option value="waiting_customer">Esperando cliente</option>
            </select>
          </label>
        </div>

        <button class="button button-primary" type="button" :disabled="creatingTicket || optionsLoading" @click="createTicket">
          {{ creatingTicket ? "Creando..." : "Crear ticket" }}
        </button>
      </div>
    </div>

    <div class="support-panel">
      <div class="section-heading">
        <div>
          <h2>Cola de soporte</h2>
          <p>Tickets creados por pedidos, incidencias o seguimiento comercial.</p>
        </div>
        <div class="ticket-filters">
          <label>
            Estado
            <select v-model="statusFilter" aria-label="Filtrar tickets por estado">
              <option value="all">Todos</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En progreso</option>
              <option value="waiting_customer">Esperando cliente</option>
              <option value="resolved">Resueltos</option>
              <option value="closed">Cerrados</option>
            </select>
          </label>
          <label>
            Prioridad
            <select v-model="priorityFilter" aria-label="Filtrar tickets por prioridad">
              <option value="all">Todas</option>
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="loading && !orderedTickets.length" class="loading-state">Cargando tickets de atención...</div>
      <div v-else-if="orderedTickets.length" class="ticket-list">
        <div v-if="ticketsLoading || loading" class="loading-state">Actualizando tickets...</div>
        <button v-for="ticket in orderedTickets" :key="ticket.id" type="button" class="ticket-item" :class="{ active: selectedTicket?.id === ticket.id }" @click="selectTicket(ticket.id)">
          <div class="ticket-head">
            <strong>#{{ ticket.orderNumber ?? ticket.id.slice(-6).toUpperCase() }}</strong>
            <span class="ticket-priority" :class="`priority-${ticket.priority}`">{{ ticket.priority }}</span>
          </div>
          <div class="ticket-subject">{{ ticket.subject }}</div>
          <div class="ticket-meta">
            <span>{{ ticket.customerName }}</span>
            <span>{{ new Date(ticket.createdAt).toLocaleDateString("es-MX") }}</span>
          </div>
          <StatusBadge :status="ticket.status" />
        </button>
      </div>
      <div v-else class="empty-state">
        <span class="empty-icon">✦</span>
        <strong>Sin tickets</strong>
        <p>Aún no hay incidencias reportadas para esta cuenta.</p>
      </div>
    </div>
  </section>

  <section v-if="selectedTicket" class="content-card ticket-detail">
    <div class="section-heading">
      <div>
        <h2>{{ selectedTicket.subject }}</h2>
        <p>
          <RouterLink v-if="selectedTicket.orderId" :to="{ name: 'orders', query: { orderId: selectedTicket.orderId } }">Pedido #{{ selectedTicket.orderNumber }}</RouterLink>
          <span v-else>Sin pedido asociado</span>
          · {{ selectedTicket.customerName }}
          <span v-if="selectedTicket.productionJob"> · Producción <RouterLink :to="{ name: 'production', query: { jobId: selectedTicket.productionJob.id } }">{{ selectedTicket.productionJob.code }}</RouterLink></span>
        </p>
      </div>
      <div class="ticket-actions">
        <select :value="selectedTicket.status" @change="updateTicketStatus(selectedTicket.id, ($event.target as HTMLSelectElement).value as SupportTicketStatus)">
          <option value="open">Abierto</option>
          <option value="in_progress">En progreso</option>
          <option value="waiting_customer">Esperando cliente</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>
        <select :value="selectedTicket.priority" @change="updateTicketPriority(selectedTicket.id, ($event.target as HTMLSelectElement).value as SupportTicketPriority)">
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>
    </div>

    <div class="ticket-description">
      {{ selectedTicket.description }}
    </div>
    <div v-if="selectedTicket.productionJob" class="production-link-card">
      <div>
        <strong>Trabajo de producción {{ selectedTicket.productionJob.code }}</strong>
        <p>{{ selectedTicket.productionJob.productionMethod ?? "Método por definir" }}</p>
      </div>
      <StatusBadge :status="selectedTicket.productionJob.status" />
      <RouterLink class="text-link" to="/production">Abrir producción <span>→</span></RouterLink>
    </div>

    <div v-if="ticketDetailsLoading" class="loading-state">Cargando actividad del ticket...</div>
    <template v-else>
      <button
        v-if="hasMoreComments"
        type="button"
        class="button button-secondary"
        :disabled="olderCommentsLoading"
        @click="loadOlderComments"
      >
        {{ olderCommentsLoading ? "Cargando actividad anterior..." : "Cargar actividad anterior" }}
      </button>
      <div v-if="selectedTicket.comments.length" class="message-thread">
        <article v-for="comment in selectedTicket.comments" :key="comment.id" class="message-card" :class="`activity-${comment.activityType}`">
          <header>
            <div>
              <strong>{{ comment.authorName }}</strong>
              <span class="activity-role">{{ roleLabel(comment.authorRole) }}</span>
            </div>
            <div class="activity-meta">
              <span>{{ activityLabel(comment.activityType) }}</span>
              <time>{{ new Date(comment.createdAt).toLocaleString("es-MX") }}</time>
            </div>
          </header>
          <p>{{ comment.body }}</p>
        </article>
      </div>
      <div v-else class="empty-state compact">
        <span class="empty-icon">✎</span>
        <strong>Sin comentarios</strong>
        <p>Aún no hay conversaciones registradas para este caso.</p>
      </div>

      <div class="comment-box">
        <textarea v-model="draftMessage" rows="3" placeholder="Escribe una respuesta o actualización para este ticket..."></textarea>
        <button class="button button-primary" type="button" :disabled="sendingComment || !draftMessage.trim()" @click="addComment">
          {{ sendingComment ? "Enviando..." : "Agregar comentario" }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.support-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.9fr) minmax(320px, 1.2fr);
  gap: 1.25rem;
  align-items: start;
}

.support-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-form label,
.ticket-detail label,
.ticket-filters label {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: #475569;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #d9e0ec;
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  font: inherit;
  background: #fff;
  color: #1f2937;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 96px;
}

.inline-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ticket-filters {
  display: flex;
  gap: 0.75rem;
}

.ticket-filters label {
  min-width: 130px;
}

.ticket-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  padding: 0.9rem 1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.16s ease, transform 0.16s ease;
}

.ticket-item:hover,
.ticket-item.active {
  border-color: #4f46e5;
  transform: translateY(-1px);
}

.ticket-head,
.ticket-meta,
.ticket-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ticket-priority {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.priority-low { background: #ecfdf5; color: #166534; }
.priority-normal { background: #eff6ff; color: #1d4ed8; }
.priority-high { background: #fff7ed; color: #c2410c; }
.priority-urgent { background: #fef2f2; color: #b91c1c; }

.ticket-subject {
  font-weight: 600;
  color: #111827;
}

.ticket-meta {
  font-size: 0.78rem;
  color: #64748b;
}

.ticket-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-description {
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1f2937;
  line-height: 1.6;
}

.message-thread {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.message-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 0.9rem 1rem;
}

.message-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  color: #64748b;
}

.message-card header > div {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.activity-role,
.activity-meta span {
  color: #64748b;
  font-size: 0.72rem;
}

.activity-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.activity-status_changed,
.activity-priority_changed,
.activity-created {
  background: #f8fafc;
}

.production-link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #dfe5f0;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  background: #fbfcff;
}

.production-link-card p {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.comment-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.compact {
  padding: 0.5rem 0;
}

@media (max-width: 980px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .ticket-filters,
  .production-link-card {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
