<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import StatusBadge from "../components/StatusBadge.vue";
import ArtworkImage from "../components/ArtworkImage.vue";
import api, { getErrorMessage } from "../services/api";
import type { Product } from "../types";

type JobStatus = "queued" | "prepress" | "ready" | "in_production" | "quality_check" | "packed" | "shipped" | "completed" | "blocked" | "cancelled";
type MachineStatus = "active" | "maintenance" | "inactive";
interface Machine { id: string; name: string; technology: string; location: string | null; status: MachineStatus; _count?: { productionJobs: number } }
interface Material { id: string; sku: string; name: string; unit: string; onHand: number; reorderPoint: number; unitCost: number; currency: string; lowStock: boolean }
interface Job {
  id: string;
  code: string;
  orderId: string;
  status: JobStatus;
  quantity: number;
  blockedReason: string | null;
  productionMethod: string | null;
  estimatedMinutes: number | null;
  notes: string | null;
  product: { id: string; name: string; productionMethod: string | null };
  order: {
    orderNumber: string;
    customerName: string;
    hasShippingAddress: boolean;
    productionJobs: Array<{ id: string; status: JobStatus; quantity: number }>;
  };
  orderItem: {
    artworkUrl: string | null;
    artworkSides?: Partial<Record<"front" | "back", string>>;
    printInstructions: string | null;
    designConfig: {
      side?: "front" | "back";
      color?: string;
      text?: string;
      scale?: number;
      x?: number;
      y?: number;
      rotation?: number;
      labelShape?: "rectangle" | "rounded" | "circle" | "oval";
      garmentLabelEnabled?: boolean;
      garmentLabelText?: string;
      garmentLabelUsesArtwork?: boolean;
      options?: Record<string, string>;
      design?: {
        text: string;
        textColor: string;
        sides: Record<"front" | "back", { artwork: boolean; positionX: number; positionY: number; scale: number; rotation?: number }>;
      };
    } | null;
  };
  machine: { id: string; name: string } | null;
  shipment: {
    id: string;
    carrier: string;
    trackingNumber: string | null;
    packageTrackingNumbers: string[];
    trackingUrl: string | null;
    status: string;
    trackingStatus: string | null;
    upsServiceName: string | null;
    labelUrls: string[];
  } | null;
}
interface UpsSetupStatus { labelReady: boolean }
interface Requirement { materialId: string; quantity: number; material?: { name: string; unit: string } }
interface StockMovement { id: string; type: "receipt" | "adjustment" | "consumption" | "return"; quantity: number; note: string | null; createdAt: string }

const jobs = ref<Job[]>([]);
const route = useRoute();
const machines = ref<Machine[]>([]);
const materials = ref<Material[]>([]);
const products = ref<Product[]>([]);
const upsStatus = ref<UpsSetupStatus>({ labelReady: false });
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const activeTab = ref<"jobs" | "machines" | "materials">("jobs");
const machineForm = ref({ name: "", technology: "", location: "" });
const materialForm = ref({ sku: "", name: "", unit: "pieza", onHand: 0, reorderPoint: 0, unitCost: 0, currency: "MXN" });
const selectedProductId = ref("");
const requirements = ref<Requirement[]>([]);
const movementMaterial = ref<Material | null>(null);
const movements = ref<StockMovement[]>([]);
const linkedJobId = computed(() => typeof route.query.jobId === "string" ? route.query.jobId : "");
const filteredJobs = computed(() => jobs.value.filter((job) =>
  (job.status !== "completed" && job.status !== "cancelled") || job.id === linkedJobId.value,
));
const lowStockCount = computed(() => materials.value.filter((material) => material.lowStock).length);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [jobResponse, machineResponse, materialResponse, productResponse, upsResponse] = await Promise.all([
      api.get("/production/jobs"),
      api.get("/production/machines"),
      api.get("/production/materials"),
      api.get("/products"),
      api.get<UpsSetupStatus>("/providers/ups/status"),
    ]);
    jobs.value = jobResponse.data.items as Job[];
    machines.value = machineResponse.data.items as Machine[];
    materials.value = materialResponse.data.items as Material[];
    products.value = productResponse.data.items as Product[];
    upsStatus.value = upsResponse.data;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
    await focusLinkedJob();
  }
}

async function focusLinkedJob() {
  if (!linkedJobId.value) return;
  activeTab.value = "jobs";
  await nextTick();
  document.getElementById(`job-${linkedJobId.value}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function adjustStock(material: Material) {
  const quantity = Number(window.prompt(`Ajuste de ${material.unit} (usa negativo para reducir):`, "0"));
  if (!Number.isFinite(quantity) || quantity === 0) return;
  const note = window.prompt("Motivo del ajuste:");
  if (!note?.trim()) return;
  try {
    await api.post(`/production/materials/${material.id}/movements`, { type: "adjustment", quantity, note: note.trim() });
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function showMovements(material: Material) {
  movementMaterial.value = material;
  try {
    const { data } = await api.get(`/production/materials/${material.id}/movements`);
    movements.value = data.items as StockMovement[];
  } catch (reason) {
    movementMaterial.value = null;
    error.value = getErrorMessage(reason);
  }
}

async function transition(job: Job, status: JobStatus) {
  error.value = "";
  let payload: Record<string, string> = { status };
  if (status === "blocked") {
    const blockedReason = window.prompt("¿Por qué se bloqueará este trabajo?");
    if (!blockedReason?.trim()) return;
    payload = { status, blockedReason };
  }
  if (status === "shipped") {
    if (upsStatus.value.labelReady && job.order.hasShippingAddress) return;
    const carrier = window.prompt("Paquetería:");
    if (!carrier?.trim()) return;
    const trackingNumber = window.prompt("Número de rastreo:");
    if (!trackingNumber?.trim()) return;
    const trackingUrl = window.prompt("URL de rastreo (opcional):")?.trim();
    try {
      await api.post(`/production/jobs/${job.id}/shipment`, {
        carrier: carrier.trim(),
        trackingNumber: trackingNumber.trim(),
        ...(trackingUrl ? { trackingUrl } : {}),
      });
      await load();
    } catch (reason) {
      error.value = getErrorMessage(reason);
    }
    return;
  }
  try {
    await api.patch(`/production/jobs/${job.id}/status`, payload);
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function createUpsOrderLabel(job: Job) {
  if (!upsStatus.value.labelReady || job.order.productionJobs.some((item) => item.status !== "packed")) return;
  const packageCount = job.order.productionJobs.reduce((sum, item) => sum + item.quantity, 0);
  if (!window.confirm(`Se comprará una guía UPS para ${packageCount} paquete(s) y se cargará a la cuenta UPS configurada. ¿Continuar?`)) return;
  try {
    await api.post(`/production/orders/${job.orderId}/ups-label`);
    await load();
  } catch (reason) {
    const message = getErrorMessage(reason);
    await load();
    error.value = message;
  }
}

async function updateTracking(job: Job) {
  if (!job.shipment) return;
  try {
    await api.post(`/production/shipments/${job.shipment.id}/tracking`);
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function reconcileUpsLabel(job: Job) {
  const trackingNumbersInput = window.prompt("Confirma todos los números de rastreo visibles en UPS, separados por comas. No reintentes la compra de la guía:");
  if (!trackingNumbersInput?.trim()) return;
  const trackingNumbers = trackingNumbersInput.split(",").map((trackingNumber) => trackingNumber.trim()).filter(Boolean);
  const notes = window.prompt("Nota de conciliación (opcional):")?.trim();
  try {
    await api.post(`/production/orders/${job.orderId}/ups-label/reconcile`, {
      trackingNumbers,
      ...(notes ? { notes } : {}),
    });
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

function getResourceUrl(path: string) {
  return api.getUri({ url: path });
}

function upsTrackingUrl(trackingNumber: string) {
  return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
}

async function assignMachine(job: Job, machineId: string) {
  if (!machineId) return;
  try {
    await api.patch(`/production/jobs/${job.id}/assign`, { machineId });
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function createMachine() {
  saving.value = true;
  error.value = "";
  try {
    await api.post("/production/machines", machineForm.value);
    machineForm.value = { name: "", technology: "", location: "" };
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function setMachineStatus(machine: Machine, status: MachineStatus) {
  try {
    await api.patch(`/production/machines/${machine.id}/status`, { status });
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function createMaterial() {
  saving.value = true;
  error.value = "";
  try {
    await api.post("/production/materials", materialForm.value);
    materialForm.value = { sku: "", name: "", unit: "pieza", onHand: 0, reorderPoint: 0, unitCost: 0, currency: "MXN" };
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function restock(material: Material) {
  const quantity = Number(window.prompt(`Cantidad de ${material.unit} recibida:`, "1"));
  if (!Number.isFinite(quantity) || quantity <= 0) return;
  try {
    await api.post(`/production/materials/${material.id}/movements`, { type: "receipt", quantity, note: "Recepción desde el panel" });
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function loadRequirements(productId: string) {
  selectedProductId.value = productId;
  requirements.value = [];
  if (!productId) return;
  try {
    const { data } = await api.get(`/production/products/${productId}/materials`);
    requirements.value = data.requirements.map((requirement: Requirement) => ({
      materialId: requirement.materialId,
      quantity: requirement.quantity,
    }));
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function saveRequirements() {
  if (!selectedProductId.value) return;
  try {
    await api.put(`/production/products/${selectedProductId.value}/materials`, { requirements: requirements.value });
    error.value = "";
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

function nextStatus(status: JobStatus): JobStatus | null {
  const next: Partial<Record<JobStatus, JobStatus>> = {
    queued: "prepress",
    prepress: "ready",
    ready: "in_production",
    in_production: "quality_check",
    quality_check: "packed",
    packed: "shipped",
    shipped: "completed",
    blocked: "queued",
  };
  return next[status] ?? null;
}

watch(activeTab, () => { error.value = ""; });
watch(() => route.query.jobId, () => {
  void focusLinkedJob();
});
onMounted(load);
</script>

<template>
  <PageHeader title="Producción propia" description="Administra tus equipos, materiales y trabajos de fabricación sin depender de un proveedor externo.">
    <button class="button button-secondary" :disabled="loading" @click="load">↻ Actualizar</button>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <section class="production-metrics">
    <article class="metric-card"><div class="metric-top">Trabajos activos <span class="metric-icon lavender">▤</span></div><strong>{{ filteredJobs.length }}</strong><small>En cola o proceso</small></article>
    <article class="metric-card"><div class="metric-top">Equipos activos <span class="metric-icon mint">⚙</span></div><strong>{{ machines.filter((machine) => machine.status === "active").length }}</strong><small>{{ machines.length }} registrados</small></article>
    <article class="metric-card"><div class="metric-top">Materiales <span class="metric-icon peach">▦</span></div><strong>{{ materials.length }}</strong><small>En inventario</small></article>
    <article class="metric-card"><div class="metric-top">Alertas de stock <span class="metric-icon yellow">!</span></div><strong>{{ lowStockCount }}</strong><small>En punto de reposición</small></article>
  </section>
  <div class="production-tabs" role="tablist">
    <button :class="{ active: activeTab === 'jobs' }" @click="activeTab = 'jobs'">Cola de producción</button>
    <button :class="{ active: activeTab === 'machines' }" @click="activeTab = 'machines'">Equipos</button>
    <button :class="{ active: activeTab === 'materials' }" @click="activeTab = 'materials'">Materiales y recetas</button>
  </div>

  <section v-if="activeTab === 'jobs'" class="content-card production-card">
    <div class="section-heading"><div><h2>Trabajos de producción</h2><p>Los pedidos internos aparecen aquí automáticamente.</p></div><span class="table-count">{{ filteredJobs.length }} activos</span></div>
    <div v-if="loading" class="loading-state">Cargando trabajos...</div>
    <div v-else-if="filteredJobs.length" class="production-list">
      <article v-for="job in filteredJobs" :id="`job-${job.id}`" :key="job.id" class="production-job" :class="{ 'linked-resource': linkedJobId === job.id }">
        <div class="job-main">
          <div class="job-code">{{ job.code }}</div>
          <h3>{{ job.product.name }} <span>× {{ job.quantity }}</span></h3>
          <p>Pedido {{ job.order.orderNumber }} · {{ job.order.customerName }}</p>
          <RouterLink class="text-link" :to="{ name: 'support', query: { orderId: job.orderId, productionJobId: job.id } }">Reportar incidencia de producción <span>→</span></RouterLink>
          <p class="job-details">{{ job.productionMethod || job.product.productionMethod || "Método por definir" }}<span v-if="job.estimatedMinutes"> · {{ job.estimatedMinutes }} min estimados</span></p>
          <p v-if="job.notes" class="job-details">{{ job.notes }}</p>
          <div v-if="job.orderItem.artworkSides?.front || job.orderItem.artworkSides?.back" class="production-print-art-sides">
            <div v-if="job.orderItem.artworkSides.front"><span>Frente</span><ArtworkImage :src="job.orderItem.artworkSides.front" :alt="`Arte frontal para ${job.product.name}`" /></div>
            <div v-if="job.orderItem.artworkSides.back"><span>Parte trasera</span><ArtworkImage :src="job.orderItem.artworkSides.back" :alt="`Arte trasero para ${job.product.name}`" /></div>
          </div>
          <div v-else-if="job.orderItem.artworkUrl" class="production-print-art"><ArtworkImage :src="job.orderItem.artworkUrl" :alt="`Arte de impresión para ${job.product.name}`" /></div>
          <p v-if="job.orderItem.designConfig?.design" class="job-details">
            <span v-for="side in (['front', 'back'] as const)" :key="side">
              <span v-if="job.orderItem.designConfig.design.sides[side].artwork || job.orderItem.designConfig.design.text">{{ side === "front" ? "Frente" : "Parte trasera" }}: escala {{ job.orderItem.designConfig.design.sides[side].scale }}% · posición {{ job.orderItem.designConfig.design.sides[side].positionX }}% / {{ job.orderItem.designConfig.design.sides[side].positionY }}% · giro {{ job.orderItem.designConfig.design.sides[side].rotation ?? 0 }}° · </span>
            </span>
            <span v-if="job.orderItem.designConfig.design.text">Texto: “{{ job.orderItem.designConfig.design.text }}”</span>
          </p>
          <p v-else-if="job.orderItem.designConfig" class="job-details">Diseño {{ job.orderItem.designConfig.side === "front" ? "frontal" : "posterior" }} · escala {{ job.orderItem.designConfig.scale }}% · posición {{ job.orderItem.designConfig.x }}% / {{ job.orderItem.designConfig.y }}% · giro {{ job.orderItem.designConfig.rotation }}°<span v-if="job.orderItem.designConfig.labelShape"> · etiqueta {{ { rectangle: "rectangular", rounded: "redondeada", circle: "circular", oval: "ovalada" }[job.orderItem.designConfig.labelShape] }}</span><span v-if="job.orderItem.designConfig.garmentLabelEnabled"> · etiqueta interior de cuello<span v-if="job.orderItem.designConfig.garmentLabelText">: “{{ job.orderItem.designConfig.garmentLabelText }}”</span><span v-if="job.orderItem.designConfig.garmentLabelUsesArtwork"> con logo</span></span><span v-if="job.orderItem.designConfig.text"> · “{{ job.orderItem.designConfig.text }}”</span></p>
          <p v-if="job.orderItem.printInstructions" class="job-details">Indicaciones del cliente: {{ job.orderItem.printInstructions }}</p>
          <p v-if="job.blockedReason" class="job-blocked">Bloqueado: {{ job.blockedReason }}</p>
          <div v-if="job.status === 'packed' && job.order.productionJobs[0]?.id === job.id && upsStatus.labelReady && job.order.hasShippingAddress" class="job-details">
            <button
              v-if="!job.shipment"
              type="button"
              class="button button-primary"
              :disabled="job.order.productionJobs.some((item) => item.status !== 'packed')"
              @click="createUpsOrderLabel(job)"
            >
              {{ job.order.productionJobs.some((item) => item.status !== 'packed') ? "Empaca todos los productos para crear guía UPS" : "Crear guía UPS para todo el pedido" }}
            </button>
          </div>
          <div v-if="job.shipment && (job.shipment.carrier !== 'UPS' || job.order.productionJobs[0]?.id === job.id)" class="job-details">
            <p>{{ job.shipment.carrier }}<span v-if="job.shipment.upsServiceName"> · {{ job.shipment.upsServiceName }}</span><span v-if="job.shipment.trackingNumber"> · {{ job.shipment.trackingNumber }}</span></p>
            <p v-if="job.shipment.packageTrackingNumbers.length > 1">
              Paquetes:
              <template v-for="(trackingNumber, trackingIndex) in job.shipment.packageTrackingNumbers" :key="trackingNumber">
                <a :href="upsTrackingUrl(trackingNumber)" target="_blank" rel="noopener noreferrer">{{ trackingNumber }}</a><span v-if="trackingIndex < job.shipment.packageTrackingNumbers.length - 1"> · </span>
              </template>
            </p>
            <p v-if="job.shipment.trackingStatus">Estado UPS: {{ job.shipment.trackingStatus }}</p>
            <p v-if="job.shipment.status === 'label_pending_review' || job.shipment.status === 'label_storage_pending'">La compra de la guía necesita revisión. Verifica UPS antes de registrar el rastreo; no vuelvas a comprarla.</p>
            <div class="form-actions">
              <a v-for="(labelUrl, index) in job.shipment.labelUrls" :key="labelUrl" class="text-link" :href="getResourceUrl(labelUrl)">Descargar guía {{ index + 1 }}</a>
              <a v-if="job.shipment.trackingUrl" class="text-link" :href="job.shipment.trackingUrl" target="_blank" rel="noopener noreferrer">Abrir rastreo UPS</a>
              <button v-if="job.shipment.carrier === 'UPS' && job.shipment.trackingNumber && job.shipment.status !== 'delivered'" type="button" class="text-button" @click="updateTracking(job)">Actualizar rastreo</button>
              <button v-if="job.shipment.status === 'label_pending_review' || job.shipment.status === 'label_storage_pending'" type="button" class="text-button" @click="reconcileUpsLabel(job)">Reconciliar guía</button>
            </div>
          </div>
        </div>
        <div class="job-controls">
          <label class="field"><span>Equipo asignado</span><select :value="job.machine?.id ?? ''" @change="assignMachine(job, ($event.target as HTMLSelectElement).value)"><option value="">Sin asignar</option><option v-for="machine in machines.filter((item) => item.status === 'active')" :key="machine.id" :value="machine.id">{{ machine.name }}</option></select></label>
          <StatusBadge :status="job.status" />
          <button v-if="nextStatus(job.status) && !(job.status === 'packed' && upsStatus.labelReady && job.order.hasShippingAddress) && !(job.status === 'shipped' && job.shipment?.carrier === 'UPS')" class="button button-primary" @click="transition(job, nextStatus(job.status)!)">{{ job.status === "packed" ? "Registrar envío" : job.status === "blocked" ? "Reanudar" : job.status === "shipped" ? "Confirmar entrega" : "Avanzar etapa" }}</button>
          <button v-if="job.status !== 'blocked' && job.status !== 'completed' && job.status !== 'cancelled'" class="text-button job-block-button" @click="transition(job, 'blocked')">Bloquear</button>
        </div>
      </article>
    </div>
    <div v-else-if="!loading" class="empty-state"><span class="empty-icon">▤</span><strong>La cola está vacía</strong><p>Al crear pedidos con productos de fabricación propia, sus trabajos aparecerán aquí.</p><RouterLink class="button button-primary" to="/orders">Ir a pedidos</RouterLink></div>
  </section>

  <section v-else-if="activeTab === 'machines'" class="production-columns">
    <div class="content-card production-card">
      <div class="section-heading"><div><h2>Equipos</h2><p>Máquinas disponibles para asignación.</p></div><span class="table-count">{{ machines.length }} total</span></div>
      <div v-if="machines.length" class="resource-list">
        <article v-for="machine in machines" :key="machine.id" class="resource-row">
          <div class="resource-icon">⚙</div><div class="resource-info"><strong>{{ machine.name }}</strong><span>{{ machine.technology }}<template v-if="machine.location"> · {{ machine.location }}</template></span></div>
          <select :value="machine.status" class="status-select" aria-label="Estado del equipo" @change="setMachineStatus(machine, ($event.target as HTMLSelectElement).value as MachineStatus)"><option value="active">Activo</option><option value="maintenance">Mantenimiento</option><option value="inactive">Inactivo</option></select>
        </article>
        <p v-if="!loading" class="resource-footnote">Los trabajos activos asignados se muestran en la cola de producción.</p>
      </div>
      <div v-else class="empty-compact">Registra el primer equipo para comenzar.</div>
    </div>
    <div class="content-card production-card">
      <div class="section-heading"><div><h2>Registrar equipo</h2><p>Indica la tecnología y su ubicación.</p></div></div>
      <form class="product-form" @submit.prevent="createMachine">
        <label class="field"><span>Nombre</span><input v-model="machineForm.name" required minlength="2" placeholder="Impresora DTG 01" /></label>
        <label class="field"><span>Tecnología</span><input v-model="machineForm.technology" required minlength="2" placeholder="DTG, sublimación, bordado..." /></label>
        <label class="field"><span>Ubicación (opcional)</span><input v-model="machineForm.location" placeholder="Taller principal" /></label>
        <button class="button button-primary" :disabled="saving">{{ saving ? "Guardando..." : "Registrar equipo" }}</button>
      </form>
    </div>
  </section>

  <section v-else class="production-columns">
    <div class="content-card production-card">
      <div class="section-heading"><div><h2>Inventario de materiales</h2><p>Las cantidades se descuentan al iniciar producción.</p></div><span class="table-count">{{ materials.length }} materiales</span></div>
      <div v-if="materials.length" class="resource-list">
        <article v-for="material in materials" :key="material.id" class="resource-row">
          <div class="resource-icon material-icon">▦</div><div class="resource-info"><strong>{{ material.name }} <small>{{ material.sku }}</small></strong><span :class="{ 'negative-value': material.lowStock }">{{ material.onHand }} {{ material.unit }} · reposición en {{ material.reorderPoint }}</span></div>
          <div class="stock-actions">
            <button class="button button-secondary" @click="showMovements(material)">Historial</button>
            <button class="button button-secondary" @click="adjustStock(material)">Ajustar</button>
            <button class="button button-secondary" @click="restock(material)">＋ Recibir</button>
          </div>
        </article>
      </div>
      <div v-else class="empty-compact">Agrega materiales para monitorear el inventario.</div>
      <form class="product-form inline-resource-form" @submit.prevent="createMaterial">
        <div class="section-heading"><div><h2>Agregar material</h2><p>El inventario inicial se registrará como recepción.</p></div></div>
        <div class="field-row"><label class="field"><span>SKU</span><input v-model="materialForm.sku" required /></label><label class="field"><span>Nombre</span><input v-model="materialForm.name" required minlength="2" /></label></div>
        <div class="field-row"><label class="field"><span>Unidad</span><input v-model="materialForm.unit" required placeholder="pieza, metro, ml..." /></label><label class="field"><span>Existencia inicial</span><input v-model.number="materialForm.onHand" type="number" min="0" step="0.001" /></label></div>
        <div class="field-row"><label class="field"><span>Punto de reposición</span><input v-model.number="materialForm.reorderPoint" type="number" min="0" step="0.001" /></label><label class="field"><span>Costo por unidad</span><input v-model.number="materialForm.unitCost" type="number" min="0" step="0.01" /></label></div>
        <button class="button button-primary" :disabled="saving">{{ saving ? "Guardando..." : "Agregar material" }}</button>
      </form>
    </div>
    <div class="content-card production-card">
      <div class="section-heading"><div><h2>Consumo por producto</h2><p>Define cuánto material requiere cada unidad producida.</p></div></div>
      <form class="product-form" @submit.prevent="saveRequirements">
        <label class="field"><span>Producto de fabricación propia</span><select :value="selectedProductId" @change="loadRequirements(($event.target as HTMLSelectElement).value)"><option value="">Selecciona un producto</option><option v-for="product in products.filter((item) => item.fulfillmentMode === 'in_house' && item.status !== 'archived')" :key="product.id" :value="product.id">{{ product.name }}</option></select></label>
        <template v-if="selectedProductId">
          <div v-for="(requirement, index) in requirements" :key="index" class="requirement-row">
            <select v-model="requirement.materialId" required aria-label="Material"><option value="" disabled>Selecciona material</option><option v-for="material in materials" :key="material.id" :value="material.id">{{ material.name }} ({{ material.unit }})</option></select>
            <input v-model.number="requirement.quantity" type="number" min="0.001" step="0.001" required aria-label="Cantidad por unidad" />
            <button type="button" class="icon-button" aria-label="Eliminar requisito" @click="requirements.splice(index, 1)">×</button>
          </div>
          <button type="button" class="button button-secondary" @click="requirements.push({ materialId: '', quantity: 1 })">＋ Añadir material</button>
          <button class="button button-primary">Guardar consumo</button>
        </template>
        <p v-else class="resource-footnote">Las recetas vinculan materiales al producto y evitan iniciar trabajos sin existencias suficientes.</p>
      </form>
    </div>
  </section>
  <div v-if="movementMaterial" class="modal-backdrop" @click.self="movementMaterial = null">
    <section class="modal-card movement-modal">
      <button class="modal-close icon-button" aria-label="Cerrar historial" @click="movementMaterial = null">×</button>
      <p class="eyebrow">INVENTARIO</p>
      <h2>Movimientos: {{ movementMaterial.name }}</h2>
      <div v-if="movements.length" class="movement-list">
        <article v-for="movement in movements" :key="movement.id" class="movement-row">
          <span class="movement-type">{{ ({ receipt: "Recepción", adjustment: "Ajuste", consumption: "Consumo", return: "Devolución" })[movement.type] }}</span>
          <strong :class="movement.quantity < 0 ? 'negative-value' : 'positive-value'">{{ movement.quantity > 0 ? "+" : "" }}{{ movement.quantity }} {{ movementMaterial.unit }}</strong>
          <span>{{ movement.note || "Sin nota" }}</span>
          <time>{{ new Date(movement.createdAt).toLocaleString("es-MX") }}</time>
        </article>
      </div>
      <p v-else class="resource-footnote">Aún no hay movimientos registrados para este material.</p>
    </section>
  </div>
</template>
