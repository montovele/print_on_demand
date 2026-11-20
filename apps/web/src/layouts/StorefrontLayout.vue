<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import api, { getErrorMessage, setCsrfToken } from "../services/api";
import { deleteCustomerArtwork } from "../services/customerArtwork";

interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  productId?: string;
  variantId?: string;
  artworkAssetId?: string;
  artworkSides?: Partial<Record<"front" | "back", string>>;
  localArtworkId?: string;
  localArtworkIds?: Partial<Record<"front" | "back", string>>;
  designConfig?: { text?: string };
  options?: Record<string, string>;
}

const cart = ref<CartItem[]>([]);
const cartOpen = ref(false);
const cartError = ref("");
const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0));
const checkoutReady = computed(() => cart.value.length > 0 && cart.value.every((item) => {
  const hasArtwork = Boolean(
    item.artworkAssetId
    || item.localArtworkId
    || Object.keys(item.localArtworkIds ?? {}).length
    || Object.keys(item.artworkSides ?? {}).length,
  );
  return Boolean(item.productId && item.variantId && (hasArtwork || item.designConfig?.text?.trim()));
}));
const formattedTotal = computed(() => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cartTotal.value));

function refreshCart() {
  cartError.value = "";
  try {
    const saved = localStorage.getItem("printly-customer-cart");
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) throw new Error("El formato de la bolsa no es válido.");
    cart.value = parsed as CartItem[];
  } catch (error) {
    cart.value = [];
    cartError.value = error instanceof Error ? error.message : "No se pudo leer la bolsa.";
  }
}

function formatOptions(options?: Record<string, string>) {
  return options ? Object.entries(options).map(([label, value]) => `${label}: ${value}`).join(" · ") : "";
}

async function removeCartItem(index: number) {
  const item = cart.value[index];
  if (!item) return;
  cartError.value = "";
  try {
    if (item.localArtworkId) await deleteCustomerArtwork(item.localArtworkId);
    await Promise.all(Object.values(item.localArtworkIds ?? {}).map((id) => deleteCustomerArtwork(id)));
    cart.value.splice(index, 1);
    localStorage.setItem("printly-customer-cart", JSON.stringify(cart.value));
    window.dispatchEvent(new Event("printly-cart-updated"));
  } catch (error) {
    cartError.value = getErrorMessage(error);
  }
}

async function restoreCustomerSession() {
  try {
    const { data } = await api.get<{ csrfToken: string }>("/auth/customer/me");
    setCsrfToken(data.csrfToken);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      setCsrfToken(null);
      return;
    }
    cartError.value = getErrorMessage(error);
  }
}

onMounted(() => {
  refreshCart();
  void restoreCustomerSession();
  window.addEventListener("printly-cart-updated", refreshCart);
  window.addEventListener("printly-cart-open", openCart);
});
onUnmounted(() => {
  window.removeEventListener("printly-cart-updated", refreshCart);
  window.removeEventListener("printly-cart-open", openCart);
});

function openCart() {
  refreshCart();
  cartOpen.value = true;
}
</script>

<template>
  <div class="storefront-shell">
    <div class="store-announcement">Stickers de referencia de Pegapega.mx <span>·</span> Explora nuestro diseñador de productos</div>
    <header class="store-header">
      <RouterLink class="store-brand" to="/store" aria-label="Printly, tienda">
        <span class="store-brand-mark">P</span>
        <span>print<span>ly</span></span>
      </RouterLink>
      <nav class="store-navigation" aria-label="Navegación principal">
        <RouterLink to="/store#productos">Tienda</RouterLink>
        <RouterLink to="/store#personaliza">Personaliza</RouterLink>
        <a href="/store#como-funciona">Cómo funciona</a>
      </nav>
      <div class="store-header-actions">
        <RouterLink class="store-account-link" to="/store/access"><span aria-hidden="true">♙</span> Mi cuenta</RouterLink>
        <button class="store-bag-button" type="button" aria-label="Abrir bolsa" @click="cartOpen = !cartOpen">
          Bolsa <span>{{ cartCount }}</span>
        </button>
      </div>
    </header>

    <RouterView />

    <footer class="store-footer">
      <RouterLink class="store-brand" to="/store"><span class="store-brand-mark">P</span><span>print<span>ly</span></span></RouterLink>
      <p>Hecho para llevar tus ideas al mundo.</p>
      <span>© 2026 Printly</span>
    </footer>

    <div v-if="cartOpen" class="store-cart-backdrop" @click.self="cartOpen = false">
      <aside class="store-cart-drawer" aria-label="Tu bolsa">
        <div class="store-cart-heading">
          <div><p class="store-kicker">TU COMPRA</p><h2>Tu bolsa <span>({{ cartCount }})</span></h2></div>
          <button class="store-close-button" type="button" aria-label="Cerrar bolsa" @click="cartOpen = false">×</button>
        </div>
        <p v-if="cartError" class="store-inline-error" role="alert">{{ cartError }}</p>
        <div v-else-if="cart.length" class="store-cart-list">
          <article v-for="(item, index) in cart" :key="`${item.id}-${index}`" class="store-cart-item">
            <div class="store-cart-thumb">✳</div>
            <div><strong>{{ item.name }}</strong><span>{{ item.variant }} · Cant. {{ item.quantity }}</span><small v-if="formatOptions(item.options)">{{ formatOptions(item.options) }}</small></div>
            <b>{{ new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.price * item.quantity) }}</b>
            <button class="store-cart-remove" type="button" :aria-label="`Quitar ${item.name} de la bolsa`" @click="removeCartItem(index)">Quitar</button>
          </article>
          <div class="store-cart-total"><span>Subtotal</span><strong>{{ formattedTotal }}</strong></div>
          <p class="store-cart-note">{{ checkoutReady ? "El precio y el envío se validan nuevamente antes de pagar." : "Hay artículos de demostración o incompletos. Retíralos y agrega productos publicados con variante y personalización para continuar al pago." }}</p>
          <RouterLink v-if="checkoutReady" class="store-primary-button" to="/store/checkout" @click="cartOpen = false">Continuar al pago <span>→</span></RouterLink>
          <button v-else class="store-primary-button" type="button" disabled>Continuar al pago</button>
        </div>
        <div v-else class="store-empty-cart">
          <span>✳</span><strong>Tu bolsa está esperando</strong><p>Explora la tienda y encuentra algo que te encante.</p>
          <button class="store-primary-button" type="button" @click="cartOpen = false">Explorar productos</button>
        </div>
      </aside>
    </div>
  </div>
</template>
