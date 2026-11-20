<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import api, { getErrorMessage, setCsrfToken } from "../services/api";
import { deleteCustomerArtwork, loadCustomerArtwork } from "../services/customerArtwork";

interface CheckoutCartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  productId: string;
  variantId: string;
  artworkAssetId?: string;
  artworkSides?: Partial<Record<"front" | "back", string>>;
  localArtworkId?: string;
  localArtworkIds?: Partial<Record<"front" | "back", string>>;
  designConfig?: {
    text: string;
    textColor: string;
    sides: Record<"front" | "back", { artwork: boolean; positionX: number; positionY: number; scale: number; rotation?: number }>;
  };
  options?: Record<string, string>;
}

interface CatalogVariant {
  id: string;
  salePrice: number;
  currency: string;
}

interface OrderStatus {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerTotal: number;
  shipments: Array<{
    carrier: string;
    trackingNumber: string | null;
    packageTrackingNumbers: string[];
    trackingUrl: string | null;
    status: string;
    trackingStatus: string | null;
    shippedAt: string;
    deliveredAt: string | null;
  }>;
}

const route = useRoute();
const router = useRouter();
const cart = ref<CheckoutCartItem[]>([]);
const recipient = ref("");
const phone = ref("");
const addressLine1 = ref("");
const addressLine2 = ref("");
const city = ref("");
const state = ref("");
const postalCode = ref("");
const shippingQuote = ref<{ serviceName: string; serviceCode: string; currency: string; shippingCents: number; shippingTotal: number; packageCount: number } | null>(null);
const quotingShipping = ref(false);
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const notice = ref("");
const order = ref<OrderStatus | null>(null);
const subtotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const formattedTotal = computed(() => shippingQuote.value
  ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(subtotal.value + shippingQuote.value.shippingTotal)
  : "Cotiza tu envío");

function isCartItem(value: unknown): value is CheckoutCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const localArtworkIds = item.localArtworkIds;
  const artworkSides = item.artworkSides;
  const hasTextDesign = isDesignerDesign(item.designConfig) && Boolean(item.designConfig.text.trim());
  return typeof item.id === "string"
    && typeof item.name === "string"
    && typeof item.variant === "string"
    && typeof item.price === "number"
    && typeof item.quantity === "number"
    && Number.isInteger(item.quantity)
    && item.quantity > 0
    && typeof item.productId === "string"
    && typeof item.variantId === "string"
    && (
      typeof item.artworkAssetId === "string"
      || typeof item.localArtworkId === "string"
      || isArtworkSideMap(localArtworkIds)
      || isArtworkSideMap(artworkSides)
      || hasTextDesign
    )
    && (item.designConfig === undefined || isDesignerDesign(item.designConfig))
    && (item.options === undefined || isStringRecord(item.options));
}

function isArtworkSideMap(value: unknown): value is Partial<Record<"front" | "back", string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const sides = value as Record<string, unknown>;
  return Object.entries(sides).every(([side, id]) =>
    (side === "front" || side === "back") && typeof id === "string",
  ) && Object.keys(sides).length > 0;
}

function isDesignerDesign(value: unknown): value is NonNullable<CheckoutCartItem["designConfig"]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const design = value as Record<string, unknown>;
  if (typeof design.text !== "string" || typeof design.textColor !== "string" || !design.sides || typeof design.sides !== "object") return false;
  const sides = design.sides as Record<string, unknown>;
  return (["front", "back"] as const).every((side) => {
    const config = sides[side];
    if (!config || typeof config !== "object") return false;
    const values = config as Record<string, unknown>;
    return typeof values.artwork === "boolean"
      && typeof values.positionX === "number"
      && typeof values.positionY === "number"
      && typeof values.scale === "number"
      && (values.rotation === undefined || (typeof values.rotation === "number" && values.rotation >= -180 && values.rotation <= 180));
  });
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.values(value).every((option) => typeof option === "string");
}

function clearCart() {
  localStorage.removeItem("printly-customer-cart");
  cart.value = [];
  window.dispatchEvent(new Event("printly-cart-updated"));
}

function formatOptions(options?: Record<string, string>) {
  return options ? Object.entries(options).map(([label, value]) => `${label}: ${value}`).join(" · ") : "";
}

async function checkOrder(orderId: string) {
  const { data } = await api.get<OrderStatus>(`/storefront/orders/${encodeURIComponent(orderId)}`);
  order.value = data;
  if (data.paymentStatus === "paid") {
    clearCart();
    notice.value = `Pago confirmado. Tu pedido ${data.orderNumber} está en proceso.`;
  } else {
    notice.value = "Stripe recibió tu regreso, pero el pago aún se está confirmando. Actualiza el estado en unos segundos.";
  }
}

function upsTrackingUrl(trackingNumber: string) {
  return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
}

async function initialize() {
  loading.value = true;
  error.value = "";
  try {
    const { data: session } = await api.get<{ user: { name: string }; csrfToken: string }>("/auth/customer/me");
    setCsrfToken(session.csrfToken);
    recipient.value = session.user.name;

    const orderId = typeof route.query.order === "string" ? route.query.order : "";
    if (route.query.status === "success" && orderId) {
      await checkOrder(orderId);
      return;
    }
    if (route.query.status === "cancelled") {
      notice.value = "El pago se canceló. Tu bolsa sigue disponible para intentarlo de nuevo.";
    }

    const saved: unknown = JSON.parse(localStorage.getItem("printly-customer-cart") ?? "[]");
    if (!Array.isArray(saved) || !saved.every(isCartItem)) {
      throw new Error("La bolsa contiene artículos incompletos. Vuelve a elegir la presentación y el archivo de diseño.");
    }
    cart.value = saved;
    if (!cart.value.length) {
      notice.value = "Tu bolsa está vacía.";
      return;
    }

    const { data: catalog } = await api.get<{
      items: Array<{ productId: string; variants: CatalogVariant[] }>;
      designerProducts?: Array<{ productId: string; variants: CatalogVariant[] }>;
    }>("/storefront/catalog");
    const catalogProducts = [...catalog.items, ...(catalog.designerProducts ?? [])];
    for (const item of cart.value) {
      const current = catalogProducts.find((product) => product.productId === item.productId)
        ?.variants.find((variant) => variant.id === item.variantId);
      if (!current || current.currency !== "MXN" || current.salePrice <= 0) {
        throw new Error(`La presentación de ${item.name} ya no está disponible. Quita el artículo y vuelve a elegirlo.`);
      }
      item.price = current.salePrice;
    }
    const artworkToClean: string[] = [];
    for (const item of cart.value) {
      if (!item.artworkAssetId && item.localArtworkId) {
        item.artworkAssetId = await uploadLocalArtwork(item.localArtworkId, item.name);
        artworkToClean.push(item.localArtworkId);
        delete item.localArtworkId;
      }
      if (item.localArtworkIds && Object.keys(item.localArtworkIds).length) {
        const artworkSides: Partial<Record<"front" | "back", string>> = { ...item.artworkSides };
        for (const side of ["front", "back"] as const) {
          const localArtworkId = item.localArtworkIds[side];
          if (!localArtworkId) continue;
          if (!artworkSides[side]) artworkSides[side] = await uploadLocalArtwork(localArtworkId, item.name);
          artworkToClean.push(localArtworkId);
          delete item.localArtworkIds[side];
        }
        item.artworkSides = artworkSides;
        const primaryArtworkId = artworkSides.front ?? artworkSides.back;
        if (!primaryArtworkId) throw new Error(`No encontramos el archivo de diseño de ${item.name}. Vuelve a adjuntarlo.`);
        item.artworkAssetId = primaryArtworkId;
        if (!Object.keys(item.localArtworkIds).length) delete item.localArtworkIds;
      } else if (item.localArtworkIds) {
        delete item.localArtworkIds;
      }
    }
    localStorage.setItem("printly-customer-cart", JSON.stringify(cart.value));
    await Promise.all(artworkToClean.map((id) => deleteCustomerArtwork(id)));
  } catch (reason) {
    if (axios.isAxiosError(reason) && reason.response?.status === 401) {
      setCsrfToken(null);
      await router.replace({ path: "/store/access", query: { redirect: "/store/checkout" } });
      return;
    }
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

async function uploadLocalArtwork(localArtworkId: string, itemName: string) {
  const artwork = await loadCustomerArtwork(localArtworkId);
  if (!artwork) throw new Error(`No encontramos el archivo de diseño de ${itemName}. Regresa a la tienda y vuelve a adjuntarlo.`);
  const contentType = artwork.type || "application/octet-stream";
  const { data } = await api.put<{ id: string }>("/storefront/artwork", artwork, {
    headers: { "Content-Type": contentType },
  });
  return data.id;
}

async function requestShippingQuote() {
  if (quotingShipping.value) return;
  quotingShipping.value = true;
  error.value = "";
  shippingQuote.value = null;
  try {
    const { data } = await api.post<{
      serviceName: string;
      serviceCode: string;
      currency: string;
      shippingCents: number;
      shippingTotal: number;
      packageCount: number;
    }>("/storefront/shipping/quote", {
      recipient: recipient.value,
      phone: phone.value,
      addressLine1: addressLine1.value,
      addressLine2: addressLine2.value,
      city: city.value,
      state: state.value,
      postalCode: postalCode.value,
      country: "MX",
      packageCount: cart.value.reduce((sum, item) => sum + item.quantity, 0),
    });
    shippingQuote.value = data;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    quotingShipping.value = false;
  }
}

async function submitCheckout() {
  if (busy.value || !cart.value.length || !shippingQuote.value) return;
  busy.value = true;
  error.value = "";
  try {
    const items = cart.value.map((item) => {
      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        ...(item.artworkAssetId ? { artworkAssetId: item.artworkAssetId } : {}),
        ...(item.artworkSides ? { artworkSides: item.artworkSides } : {}),
        ...(item.designConfig ? { designConfig: item.designConfig } : {}),
        options: item.options ?? {},
      };
    });
    const { data } = await api.post<{ checkoutUrl: string }>("/storefront/checkout", {
      items,
      shippingAddress: {
        recipient: recipient.value,
        phone: phone.value,
        addressLine1: addressLine1.value,
        addressLine2: addressLine2.value,
        city: city.value,
        state: state.value,
        postalCode: postalCode.value,
        country: "MX",
      },
      quotedShippingCents: shippingQuote.value.shippingCents,
      quotedPackageCount: shippingQuote.value.packageCount,
    });
    window.location.assign(data.checkoutUrl);
  } catch (reason) {
    error.value = getErrorMessage(reason);
    busy.value = false;
  }
}

watch([recipient, phone, addressLine1, addressLine2, city, state, postalCode], () => {
  shippingQuote.value = null;
});

onMounted(initialize);
</script>

<template>
  <main class="customer-checkout-page">
    <div class="customer-checkout-heading">
      <RouterLink to="/store#productos" class="customer-back-link"><span>←</span> Volver a la tienda</RouterLink>
      <span class="store-kicker">PAGO SEGURO</span>
      <h1>Finaliza tu <em>pedido.</em></h1>
      <p>Los precios y la tarifa de envío se verifican en el servidor antes de abrir el pago.</p>
    </div>
    <div v-if="loading" class="customer-auth-loading" role="status">Cargando pedido…</div>
    <section v-else class="customer-checkout-grid">
      <div class="customer-checkout-card">
        <p v-if="notice" class="customer-checkout-notice" role="status">{{ notice }}</p>
        <p v-if="error" class="store-inline-error" role="alert">{{ error }}</p>
        <div v-if="order" class="customer-checkout-order">
          <strong>Pedido {{ order.orderNumber }}</strong>
          <span>Estado de pago: {{ order.paymentStatus }}</span>
          <div v-for="(shipment, index) in order.shipments" :key="`${shipment.carrier}-${shipment.trackingNumber ?? index}`" class="customer-shipping-tracking">
            <strong>{{ shipment.carrier }}<span v-if="shipment.trackingNumber"> · {{ shipment.trackingNumber }}</span></strong>
            <span v-if="shipment.packageTrackingNumbers.length > 1">
              Paquetes:
              <template v-for="(trackingNumber, trackingIndex) in shipment.packageTrackingNumbers" :key="trackingNumber">
                <a :href="upsTrackingUrl(trackingNumber)" target="_blank" rel="noopener noreferrer">{{ trackingNumber }}</a><span v-if="trackingIndex < shipment.packageTrackingNumbers.length - 1"> · </span>
              </template>
            </span>
            <span v-if="shipment.trackingStatus">{{ shipment.trackingStatus }}</span>
            <a v-if="shipment.trackingUrl" :href="shipment.trackingUrl" target="_blank" rel="noopener noreferrer">Rastrear envío ↗</a>
          </div>
          <button class="store-primary-button" type="button" @click="checkOrder(String(route.query.order ?? ''))">Actualizar estado</button>
        </div>
        <form v-else-if="cart.length" class="customer-checkout-form" @submit.prevent="submitCheckout">
          <h2>Datos de envío</h2>
          <label><span>Nombre de quien recibe</span><input v-model="recipient" autocomplete="name" required minlength="2" maxlength="160"></label>
          <label><span>Teléfono</span><input v-model="phone" type="tel" autocomplete="tel" required minlength="7" maxlength="30"></label>
          <label><span>Dirección</span><input v-model="addressLine1" autocomplete="address-line1" required minlength="3" maxlength="191"></label>
          <label><span>Interior, colonia o referencias (opcional)</span><input v-model="addressLine2" autocomplete="address-line2" maxlength="191"></label>
          <div class="customer-checkout-fields">
            <label><span>Ciudad</span><input v-model="city" autocomplete="address-level2" required minlength="2" maxlength="120"></label>
            <label><span>Estado</span><input v-model="state" autocomplete="address-level1" required minlength="2" maxlength="120"></label>
            <label><span>Código postal</span><input v-model="postalCode" autocomplete="postal-code" required inputmode="numeric" pattern="[0-9]{5}" minlength="5" maxlength="5"></label>
          </div>
          <button class="store-primary-button customer-shipping-quote-button" type="button" :disabled="quotingShipping || busy" @click="requestShippingQuote">
            {{ quotingShipping ? "Consultando UPS…" : "Cotizar envío con UPS" }}
          </button>
          <p v-if="shippingQuote" class="customer-shipping-quote" role="status">Servicio más económico: {{ shippingQuote.serviceName }} · {{ new Intl.NumberFormat("es-MX", { style: "currency", currency: shippingQuote.currency }).format(shippingQuote.shippingTotal) }}</p>
          <button class="store-primary-button" type="submit" :disabled="busy || !cart.length || !shippingQuote">
            {{ busy ? "Preparando pago…" : "Continuar a pago seguro" }} <span>→</span>
          </button>
        </form>
        <RouterLink v-else class="store-primary-button" to="/store#productos">Explorar productos <span>→</span></RouterLink>
      </div>
      <aside class="customer-checkout-summary">
        <h2>Resumen</h2>
        <article v-for="(item, index) in cart" :key="`${item.id}-${index}`">
          <div><strong>{{ item.name }}</strong><span>{{ item.variant }} · Cant. {{ item.quantity }}{{ formatOptions(item.options) ? ` · ${formatOptions(item.options)}` : "" }}</span></div>
          <b>{{ new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price * item.quantity) }}</b>
        </article>
        <div class="customer-checkout-total"><span>Envío UPS</span><strong>{{ shippingQuote ? new Intl.NumberFormat("es-MX", { style: "currency", currency: shippingQuote.currency }).format(shippingQuote.shippingTotal) : "Pendiente de cotizar" }}</strong></div>
        <div class="customer-checkout-total"><span>Total</span><strong>{{ formattedTotal }}</strong></div>
        <small>El pago se procesa en Stripe. Printly crea el pedido y su trabajo de producción únicamente al confirmar el pago.</small>
      </aside>
    </section>
  </main>
</template>
