<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PageHeader from "../components/PageHeader.vue";
import StatusBadge from "../components/StatusBadge.vue";
import ArtworkImage from "../components/ArtworkImage.vue";
import api, { getErrorMessage } from "../services/api";
import type { Product } from "../types";
import { stickerCatalog } from "../data/stickerCatalog";
import { stickerSpecifications } from "../data/stickerSpecifications";
import { getCustomerProductTemplate } from "../data/customerProducts";
import { formatCurrency } from "../utils/money";

const products = ref<Product[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const showForm = ref(false);
const importingStickers = ref(false);
const publishingProducts = ref(false);
const publishingProductId = ref("");
const publicationSummary = ref<{ published: number; skipped: Array<{ name: string; reason: string }> } | null>(null);
const editingStickerPrices = ref("");
const expandedStickerDetails = ref("");
const stickerVariantPrices = ref<NonNullable<Product["variants"]>>([]);
const emptyForm = () => ({ name: "", description: "", baseCost: 0, salePrice: 0, currency: "MXN", productionMethod: "", productionMinutes: null as number | null, manufacturingNotes: "" });
const form = ref(emptyForm());
const desiredMargin = ref(40);
const suggesting = ref(false);

function getPublicationSkipReason(product: Product) {
  if (product.fulfillmentMode !== "in_house") return "La publicación solo está disponible para productos de fabricación propia.";
  if (!product.variants?.length) return "Agrega al menos una variante.";
  if (product.variants.some((variant) => variant.salePrice <= 0)) return "Configura un precio mayor que cero en todas las variantes.";
  if (!product.variants.some((variant) => variant.currency === "MXN" && variant.salePrice > 0)) {
    return "Configura al menos una variante con precio válido en MXN.";
  }
  return "";
}

function isPurchasableFromStore(product: Product) {
  return product.fulfillmentMode === "in_house"
    && (product.providerCode === "pegapega" || Boolean(getCustomerProductTemplate(product.productType)));
}

function getPublicationLabel(product: Product) {
  if (product.status === "published") {
    return isPurchasableFromStore(product) ? "Publicado en tienda" : "Publicado en tienda · Próximamente";
  }
  return getPublicationSkipReason(product) ? "Pendiente de configurar" : "Listo para publicar";
}

function getPublicationHint(product: Product) {
  const reason = getPublicationSkipReason(product);
  if (reason) return reason;
  if (product.status === "published" && !isPurchasableFromStore(product)) {
    return "Visible en /store, pero todavía no se puede diseñar ni comprar.";
  }
  return product.status === "published" ? "Visible para clientes" : "Producto listo para agregarse a la tienda.";
}

const eligibleToPublishCount = computed(() => products.value.filter((product) =>
  product.status !== "published" && product.status !== "archived" && !getPublicationSkipReason(product),
).length);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    products.value = (await api.get("/products")).data.items as Product[];
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

async function publishAllEligibleProducts() {
  if (eligibleToPublishCount.value === 0 || publishingProducts.value || publishingProductId.value) return;
  const confirmed = window.confirm(
    `¿Publicar ${eligibleToPublishCount.value} productos elegibles? Los tipos sin plantilla compatible aparecerán en /store como próximamente y no se podrán comprar.`,
  );
  if (!confirmed) return;

  publishingProducts.value = true;
  error.value = "";
  publicationSummary.value = null;
  try {
    const { data } = await api.post<{ published: number; skipped: Array<{ name: string; reason: string }> }>("/products/publish-bulk");
    publicationSummary.value = data;
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    publishingProducts.value = false;
  }
}

async function createProduct() {
  saving.value = true;
  error.value = "";
  try {
    await api.post("/products", {
      ...form.value,
      productionMethod: form.value.productionMethod.trim() || undefined,
      productionMinutes: form.value.productionMinutes ?? undefined,
      manufacturingNotes: form.value.manufacturingNotes.trim() || undefined,
    });
    form.value = emptyForm();
    showForm.value = false;
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function importStickerCatalog() {
  importingStickers.value = true;
  error.value = "";
  try {
    const { data } = await api.post<{ imported: number; updated: number; total: number }>("/storefront/catalog/import");
    await load();
    window.alert(`Catálogo sincronizado: ${data.imported} productos nuevos y ${data.updated} actualizados de ${data.total}. Revisa los detalles, costos y precios antes de publicar.`);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    importingStickers.value = false;
  }
}

function getStickerDetails(product: Product) {
  return stickerCatalog.find((sticker) => sticker.id === product.externalProductId);
}

function getStickerSpecifications(product: Product) {
  return product.externalProductId ? stickerSpecifications[product.externalProductId] : undefined;
}

function editStickerPrices(product: Product) {
  editingStickerPrices.value = product.id;
  stickerVariantPrices.value = (product.variants ?? []).map((variant) => ({ ...variant }));
}

async function saveStickerPrices(product: Product) {
  saving.value = true;
  error.value = "";
  try {
    await api.patch(`/products/${product.id}`, {
      baseCost: stickerVariantPrices.value[0]?.providerCost ?? product.baseCost,
      salePrice: stickerVariantPrices.value[0]?.salePrice ?? product.salePrice,
      variants: stickerVariantPrices.value.map(({ id, name, size, color, sku, providerCost, salePrice }) => ({
        id, name, size: size ?? undefined, color: color ?? undefined, sku: sku ?? undefined, providerCost, salePrice,
      })),
    });
    editingStickerPrices.value = "";
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function suggestPrice() {
  suggesting.value = true;
  error.value = "";
  try {
    const { data } = await api.post<{ suggestedPrice: number }>("/pricing/suggestion", {
      totalCost: form.value.baseCost,
      desiredMargin: desiredMargin.value / 100,
    });
    form.value.salePrice = data.suggestedPrice;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    suggesting.value = false;
  }
}

async function archive(product: Product) {
  if (!window.confirm(`¿Archivar "${product.name}"?`)) return;
  try {
    await api.delete(`/products/${product.id}`);
    products.value = products.value.filter((item) => item.id !== product.id);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function setPublication(product: Product) {
  const status = product.status === "published" ? "draft" : "published";
  if (status === "published") {
    const reason = getPublicationSkipReason(product);
    if (reason) {
      error.value = `${product.name}: ${reason}`;
      return;
    }
    const publicationNotice = isPurchasableFromStore(product)
      ? "Será visible y se podrá comprar en la tienda."
      : "Será visible en /store como próximamente, pero no se podrá diseñar ni comprar.";
    if (!window.confirm(`¿Publicar "${product.name}"? ${publicationNotice}`)) return;
  }
  if (publishingProductId.value || publishingProducts.value) return;
  publishingProductId.value = product.id;
  error.value = "";
  try {
    const { data } = await api.patch<Product>(`/products/${product.id}`, { status });
    products.value = products.value.map((item) => item.id === product.id ? { ...item, status: data.status } : item);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    publishingProductId.value = "";
  }
}

onMounted(load);
</script>

<template>
  <PageHeader title="Mis productos" description="Administra los productos de tu tienda.">
    <RouterLink class="button button-secondary" to="/designer">✳ Diseñar producto</RouterLink>
    <button class="button button-secondary" :disabled="importingStickers" @click="importStickerCatalog">{{ importingStickers ? "Sincronizando..." : "Sincronizar catálogo de stickers · $20–$100" }}</button>
    <button class="button button-secondary" :disabled="publishingProducts || Boolean(publishingProductId) || eligibleToPublishCount === 0" @click="publishAllEligibleProducts">
      {{ publishingProducts ? "Publicando..." : `Publicar productos elegibles (${eligibleToPublishCount})` }}
    </button>
    <button class="button button-primary" @click="showForm = !showForm"><span>＋</span> Nuevo producto manual</button>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <section v-if="publicationSummary" class="alert alert-success">
    <strong>Publicación masiva completada:</strong> {{ publicationSummary.published }} productos publicados; {{ publicationSummary.skipped.length }} omitidos.
    <ul v-if="publicationSummary.skipped.length">
      <li v-for="item in publicationSummary.skipped" :key="`${item.name}-${item.reason}`">{{ item.name }}: {{ item.reason }}</li>
    </ul>
  </section>
  <section v-if="showForm" class="content-card form-card">
    <div class="section-heading"><div><h2>Crear producto</h2><p>Agrega un producto a tu catálogo comercial.</p></div><button class="icon-button" aria-label="Cerrar formulario" @click="showForm = false">×</button></div>
    <form class="product-form" @submit.prevent="createProduct">
      <label class="field"><span>Nombre</span><input v-model="form.name" required minlength="2" maxlength="191" placeholder="Ej. Camiseta gráfica" /></label>
      <label class="field"><span>Descripción</span><textarea v-model="form.description" rows="2" placeholder="Describe el producto"></textarea></label>
      <div class="field-row">
        <label class="field"><span>Método de fabricación</span><input v-model="form.productionMethod" maxlength="100" placeholder="DTG, sublimación, bordado..." /></label>
        <label class="field"><span>Tiempo estimado (minutos)</span><input v-model.number="form.productionMinutes" type="number" min="1" max="100000" /></label>
      </div>
      <label class="field"><span>Instrucciones de fabricación (opcional)</span><textarea v-model="form.manufacturingNotes" rows="3" maxlength="10000" placeholder="Configuración, acabado, empaque u otras indicaciones para producción"></textarea></label>
      <div class="field-row">
        <label class="field"><span>Costo base</span><input v-model.number="form.baseCost" type="number" min="0" step="0.01" required /></label>
        <label class="field"><span>Precio de venta</span><input v-model.number="form.salePrice" type="number" min="0" step="0.01" required /></label>
        <label class="field"><span>Moneda</span><select v-model="form.currency"><option>MXN</option><option>USD</option><option>EUR</option></select></label>
      </div>
      <div class="field-row price-suggestion-row">
        <label class="field"><span>Margen objetivo (%)</span><input v-model.number="desiredMargin" type="number" min="0" max="99" step="1" /></label>
        <div class="suggestion-action"><button type="button" class="button button-secondary" :disabled="suggesting" @click="suggestPrice">{{ suggesting ? "Calculando..." : "Sugerir precio" }}</button></div>
      </div>
      <div class="form-actions"><button type="button" class="button button-secondary" @click="showForm = false">Cancelar</button><button class="button button-primary" :disabled="saving">{{ saving ? "Guardando..." : "Guardar producto" }}</button></div>
    </form>
  </section>
  <section class="content-card">
    <div class="section-heading">
      <div><h2>Catálogo de productos</h2><p>{{ products.length }} productos en tu espacio</p></div>
      <span class="table-count">{{ products.length }} total</span>
    </div>
    <div v-if="loading" class="loading-state">Cargando productos...</div>
    <div v-else-if="products.length" class="table-wrap">
      <table class="product-catalog-table"><thead><tr><th>Producto</th><th>Costo base</th><th>Precio venta</th><th>Margen estimado</th><th>Estado</th><th class="product-actions-header">Acciones</th></tr></thead>
        <tbody><template v-for="product in products" :key="product.id"><tr>
          <td><div class="product-cell"><span class="product-thumb"><img v-if="getStickerDetails(product)" :src="getStickerDetails(product)?.image" :alt="getStickerDetails(product)?.name" /><ArtworkImage v-else-if="product.artworkUrl" :src="product.artworkUrl" :alt="`Diseño de ${product.name}`" /><span v-else>◇</span></span><span><strong>{{ product.name }}</strong><small>{{ getStickerDetails(product)?.category || (product.fulfillmentMode === "printful" ? "Printful" : product.productionMethod || "Fabricación propia") }}</small><small>{{ product.variants?.length ? `${product.variants.length} variantes` : "Sin variantes" }}</small><small v-if="getPublicationSkipReason(product)" class="product-description">{{ getPublicationSkipReason(product) }}</small><small v-if="getStickerDetails(product)" class="product-description">{{ getStickerDetails(product)?.description }}</small></span></div></td>
          <td>{{ formatCurrency(product.baseCost, product.currency) }}</td><td class="strong-cell">{{ formatCurrency(product.salePrice, product.currency) }}</td>
          <td><span :class="product.salePrice - product.baseCost >= 0 ? 'positive-value' : 'negative-value'">{{ formatCurrency(product.salePrice - product.baseCost, product.currency) }}</span></td>
          <td><StatusBadge :status="product.status" /></td>
          <td class="product-actions">
            <div class="product-action-group">
              <span class="product-publication-status" :class="{ 'is-published': product.status === 'published' && isPurchasableFromStore(product), 'is-catalog-only': product.status === 'published' && !isPurchasableFromStore(product), 'is-ready': product.status !== 'published' && !getPublicationSkipReason(product), 'is-incomplete': Boolean(getPublicationSkipReason(product)) }">
                <i aria-hidden="true"></i>{{ getPublicationLabel(product) }}
              </span>
              <small class="product-action-hint">{{ getPublicationHint(product) }}</small>
              <button
                v-if="product.status !== 'archived'"
                class="button"
                :class="product.status === 'published' ? 'button-secondary' : 'button-primary'"
                :disabled="saving || publishingProducts || Boolean(publishingProductId) || (product.status !== 'published' && Boolean(getPublicationSkipReason(product)))"
                :title="product.status === 'published' ? 'Retira el producto de la tienda' : getPublicationSkipReason(product) || 'Publica este producto en la tienda'"
                @click="setPublication(product)"
              >
                {{ publishingProductId === product.id ? "Actualizando…" : product.status === "published" ? "Retirar de tienda" : "Publicar producto" }}
              </button>
              <button v-if="getStickerDetails(product)" class="button button-secondary" @click="expandedStickerDetails = expandedStickerDetails === product.id ? '' : product.id">
                {{ expandedStickerDetails === product.id ? "Cerrar detalles" : "Ver ficha del producto" }}
              </button>
              <RouterLink v-if="product.fulfillmentMode === 'in_house'" class="button button-secondary" :to="`/designer/${product.id}`">Diseño y variantes</RouterLink>
              <button v-if="product.providerCode === 'pegapega'" class="button button-secondary" @click="editingStickerPrices === product.id ? editingStickerPrices = '' : editStickerPrices(product)">
                {{ editingStickerPrices === product.id ? "Cerrar precios" : "Configurar precios" }}
              </button>
              <button class="button button-secondary button-danger" @click="archive(product)">Archivar producto</button>
            </div>
          </td>
        </tr>
        <tr v-if="expandedStickerDetails === product.id && getStickerDetails(product)" class="sticker-catalog-details-row">
          <td colspan="6">
            <div class="sticker-catalog-details">
              <img :src="getStickerDetails(product)!.image" :alt="getStickerDetails(product)!.name">
              <div>
                <strong>{{ getStickerDetails(product)!.name }} · {{ getStickerDetails(product)!.category }}</strong>
                <p>{{ getStickerDetails(product)!.description }}</p>
                <p class="sticker-provider-reference">Rango mostrado en la ficha del proveedor: {{ getStickerDetails(product)!.priceRange }}. Es un dato de referencia, no el precio de venta de Printly.</p>
                <h3>Características</h3>
                <ul><li v-for="feature in getStickerDetails(product)!.features" :key="feature">{{ feature }}</li></ul>
                <h3>Medidas y materiales</h3>
                <ul>
                  <li v-for="item in getStickerSpecifications(product)?.dimensions" :key="`dimension-${item}`">{{ item }}</li>
                  <li v-for="item in getStickerSpecifications(product)?.materials" :key="`material-${item}`">{{ item }}</li>
                </ul>
                <h3>Presentaciones y opciones</h3>
                <ul>
                  <li v-for="variant in product.variants" :key="variant.id">{{ variant.name }} · Costo {{ formatCurrency(variant.providerCost, product.currency) }} · Venta {{ formatCurrency(variant.salePrice, product.currency) }}</li>
                  <li v-for="option in getStickerDetails(product)!.options" :key="option">{{ option }}</li>
                  <li v-for="group in getStickerSpecifications(product)?.optionGroups.filter((group) => group.label !== 'Cantidad' && group.label !== 'Tamaño')" :key="group.label">{{ group.label }}: {{ group.options.join(", ") }}</li>
                </ul>
                <h3>Notas de producción</h3>
                <ul><li v-for="note in getStickerSpecifications(product)?.productionNotes" :key="note">{{ note }}</li></ul>
                <a :href="getStickerDetails(product)!.href" target="_blank" rel="noopener noreferrer">Abrir ficha original del proveedor ↗</a>
              </div>
            </div>
          </td>
        </tr>
        <tr v-if="editingStickerPrices === product.id" class="sticker-price-editor-row">
          <td colspan="6">
            <div class="sticker-price-editor">
              <strong>Costos y precios por presentación · {{ product.name }}</strong>
              <div v-for="(variant, variantIndex) in stickerVariantPrices" :key="variant.id" class="sticker-price-editor-item">
                <b>{{ variant.name }}</b>
                <label>Costo interno <input v-model.number="stickerVariantPrices[variantIndex]!.providerCost" type="number" min="0" max="999999999" step="0.01" /></label>
                <label>Precio de venta <input v-model.number="stickerVariantPrices[variantIndex]!.salePrice" type="number" min="0.01" max="999999999" step="0.01" /></label>
              </div>
              <p>Los precios son propios de Printly. Las presentaciones sin precio se inicializan entre $20 y $100 MXN; el costo base inicial equivale al 50% del precio. Los precios existentes se conservan. El rango del proveedor se muestra solo como referencia y no se usa para cobrar.</p>
              <button class="button button-primary" :disabled="saving || !stickerVariantPrices.length" @click="saveStickerPrices(product)">{{ saving ? "Guardando..." : "Guardar precios" }}</button>
            </div>
          </td>
        </tr></template></tbody>
      </table>
    </div>
    <div v-else class="empty-state"><span class="empty-icon">◇</span><strong>Tu catálogo está listo para empezar</strong><p>Crea un producto manual o elige uno del catálogo POD.</p><div class="empty-actions"><button class="button button-secondary" @click="showForm = true">Crear producto</button><RouterLink class="button button-primary" to="/catalog">Explorar catálogo</RouterLink></div></div>
  </section>
</template>
