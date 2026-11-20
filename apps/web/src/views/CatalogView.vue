<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import ArtworkImage from "../components/ArtworkImage.vue";
import api, { getErrorMessage } from "../services/api";
import type { PrintfulProduct } from "../types";
import { formatCurrency } from "../utils/money";

const products = ref<PrintfulProduct[]>([]);
const source = ref<"in_house" | "printful">("in_house");
const loading = ref(true);
const error = ref("");
const query = ref("");
const selected = ref<PrintfulProduct | null>(null);
const saving = ref(false);
const price = ref({ baseCost: 0, salePrice: 0, currency: "MXN" });
const filtered = computed(() => products.value.filter((product) => product.name.toLowerCase().includes(query.value.toLowerCase())));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get(`/catalog/products${source.value === "printful" ? "?source=printful" : ""}`);
    products.value = data.items as PrintfulProduct[];
  } catch (reason) {
    error.value = getErrorMessage(reason);
    products.value = [];
  } finally {
    loading.value = false;
  }
}

async function selectSource(value: "in_house" | "printful") {
  source.value = value;
  await load();
}

async function addProduct() {
  if (!selected.value) return;
  saving.value = true;
  error.value = "";
  try {
    await api.post("/products", {
      name: selected.value.name,
      description: selected.value.description ?? undefined,
      providerCode: "printful",
      externalProductId: selected.value.externalId,
      fulfillmentMode: "printful",
      baseCost: price.value.baseCost,
      salePrice: price.value.salePrice,
      currency: price.value.currency,
    });
    selected.value = null;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <PageHeader title="Catálogo" description="Opera con tus propios productos y máquinas. Printful está disponible como integración opcional.">
    <RouterLink class="button button-primary" to="/products">＋ Crear producto</RouterLink>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }} <button class="text-button" @click="load">Reintentar</button></div>
  <section class="catalog-toolbar">
    <div class="catalog-intro"><div class="provider-mark" :class="{ 'in-house-mark': source === 'in_house' }">{{ source === "in_house" ? "P" : "P" }}</div><div><strong>{{ source === "in_house" ? "Fabricación propia" : "Printful (opcional)" }}</strong><span>{{ source === "in_house" ? "Productos gestionados por tu negocio" : "Catálogo externo de Printful" }}</span></div></div>
    <div class="catalog-source-actions">
      <button v-if="source === 'in_house'" class="button button-secondary" @click="selectSource('printful')">Explorar Printful (opcional)</button>
      <button v-else class="button button-secondary" @click="selectSource('in_house')">Volver a mis productos</button>
      <label class="search-box"><span>⌕</span><input v-model="query" placeholder="Buscar productos..." /></label>
    </div>
  </section>
  <div v-if="loading" class="catalog-grid">
    <div v-for="i in 8" :key="i" class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
  </div>
  <section v-else-if="filtered.length" class="catalog-grid">
    <article v-for="product in filtered" :key="product.externalId" class="catalog-card">
      <div class="catalog-image">
        <ArtworkImage v-if="product.imageUrl && source === 'in_house'" :src="product.imageUrl" :alt="product.name" />
        <img v-else-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" />
        <div v-else class="catalog-placeholder">✳</div>
        <span class="provider-pill" :class="{ 'in-house-pill': source === 'in_house' }">{{ source === "in_house" ? "PROPIO" : "PRINTFUL" }}</span>
      </div>
      <div class="catalog-card-body">
        <span class="catalog-type">{{ product.type ?? (source === "in_house" ? "FABRICACIÓN PROPIA" : "PRODUCTO PERSONALIZABLE") }}</span>
        <h3>{{ product.name }}</h3>
        <p v-if="source === 'in_house' && product.baseCost !== undefined">{{ formatCurrency(product.baseCost, product.currency ?? "MXN") }} costo · {{ formatCurrency(product.salePrice ?? 0, product.currency ?? "MXN") }} venta</p>
        <p v-else>{{ product.variantCount ?? "—" }} variantes disponibles</p>
        <RouterLink v-if="source === 'in_house'" class="button button-secondary button-full" to="/products">Administrar producto <span>→</span></RouterLink>
        <button v-else class="button button-secondary button-full" @click="selected = product; price = { baseCost: 0, salePrice: 0, currency: 'MXN' }">Agregar con Printful <span>→</span></button>
      </div>
    </article>
  </section>
  <div v-else-if="!error" class="content-card empty-state"><span class="empty-icon">▦</span><strong>{{ products.length ? "No encontramos resultados" : source === "in_house" ? "Crea tu primer producto" : "Printful no está conectado" }}</strong><p>{{ products.length ? "Prueba con otro término." : source === "in_house" ? "Registra un producto propio y asígnale su método de fabricación." : "Tu catálogo y producción propia siguen disponibles. Conecta Printful solo si deseas usar ese proveedor." }}</p><RouterLink v-if="source === 'in_house' && !products.length" class="button button-primary" to="/products">Crear producto</RouterLink><RouterLink v-if="source === 'printful' && !products.length" class="button button-secondary" to="/settings">Configurar integración opcional</RouterLink></div>
  <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
    <form class="modal-card" @submit.prevent="addProduct">
      <button class="modal-close icon-button" type="button" aria-label="Cerrar" @click="selected = null">×</button>
      <p class="eyebrow">AGREGAR PRODUCTO EXTERNO</p><h2>{{ selected.name }}</h2><p class="modal-description">El producto se marcará explícitamente para fulfillment de Printful; no modifica el flujo de fabricación propia.</p>
      <div class="field-row">
        <label class="field"><span>Costo base</span><input v-model.number="price.baseCost" type="number" min="0" step="0.01" required /></label>
        <label class="field"><span>Precio de venta</span><input v-model.number="price.salePrice" type="number" min="0" step="0.01" required /></label>
      </div>
      <label class="field"><span>Moneda</span><select v-model="price.currency"><option>MXN</option><option>USD</option><option>EUR</option></select></label>
      <p v-if="error" class="alert alert-error">{{ error }}</p>
      <div class="form-actions"><button type="button" class="button button-secondary" @click="selected = null">Cancelar</button><button class="button button-primary" :disabled="saving">{{ saving ? "Agregando..." : "Agregar producto" }}</button></div>
    </form>
  </div>
</template>
