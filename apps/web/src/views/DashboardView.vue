<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAuthStore } from "../stores/auth";
import api, { getErrorMessage } from "../services/api";
import type { Order, Product, SupportSlaMetrics } from "../types";
import { formatCurrency } from "../utils/money";

const auth = useAuthStore();
const products = ref<Product[]>([]);
const orders = ref<Order[]>([]);
const busy = ref(true);
const supportMetrics = ref<SupportSlaMetrics | null>(null);
const supportMetricsLoading = ref(false);
const error = ref("");
const rangeOptions = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
] as const;
type RangeKey = (typeof rangeOptions)[number]["key"];
const selectedRange = ref<RangeKey>("7d");
const isAdmin = computed(() => ["owner", "admin"].includes(auth.tenant?.role ?? ""));

const salesTrend = computed(() => {
  const totalDays = selectedRange.value === "7d" ? 7 : selectedRange.value === "30d" ? 30 : 90;
  const buckets = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (totalDays - 1 - index));
    return {
      label: date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
      value: 0,
      orders: 0,
      date,
    };
  });

  for (const order of orders.value) {
    const orderDate = new Date(order.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    const found = buckets.find((bucket) => bucket.date.toDateString() === orderDate.toDateString());
    if (found) {
      found.value += order.customerTotal;
      found.orders += 1;
    }
  }

  return buckets;
});

const totalRangeSales = computed(() => salesTrend.value.reduce((sum, item) => sum + item.value, 0));
const totalRangeOrders = computed(() => salesTrend.value.reduce((sum, item) => sum + item.orders, 0));
const averageOrderValue = computed(() => (totalRangeOrders.value ? totalRangeSales.value / totalRangeOrders.value : 0));
const maxSales = computed(() => Math.max(...salesTrend.value.map((item) => item.value), 1));
const chartPoints = computed(() => salesTrend.value.map((item, index) => {
  const xStep = salesTrend.value.length > 1 ? 520 / (salesTrend.value.length - 1) : 0;
  const x = 24 + (index * xStep);
  const y = 180 - (item.value / maxSales.value) * 150;
  return `${x},${y}`;
}).join(" "));
const priorityOrders = computed(() => orders.value.filter((order) => ["received", "validation_pending", "awaiting_approval", "action_required"].includes(order.status)).slice(0, 3));
const recentSupportDays = computed(() => supportMetrics.value?.daily.slice(-14) ?? []);
const maxDailyTickets = computed(() => Math.max(
  1,
  ...recentSupportDays.value.map((day) => Math.max(day.created, day.resolved)),
));

function rangeDays() {
  return selectedRange.value === "7d" ? 7 : selectedRange.value === "30d" ? 30 : 90;
}

async function loadSupportMetrics() {
  if (!isAdmin.value) return;
  const requestedRange = selectedRange.value;
  supportMetricsLoading.value = true;
  supportMetrics.value = null;
  try {
    const { data } = await api.get<SupportSlaMetrics>(`/support/metrics?days=${rangeDays()}`, { timeout: 8000 });
    if (requestedRange !== selectedRange.value) return;
    supportMetrics.value = data;
  } catch (reason) {
    if (requestedRange === selectedRange.value) error.value = getErrorMessage(reason);
  } finally {
    if (requestedRange === selectedRange.value) supportMetricsLoading.value = false;
  }
}

function formatDuration(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${Math.round(value)}%`;
}

onMounted(async () => {
  try {
    const [productResponse, orderResponse] = await Promise.all([
      api.get("/products", { timeout: 8000 }),
      api.get("/orders?pageSize=100", { timeout: 8000 }),
    ]);
    products.value = productResponse.data.items as Product[];
    orders.value = orderResponse.data.items as Order[];
    void loadSupportMetrics();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    busy.value = false;
  }
});

watch(selectedRange, () => {
  void loadSupportMetrics();
});
</script>

<template>
  <PageHeader title="Resumen" description="Aquí tienes lo que está pasando con tu negocio.">
    <RouterLink class="button button-primary" to="/catalog"><span>＋</span> Explorar catálogo</RouterLink>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <div class="welcome-banner">
    <div>
      <span class="welcome-label">TU NEGOCIO, A TU MANERA</span>
      <h2>Todo empieza con una buena idea.</h2>
      <p>Explora productos, crea tu primer diseño y comienza a construir tu catálogo.</p>
      <RouterLink to="/catalog" class="text-link">Encuentra inspiración <span>→</span></RouterLink>
    </div>
    <div class="welcome-art" aria-hidden="true"><div class="art-sun"></div><div class="art-card art-card-back"></div><div class="art-card art-card-front"><span>MAKE<br />IT YOURS</span><i>✳</i></div><div class="art-plant">〰</div></div>
  </div>
  <section class="metric-grid">
    <article class="metric-card"><div class="metric-top"><span>Productos activos</span><span class="metric-icon lavender">◇</span></div><strong>{{ busy ? "—" : products.length }}</strong><small>En tu catálogo</small></article>
    <article class="metric-card"><div class="metric-top"><span>Pedidos recibidos</span><span class="metric-icon mint">▤</span></div><strong>{{ busy ? "—" : orders.length }}</strong><small>Pedidos registrados</small></article>
    <article class="metric-card"><div class="metric-top"><span>Ventas registradas</span><span class="metric-icon peach">$</span></div><strong>{{ busy ? "—" : formatCurrency(orders.reduce((sum, order) => sum + order.customerTotal, 0)) }}</strong><small>Total de pedidos capturados</small></article>
    <article class="metric-card"><div class="metric-top"><span>Por atender</span><span class="metric-icon yellow">◷</span></div><strong>{{ busy ? "—" : orders.filter(order => ["received", "awaiting_approval", "action_required"].includes(order.status)).length }}</strong><small>Pedidos que requieren seguimiento</small></article>
  </section>

  <section v-if="isAdmin" class="content-card admin-analytics">
    <div class="section-heading compact">
      <div><h2>Ventas y rendimiento</h2><p>Vista ejecutiva para el administrador.</p></div>
      <div class="range-switch" aria-label="Seleccionar rango de fechas">
        <button v-for="option in rangeOptions" :key="option.key" type="button" class="range-button" :class="{ active: selectedRange === option.key }" @click="selectedRange = option.key">
          {{ option.label }}
        </button>
      </div>
      <RouterLink class="text-link" to="/support">Atención al cliente <span>→</span></RouterLink>
    </div>

    <div class="analytics-grid">
      <div class="analytics-stat">
        <span>Ingresos del rango</span>
        <strong>{{ busy ? "—" : formatCurrency(totalRangeSales) }}</strong>
      </div>
      <div class="analytics-stat">
        <span>Pedidos en rango</span>
        <strong>{{ busy ? "—" : totalRangeOrders }}</strong>
      </div>
      <div class="analytics-stat">
        <span>Ticket promedio</span>
        <strong>{{ busy ? "—" : formatCurrency(averageOrderValue) }}</strong>
      </div>
    </div>

    <div class="chart-panel" aria-label="Gráfico de ventas por días">
      <svg class="sales-svg" viewBox="0 0 560 220" role="img" aria-label="Serie de ventas del período seleccionado">
        <g v-for="lineIndex in 4" :key="lineIndex">
          <line :x1="24" :x2="536" :y1="30 + lineIndex * 42" :y2="30 + lineIndex * 42" class="chart-grid-line" />
        </g>
        <polyline :points="chartPoints" class="chart-line" />
        <circle v-for="(item, index) in salesTrend" :key="`${item.label}-${index}`" :cx="24 + (salesTrend.length > 1 ? (index * 488) / (salesTrend.length - 1) : 0)" :cy="180 - (item.value / maxSales) * 150" r="4.5" class="chart-point" />
      </svg>
      <div class="bar-chart">
        <div v-for="item in salesTrend" :key="item.label" class="bar-column">
          <span class="bar-value">{{ formatCurrency(item.value) }}</span>
          <span class="bar" :style="{ height: `${(item.value / maxSales) * 100}%` }"></span>
          <small>{{ item.label }}</small>
        </div>
      </div>
    </div>

    <section class="sla-report" aria-label="Reporte de atención al cliente y SLA">
      <div class="sla-heading">
        <div>
          <h3>Atención al cliente y SLA</h3>
          <p>Tiempo de primera respuesta objetivo: {{ supportMetrics?.responseTargetHours ?? 4 }} h · Resolución objetivo: {{ supportMetrics?.resolutionTargetHours ?? 24 }} h</p>
        </div>
        <span>{{ selectedRange === "7d" ? "Últimos 7 días" : selectedRange === "30d" ? "Últimos 30 días" : "Últimos 90 días" }}</span>
      </div>
      <div v-if="supportMetricsLoading && !supportMetrics" class="loading-state">Calculando métricas de soporte...</div>
      <template v-else-if="supportMetrics">
        <div class="sla-metric-grid">
          <article class="sla-metric">
            <span>Tickets activos</span>
            <strong>{{ supportMetrics.active }}</strong>
            <small>{{ supportMetrics.total }} recibidos en el rango</small>
          </article>
          <article class="sla-metric">
            <span>Primera respuesta promedio</span>
            <strong>{{ formatDuration(supportMetrics.averageFirstResponseMinutes) }}</strong>
            <small>{{ supportMetrics.responseSlaBreaches }} fuera de SLA</small>
          </article>
          <article class="sla-metric">
            <span>Resolución promedio</span>
            <strong>{{ formatDuration(supportMetrics.averageResolutionMinutes) }}</strong>
            <small>{{ supportMetrics.resolved }} tickets resueltos</small>
          </article>
        </div>
        <div class="sla-compliance-grid">
          <article class="sla-compliance">
            <div class="sla-compliance-copy">
              <span>Respuesta dentro de SLA</span>
              <strong>{{ formatPercent(supportMetrics.responseSlaPercent) }}</strong>
            </div>
            <div class="sla-progress" role="progressbar" aria-label="Respuesta dentro de SLA" :aria-valuenow="Math.round(supportMetrics.responseSlaPercent ?? 0)" aria-valuemin="0" aria-valuemax="100">
              <span :style="{ width: `${supportMetrics.responseSlaPercent ?? 0}%` }"></span>
            </div>
            <small>{{ supportMetrics.responseSlaMet }} de {{ supportMetrics.responseSlaEligible }} tickets evaluados</small>
          </article>
          <article class="sla-compliance">
            <div class="sla-compliance-copy">
              <span>Resolución dentro de SLA</span>
              <strong>{{ formatPercent(supportMetrics.resolutionSlaPercent) }}</strong>
            </div>
            <div class="sla-progress" role="progressbar" aria-label="Resolución dentro de SLA" :aria-valuenow="Math.round(supportMetrics.resolutionSlaPercent ?? 0)" aria-valuemin="0" aria-valuemax="100">
              <span :style="{ width: `${supportMetrics.resolutionSlaPercent ?? 0}%` }"></span>
            </div>
            <small>{{ supportMetrics.resolutionSlaMet }} de {{ supportMetrics.resolutionSlaEligible }} tickets evaluados</small>
          </article>
        </div>
        <div v-if="recentSupportDays.length" class="sla-daily-report">
          <div class="sla-daily-heading">
            <h4>Tickets creados / resueltos por día</h4>
            <div class="sla-legend"><span class="legend-created">Creados</span><span class="legend-resolved">Resueltos</span></div>
          </div>
          <div class="sla-daily-grid">
            <article v-for="day in recentSupportDays" :key="day.date">
              <time>{{ new Date(`${day.date}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) }}</time>
              <div class="sla-daily-bars">
                <span class="sla-created-bar" :style="{ width: `${(day.created / maxDailyTickets) * 100}%` }"></span>
                <span class="sla-resolved-bar" :style="{ width: `${(day.resolved / maxDailyTickets) * 100}%` }"></span>
              </div>
              <small>{{ day.created }} / {{ day.resolved }}</small>
            </article>
          </div>
        </div>
      </template>
      <div v-else class="empty-state compact">No se pudieron cargar las métricas de soporte.</div>
    </section>

    <div v-if="priorityOrders.length" class="priority-list">
      <div v-for="order in priorityOrders" :key="order.id" class="priority-item">
        <div>
          <strong>#{{ order.orderNumber }}</strong>
          <span>{{ order.customerName }}</span>
        </div>
        <StatusBadge :status="order.status" />
      </div>
    </div>
  </section>

  <section class="content-card">
    <div class="section-heading">
      <div><h2>Pedidos recientes</h2><p>El estado de tus últimas órdenes.</p></div>
      <RouterLink class="text-link" to="/orders">Ver todos <span>→</span></RouterLink>
    </div>
    <div v-if="busy" class="loading-state">Cargando tus movimientos...</div>
    <div v-else-if="orders.length" class="table-wrap">
      <table><thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody><tr v-for="order in orders.slice(0, 5)" :key="order.id"><td class="strong-cell">#{{ order.orderNumber }}</td><td>{{ order.customerName }}</td><td>{{ new Date(order.createdAt).toLocaleDateString("es-MX") }}</td><td>{{ formatCurrency(order.customerTotal, order.currency) }}</td><td><StatusBadge :status="order.status" /></td></tr></tbody>
      </table>
    </div>
    <div v-else class="empty-state"><span class="empty-icon">▤</span><strong>Aún no hay pedidos</strong><p>Cuando registres pedidos, aparecerán aquí.</p><RouterLink class="button button-secondary" to="/orders">Ver pedidos</RouterLink></div>
  </section>
</template>

<style scoped>
.admin-analytics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.compact {
  align-items: center;
}
.range-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(118, 130, 243, 0.08);
  border: 1px solid rgba(118, 130, 243, 0.14);
  border-radius: 999px;
  padding: 0.3rem;
}
.range-button {
  border: none;
  background: transparent;
  color: #4c5567;
  font-weight: 600;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
}
.range-button.active {
  background: linear-gradient(135deg, #6f5ae6, #9d7eff);
  color: white;
  box-shadow: 0 10px 20px rgba(112, 93, 230, 0.22);
}
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.analytics-stat {
  background: linear-gradient(180deg, rgba(111, 90, 230, 0.06), rgba(111, 90, 230, 0.02));
  border: 1px solid rgba(111, 90, 230, 0.12);
  border-radius: 18px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.analytics-stat span {
  color: #5b647a;
  font-size: 0.8rem;
}
.analytics-stat strong {
  font-size: clamp(1.25rem, 2vw, 1.7rem);
}
.chart-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(114, 105, 252, 0.04));
  border: 1px solid rgba(124, 131, 180, 0.15);
  border-radius: 18px;
  padding: 1rem;
}
.sales-svg {
  width: 100%;
  height: 220px;
  display: block;
}
.chart-grid-line {
  stroke: rgba(108, 118, 149, 0.18);
  stroke-width: 1;
}
.chart-line {
  fill: none;
  stroke: #6f5ae6;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chart-point {
  fill: #fff;
  stroke: #6f5ae6;
  stroke-width: 2;
}
.bar-chart {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(42px, 1fr));
  gap: 0.75rem;
  align-items: end;
  min-height: 150px;
  margin-top: 0.25rem;
}
.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-height: 120px;
}
.bar-value {
  font-size: 0.65rem;
  color: #54607a;
  text-align: center;
  white-space: nowrap;
}
.bar {
  width: 100%;
  min-height: 8px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(180deg, #8b7fff 0%, #6f5ae6 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}
.bar-column small {
  font-size: 0.68rem;
  color: #5d6982;
}
.priority-list {
  display: grid;
  gap: 0.75rem;
}
.priority-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: rgba(122, 132, 160, 0.04);
  border: 1px solid rgba(125, 134, 160, 0.12);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}
.priority-item div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.priority-item span {
  color: #4b5871;
}
.sla-report {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}
.sla-heading,
.sla-compliance-copy {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.sla-heading h3 {
  margin: 0 0 0.25rem;
}
.sla-heading p,
.sla-heading > span {
  color: #68738a;
  font-size: 0.82rem;
  margin: 0;
}
.sla-heading > span {
  white-space: nowrap;
}
.sla-metric-grid,
.sla-compliance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}
.sla-compliance-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.sla-metric,
.sla-compliance {
  border: 1px solid rgba(125, 134, 160, 0.14);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.sla-metric > span,
.sla-compliance-copy > span {
  color: #5b647a;
  font-size: 0.8rem;
}
.sla-metric strong {
  font-size: 1.35rem;
}
.sla-metric small,
.sla-compliance small {
  color: #68738a;
  font-size: 0.75rem;
}
.sla-compliance-copy {
  align-items: center;
}
.sla-compliance-copy strong {
  font-size: 1.15rem;
}
.sla-progress {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf0f7;
}
.sla-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6f5ae6, #73c5a5);
}
.sla-daily-report {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(125, 134, 160, 0.14);
  border-radius: 14px;
  background: #fff;
}
.sla-daily-heading,
.sla-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.sla-daily-heading h4 {
  margin: 0;
  font-size: 0.88rem;
}
.sla-legend {
  justify-content: flex-start;
  font-size: 0.72rem;
  color: #68738a;
}
.sla-legend span::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 0.3rem;
  border-radius: 50%;
}
.legend-created::before { background: #6f5ae6; }
.legend-resolved::before { background: #73c5a5; }
.sla-daily-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(52px, 1fr));
  gap: 0.5rem;
}
.sla-daily-grid article {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.sla-daily-grid time,
.sla-daily-grid small {
  color: #68738a;
  font-size: 0.65rem;
  text-align: center;
}
.sla-daily-bars {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  height: 30px;
}
.sla-daily-bars span {
  min-width: 2px;
  height: 7px;
  border-radius: 999px;
}
.sla-created-bar { background: #6f5ae6; }
.sla-resolved-bar { background: #73c5a5; }
@media (max-width: 768px) {
  .section-heading.compact {
    flex-direction: column;
    align-items: flex-start;
  }
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .sla-metric-grid,
  .sla-compliance-grid {
    grid-template-columns: 1fr;
  }
  .sla-heading {
    flex-direction: column;
  }
}
</style>
