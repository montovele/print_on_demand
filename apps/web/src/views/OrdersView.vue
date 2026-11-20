<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import StatusBadge from "../components/StatusBadge.vue";
import ArtworkImage from "../components/ArtworkImage.vue";
import api, { getErrorMessage } from "../services/api";
import type { Order, OrderStatus, Product } from "../types";
import { formatCurrency } from "../utils/money";

const orders = ref<Order[]>([]);
const route = useRoute();
const products = ref<Product[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const showForm = ref(false);
const expandedOrderId = ref<string | null>(null);
const verifyingPaymentOrderId = ref<string | null>(null);
const form = ref({ orderNumber: "", customerName: "", productId: "", quantity: 1, unitSalePrice: 0, customerTotal: 0, currency: "MXN" });
const transitions: Record<OrderStatus, OrderStatus[]> = {
  received: ["validation_pending", "awaiting_approval", "action_required"],
  validation_pending: ["awaiting_approval", "action_required", "failed"],
  awaiting_approval: ["action_required"],
  submitted: [],
  accepted: [],
  in_production: [],
  shipped: [],
  delivered: [],
  cancel_requested: [],
  cancelled: [],
  failed: ["validation_pending", "awaiting_approval"],
  action_required: ["validation_pending", "awaiting_approval"],
};
const labels: Partial<Record<OrderStatus, string>> = { received: "Recibido", validation_pending: "Validación", awaiting_approval: "Por aprobar", submitted: "Enviado", accepted: "Aceptado", in_production: "En producción", shipped: "Enviado", delivered: "Entregado", cancel_requested: "Solicitar cancelación", cancelled: "Cancelado", failed: "Fallido", action_required: "Requiere atención" };
async function load() {
  loading.value = true;
  try {
    const [orderResponse, productResponse] = await Promise.all([api.get("/orders?pageSize=100"), api.get("/products")]);
    orders.value = orderResponse.data.items as Order[];
    products.value = productResponse.data.items as Product[];
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
    await focusLinkedOrder();
  }
}

async function focusLinkedOrder() {
  const orderId = typeof route.query.orderId === "string" ? route.query.orderId : "";
  if (!orderId) return;
  await nextTick();
  document.getElementById(`order-${orderId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function chooseProduct() {
  const product = products.value.find((item) => item.id === form.value.productId);
  if (product) {
    form.value.unitSalePrice = product.salePrice;
    form.value.customerTotal = product.salePrice * form.value.quantity;
  }
}

async function createOrder() {
  saving.value = true;
  error.value = "";
  try {
    const product = products.value.find((item) => item.id === form.value.productId);
    const { data } = await api.post<Order>("/orders", {
      orderNumber: form.value.orderNumber,
      customerName: form.value.customerName,
      customerTotal: form.value.customerTotal,
      currency: form.value.currency,
      items: [{
        ...(product ? { productId: product.id } : {}),
        quantity: form.value.quantity,
        unitSalePrice: form.value.unitSalePrice,
      }],
    });
    orders.value = [data, ...orders.value];
    showForm.value = false;
    form.value = { orderNumber: "", customerName: "", productId: "", quantity: 1, unitSalePrice: 0, customerTotal: 0, currency: "MXN" };
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function changeStatus(order: Order, event: Event) {
  const status = (event.target as HTMLSelectElement).value as OrderStatus;
  if (!status) return;
  try {
    const { data } = await api.patch<Order>(`/orders/${order.id}/status`, { status });
    orders.value = orders.value.map((item) => item.id === order.id ? data : item);
  } catch (reason) {
    error.value = getErrorMessage(reason);
    await load();
  }
}

async function verifyPayment(order: Order) {
  verifyingPaymentOrderId.value = order.id;
  error.value = "";
  try {
    const { data } = await api.post<{ paymentStatus: Order["paymentStatus"] }>("/payments/checkout/verify", {
      orderId: order.id,
    });
    await load();
    if (data.paymentStatus !== "paid") {
      error.value = `Stripe todavía reporta el pago del pedido ${order.orderNumber} como pendiente.`;
    }
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    verifyingPaymentOrderId.value = null;
  }
}

function paymentLabel(status: Order["paymentStatus"]) {
  return {
    not_required: "Registrado",
    pending: "Pendiente",
    paid: "Pagado",
    failed: "Fallido",
    refunded: "Reembolsado",
  }[status];
}

function upsTrackingUrl(trackingNumber: string) {
  return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
}

onMounted(load);
watch(() => route.query.orderId, () => {
  void focusLinkedOrder();
});
</script>

<template>
  <PageHeader title="Pedidos" description="Consulta y da seguimiento a tus ventas.">
    <button class="button button-primary" @click="showForm = !showForm"><span>＋</span> Registrar pedido</button>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <section v-if="showForm" class="content-card form-card">
    <div class="section-heading"><div><h2>Registrar pedido</h2><p>Captura una orden para darle seguimiento en tu panel.</p></div><button class="icon-button" @click="showForm = false">×</button></div>
    <form class="product-form" @submit.prevent="createOrder">
      <div class="field-row">
        <label class="field"><span>Número de pedido</span><input v-model="form.orderNumber" required maxlength="100" placeholder="Ej. PED-1001" /></label>
        <label class="field"><span>Cliente</span><input v-model="form.customerName" required maxlength="191" placeholder="Nombre del cliente" /></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Producto asociado</span><select v-model="form.productId" @change="chooseProduct"><option value="">Producto manual</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select></label>
        <label class="field"><span>Cantidad</span><input v-model.number="form.quantity" type="number" min="1" max="10000" required @change="chooseProduct" /></label>
        <label class="field"><span>Precio unitario</span><input v-model.number="form.unitSalePrice" type="number" min="0" step="0.01" required /></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Total cobrado</span><input v-model.number="form.customerTotal" type="number" min="0" step="0.01" required /></label>
        <label class="field"><span>Moneda</span><select v-model="form.currency"><option>MXN</option><option>USD</option><option>EUR</option></select></label>
      </div>
      <div class="form-actions"><button type="button" class="button button-secondary" @click="showForm = false">Cancelar</button><button class="button button-primary" :disabled="saving">{{ saving ? "Guardando..." : "Guardar pedido" }}</button></div>
    </form>
  </section>
  <section class="content-card">
    <div class="section-heading"><div><h2>Todos los pedidos</h2><p>Revisa estado, canal y monto de cada orden.</p></div><span class="table-count">{{ orders.length }} pedidos</span></div>
    <div v-if="loading" class="loading-state">Cargando pedidos...</div>
    <div v-else-if="orders.length" class="table-wrap">
      <table><thead><tr><th>Pedido</th><th>Cliente</th><th>Canal</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Estado</th><th>Actualizar</th><th>Acciones</th></tr></thead>
        <tbody><template v-for="order in orders" :key="order.id"><tr :id="`order-${order.id}`" :class="{ 'linked-resource': route.query.orderId === order.id }">
          <td class="strong-cell">#{{ order.orderNumber }}</td>
          <td><strong>{{ order.customer?.name ?? order.customerName }}</strong><small class="order-customer-email">{{ order.customer?.email ?? order.customerEmail ?? "Pedido interno" }}</small></td>
          <td>{{ order.storeName }}</td><td>{{ new Date(order.createdAt).toLocaleDateString("es-MX") }}</td><td>{{ formatCurrency(order.customerTotal, order.currency) }}</td>
          <td><span class="payment-status" :class="`payment-${order.paymentStatus}`">{{ paymentLabel(order.paymentStatus) }}</span></td>
          <td><StatusBadge :status="order.status" /></td>
          <td><select class="status-select" :value="''" :disabled="!transitions[order.status].length" @change="changeStatus(order, $event)"><option value="" disabled>Actualizar</option><option v-for="status in transitions[order.status]" :key="status" :value="status">{{ labels[status] }}</option></select></td>
          <td class="order-actions">
            <button type="button" class="text-button" @click="expandedOrderId = expandedOrderId === order.id ? null : order.id">{{ expandedOrderId === order.id ? "Ocultar detalle" : "Ver detalle" }}</button>
            <RouterLink class="text-link" :to="{ name: 'support', query: { orderId: order.id } }">Soporte</RouterLink>
          </td>
        </tr>
        <tr v-if="expandedOrderId === order.id" class="order-detail-row">
          <td colspan="9">
            <div class="order-detail-grid">
              <section><h3>Cliente y envío</h3><p>{{ order.customerName }}<br />{{ order.customerEmail ?? order.customer?.email }}<span v-if="order.shippingAddress?.recipient"><br />Recibe: {{ order.shippingAddress.recipient }}</span><br />{{ order.shippingAddress?.phone }}</p>
                <p v-if="order.shippingAddress">{{ order.shippingAddress.line1 }}<span v-if="order.shippingAddress.line2">, {{ order.shippingAddress.line2 }}</span><br />{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.postalCode }}<br />{{ order.shippingAddress.country }}</p>
                <div v-for="shipment in order.shipments ?? []" :key="shipment.id" class="job-details">
                  <strong>{{ shipment.carrier }}<span v-if="shipment.trackingNumber"> · {{ shipment.trackingNumber }}</span></strong>
                  <p v-if="shipment.trackingStatus">{{ shipment.trackingStatus }}</p>
                  <p v-if="shipment.packageTrackingNumbers.length > 1">
                    Paquetes:
                    <template v-for="(trackingNumber, trackingIndex) in shipment.packageTrackingNumbers" :key="trackingNumber">
                      <a class="text-link" :href="upsTrackingUrl(trackingNumber)" target="_blank" rel="noopener noreferrer">{{ trackingNumber }}</a><span v-if="trackingIndex < shipment.packageTrackingNumbers.length - 1"> · </span>
                    </template>
                  </p>
                  <a v-if="shipment.trackingUrl" class="text-link" :href="shipment.trackingUrl" target="_blank" rel="noopener noreferrer">Abrir rastreo ↗</a>
                  <a v-for="(labelUrl, index) in shipment.labelUrls" :key="labelUrl" class="text-link" :href="api.getUri({ url: labelUrl })">Descargar guía {{ index + 1 }}</a>
                </div>
              </section>
              <section><h3>Productos e impresión</h3>
                <article v-for="item in order.items" :key="item.id" class="order-print-item">
                  <div v-if="item.artworkSides?.front || item.artworkSides?.back" class="order-print-art-sides">
                    <div v-if="item.artworkSides.front"><span>Frente</span><ArtworkImage :src="item.artworkSides.front" :alt="`Arte frontal de ${item.productName}`" /></div>
                    <div v-if="item.artworkSides.back"><span>Parte trasera</span><ArtworkImage :src="item.artworkSides.back" :alt="`Arte trasero de ${item.productName}`" /></div>
                  </div>
                  <div v-else class="order-print-art">
                    <ArtworkImage v-if="item.artworkUrl" :src="item.artworkUrl" :alt="`Arte de impresión de ${item.productName}`" />
                    <div v-else class="order-print-art-empty">Sin imagen adjunta</div>
                  </div>
                  <div class="order-print-info">
                    <strong>{{ item.productName }}<span v-if="item.variantName"> · {{ item.variantName }}</span></strong>
                    <p class="order-print-pricing">{{ item.quantity }} unidades · Venta {{ formatCurrency(item.unitSalePrice, order.currency) }} c/u · Costo interno {{ formatCurrency(item.unitProviderCost ?? 0, order.currency) }} c/u</p>
                    <div v-if="item.designConfig" class="order-print-specs">
                      <span v-if="item.designConfig.side">Lado: {{ item.designConfig.side === "front" ? "frente" : "reverso" }}</span>
                      <span v-if="item.designConfig.color || item.designConfig.options?.Color" class="order-print-color"><i :style="{ backgroundColor: item.designConfig.color || item.designConfig.options?.Color }"></i> Color base: {{ item.designConfig.color || item.designConfig.options?.Color }}</span>
                      <span v-if="item.designConfig.scale">Escala: {{ item.designConfig.scale }}%</span>
                      <span v-if="item.designConfig.x !== undefined && item.designConfig.y !== undefined">Posición: {{ item.designConfig.x }}% horizontal · {{ item.designConfig.y }}% vertical</span>
                      <span v-if="item.designConfig.rotation !== undefined">Rotación: {{ item.designConfig.rotation }}°</span>
                      <template v-for="side in (['front', 'back'] as const)" :key="side">
                        <span v-if="item.designConfig.design?.sides[side]?.artwork || item.designConfig.design?.text">
                          {{ side === "front" ? "Frente" : "Parte trasera" }}: escala {{ item.designConfig.design.sides[side].scale }}% · posición {{ item.designConfig.design.sides[side].positionX }}% / {{ item.designConfig.design.sides[side].positionY }}% · giro {{ item.designConfig.design.sides[side].rotation ?? 0 }}°
                        </span>
                      </template>
                      <span v-if="item.designConfig.labelShape">Forma de etiqueta: {{ { rectangle: "rectangular", rounded: "redondeada", circle: "circular", oval: "ovalada" }[item.designConfig.labelShape] }}</span>
                      <span v-if="item.designConfig.garmentLabelEnabled">Etiqueta interior de cuello: activada<span v-if="item.designConfig.garmentLabelText"> · Texto: “{{ item.designConfig.garmentLabelText }}”</span><span v-if="item.designConfig.garmentLabelUsesArtwork"> · usar imagen como logo</span></span>
                      <span v-if="item.designConfig.design?.text || item.designConfig.text">Texto del diseño: “{{ item.designConfig.design?.text || item.designConfig.text }}”</span>
                    </div>
                    <p v-if="item.printInstructions" class="order-print-instructions"><strong>Indicaciones para producción:</strong> {{ item.printInstructions }}</p>
                    <p v-if="!item.artworkUrl && !item.artworkSides?.front && !item.artworkSides?.back && !item.designConfig?.text && !item.designConfig?.design?.text && !item.designConfig?.garmentLabelText">No se adjuntó imagen ni texto para impresión.</p>
                  </div>
                </article>
              </section>
              <section><h3>Pago y estado</h3><p>Pago: {{ paymentLabel(order.paymentStatus) }}</p><p>Pedido: {{ labels[order.status] ?? order.status }}</p><p>Total cliente: {{ formatCurrency(order.customerTotal, order.currency) }}</p><p v-if="order.providerTotal !== null">Costo proveedor: {{ formatCurrency(order.providerTotal, order.currency) }}</p><p v-if="order.shippingTotal">Envío: {{ formatCurrency(order.shippingTotal, order.currency) }}</p><button v-if="order.paymentStatus === 'pending'" type="button" class="button button-secondary order-payment-verify" :disabled="verifyingPaymentOrderId === order.id" @click="verifyPayment(order)">{{ verifyingPaymentOrderId === order.id ? "Verificando en Stripe…" : "Verificar pago en Stripe" }}</button></section>
            </div>
          </td>
        </tr></template></tbody>
      </table>
    </div>
    <div v-else class="empty-state"><span class="empty-icon">▤</span><strong>No hay pedidos todavía</strong><p>Registra un pedido para dar seguimiento al proceso.</p><button class="button button-primary" @click="showForm = true">Registrar pedido</button></div>
  </section>
</template>
