<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { stickerCatalog, stickerCategories } from "../data/stickerCatalog";
import { stickerSpecifications } from "../data/stickerSpecifications";
import { getCustomerProductTemplate } from "../data/customerProducts";
import api, { getErrorMessage } from "../services/api";
import { saveCustomerArtwork } from "../services/customerArtwork";
import { addOrIncrementCartItem, fingerprintArtwork, type StorefrontCartItem } from "../services/storefrontCart";

interface PublishedStickerVariant {
  id: string;
  name: string;
  salePrice: number;
  currency: string;
}

interface PublishedSticker {
  externalProductId: string;
  productId: string;
  salePrice: number;
  currency: string;
  variants: PublishedStickerVariant[];
}

interface PublishedDesignerProduct {
  productId: string;
  name: string;
  productType: string;
  variants: Array<PublishedStickerVariant & { size: string | null; color: string | null }>;
}

interface PublishedCatalogProduct {
  productId: string;
  name: string;
  description: string | null;
  productType: string;
  startingPrice: number | null;
}

type ArtworkInteractionMode = "move" | "resize";

interface ArtworkPointerInteraction {
  pointerId: number;
  mode: ArtworkInteractionMode;
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  startSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

const selectedCategory = ref("Todos");
const search = ref("");
const selectedProduct = ref<(typeof stickerCatalog)[number] | null>(null);
const publishedStickers = ref<Record<string, PublishedSticker>>({});
const publishedDesignerProducts = ref<PublishedDesignerProduct[]>([]);
const publishedCatalogProducts = ref<PublishedCatalogProduct[]>([]);
const catalogLoading = ref(true);
const selectedVariantId = ref("");
const catalogError = ref("");
const artworkFile = ref<File | null>(null);
const artworkPreviewUrl = ref("");
const artworkCanvas = ref<HTMLElement | null>(null);
const isArtworkDragOver = ref(false);
const artworkDropCaptured = ref(false);
const artworkPosition = ref({ x: 50, y: 50 });
const artworkSize = ref(52);
const artworkPointerInteraction = ref<ArtworkPointerInteraction | null>(null);
let artworkDragDepth = 0;
let artworkCaptureTimer: number | null = null;
const uploadingArtwork = ref(false);
const selectedOptions = ref<Record<string, string>>({});
const selectedSticker = computed(() => selectedProduct.value ? publishedStickers.value[selectedProduct.value.id] : undefined);
const selectedVariant = computed(() => selectedSticker.value?.variants.find((variant) => variant.id === selectedVariantId.value));
const selectedQuantityTotal = computed(() => selectedVariant.value?.salePrice);
const quantityOptions = computed(() => {
  const product = selectedProduct.value;
  if (!product) return [];
  const options = stickerSpecifications[product.id]?.optionGroups.find((group) => group.label === "Cantidad")?.options;
  if (options?.length) {
    return options.map((name) => ({
      name,
      variant: selectedSticker.value?.variants.find((variant) =>
        variant.salePrice > 0 && variant.currency === "MXN"
        && normalizeQuantity(variant.name) === normalizeQuantity(name),
      ),
    }));
  }
  return (selectedSticker.value?.variants ?? [])
    .filter((variant) => variant.salePrice > 0 && variant.currency === "MXN")
    .map((variant) => ({ name: variant.name, variant }));
});
const selectedOptionGroups = computed(() => (selectedProduct.value
  ? stickerSpecifications[selectedProduct.value.id]?.optionGroups.filter((group) => !["Cantidad", "Tamaño"].includes(group.label)) ?? []
  : []));
const selectedProductOptions = computed(() => selectedProduct.value?.options.filter((option) =>
  !quantityOptions.value.length || !/^cantidades?\b/i.test(option),
) ?? []);
const selectedStartingPrice = computed(() => {
  const sticker = selectedSticker.value;
  if (!sticker) return undefined;
  const prices = sticker.variants
    .filter((variant) => variant.currency === "MXN")
    .map((variant) => variant.salePrice)
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : undefined;
});
const cartActionHelp = computed(() => {
  if (catalogLoading.value) return "Consultando disponibilidad y precios…";
  if (!selectedSticker.value) return "Este producto aún no está publicado para venta en Printly.";
  if (!selectedVariant.value) return "Configura y publica el precio de una presentación para habilitar la compra.";
  if (!artworkFile.value) return "Sube tu diseño para agregar este producto a la bolsa.";
  return "";
});
const artworkPreviewStyle = computed(() => ({
  left: `${artworkPosition.value.x}%`,
  top: `${artworkPosition.value.y}%`,
  width: `${artworkSize.value}%`,
  height: `${artworkSize.value}%`,
}));
const publishedStickerCount = computed(() => Object.values(publishedStickers.value)
  .filter((sticker) => sticker.variants.some((variant) => variant.salePrice > 0 && variant.currency === "MXN")).length);
const customizableProducts = computed(() => publishedDesignerProducts.value.flatMap((published) => {
  const template = getCustomerProductTemplate(published.productType);
  if (!template) return [];
  return [{
    ...template,
    id: published.productId,
    templateId: published.productType,
    name: published.name,
    variants: published.variants.map((variant) => variant.name),
  }];
}));
const visiblePublishedCatalogProducts = computed(() => publishedCatalogProducts.value.filter((product) =>
  `${product.name} ${product.productType} ${product.description ?? ""}`.toLowerCase().includes(search.value.trim().toLowerCase()),
));
const publishedCatalogSections = computed(() => {
  const sections = new Map<string, PublishedCatalogProduct[]>();
  const categoryByType: Record<string, string> = {
    "phone-case": "Accesorios",
    "label-sheet": "Etiquetas",
    "label-roll": "Etiquetas",
    custom: "Otros",
    "custom-item": "Otros",
  };
  for (const product of visiblePublishedCatalogProducts.value) {
    const category = getCustomerProductTemplate(product.productType)?.category
      ?? categoryByType[product.productType]
      ?? "Otros productos";
    const section = sections.get(category) ?? [];
    section.push(product);
    sections.set(category, section);
  }
  return [...sections].map(([category, products]) => ({ category, products }));
});
const visibleProducts = computed(() => stickerCatalog.filter((product) =>
  (selectedCategory.value === "Todos" || product.category === selectedCategory.value)
  && `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search.value.trim().toLowerCase()),
));

function clearArtworkPreview() {
  if (artworkCaptureTimer !== null) {
    window.clearTimeout(artworkCaptureTimer);
    artworkCaptureTimer = null;
  }
  if (artworkPreviewUrl.value) URL.revokeObjectURL(artworkPreviewUrl.value);
  artworkPreviewUrl.value = "";
  artworkFile.value = null;
  isArtworkDragOver.value = false;
  artworkDropCaptured.value = false;
  artworkDragDepth = 0;
  artworkPosition.value = { x: 50, y: 50 };
  artworkSize.value = 52;
  artworkPointerInteraction.value = null;
}

function closeStickerDetail() {
  clearArtworkPreview();
  selectedProduct.value = null;
}

async function openStickerProduct(product: (typeof stickerCatalog)[number]) {
  selectedProduct.value = product;
  selectedVariantId.value = "";
  clearArtworkPreview();
  await loadPublishedStickers();
  const variants = publishedStickers.value[product.id]?.variants ?? [];
  const quantityNames = stickerSpecifications[product.id]?.optionGroups.find((group) => group.label === "Cantidad")?.options;
  selectedVariantId.value = (quantityNames
    ? variants.find((variant) => variant.salePrice > 0 && variant.currency === "MXN" && quantityNames.some((name) => normalizeQuantity(name) === normalizeQuantity(variant.name)))
    : variants.find((variant) => variant.salePrice > 0 && variant.currency === "MXN"))?.id ?? "";
  selectedOptions.value = Object.fromEntries(
    (stickerSpecifications[product.id]?.optionGroups ?? [])
      .filter((group) => !["Cantidad", "Tamaño"].includes(group.label))
      .map((group) => [group.label, group.options[0] ?? ""]),
  );
}

function useArtworkFile(file: File | null) {
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    catalogError.value = "El diseño debe ser una imagen PNG, JPG o WebP.";
    clearArtworkPreview();
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    catalogError.value = "El diseño debe pesar hasta 5 MB.";
    clearArtworkPreview();
    return;
  }
  catalogError.value = "";
  clearArtworkPreview();
  artworkFile.value = file;
  artworkPreviewUrl.value = URL.createObjectURL(file);
  artworkDropCaptured.value = true;
  artworkCaptureTimer = window.setTimeout(() => {
    artworkDropCaptured.value = false;
    artworkCaptureTimer = null;
  }, 1100);
}

function selectArtwork(event: Event) {
  useArtworkFile((event.target as HTMLInputElement).files?.[0] ?? null);
}

function hasDraggedFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function handleArtworkDragEnter(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  event.preventDefault();
  artworkDragDepth += 1;
  isArtworkDragOver.value = true;
}

function handleArtworkDragOver(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
}

function handleArtworkDragLeave(event: DragEvent) {
  if (!hasDraggedFiles(event)) return;
  event.preventDefault();
  artworkDragDepth = Math.max(0, artworkDragDepth - 1);
  if (artworkDragDepth === 0) isArtworkDragOver.value = false;
}

function handleArtworkDrop(event: DragEvent) {
  event.preventDefault();
  artworkDragDepth = 0;
  isArtworkDragOver.value = false;
  useArtworkFile(event.dataTransfer?.files[0] ?? null);
}

function clampArtworkPosition(position: { x: number; y: number }, size = artworkSize.value) {
  const halfSize = size / 2;
  return {
    x: Math.min(100 - halfSize, Math.max(halfSize, position.x)),
    y: Math.min(100 - halfSize, Math.max(halfSize, position.y)),
  };
}

function resizeArtworkBy(amount: number) {
  artworkSize.value = Math.min(85, Math.max(15, artworkSize.value + amount));
  artworkPosition.value = clampArtworkPosition(artworkPosition.value);
}

function startArtworkPointerInteraction(event: PointerEvent, mode: ArtworkInteractionMode) {
  if (!artworkCanvas.value) return;
  event.preventDefault();
  event.stopPropagation();
  const bounds = artworkCanvas.value.getBoundingClientRect();
  artworkPointerInteraction.value = {
    pointerId: event.pointerId,
    mode,
    startX: event.clientX,
    startY: event.clientY,
    startLeft: artworkPosition.value.x,
    startTop: artworkPosition.value.y,
    startSize: artworkSize.value,
    canvasWidth: bounds.width,
    canvasHeight: bounds.height,
  };
  artworkCanvas.value.setPointerCapture(event.pointerId);
}

function moveArtworkPointerInteraction(event: PointerEvent) {
  const interaction = artworkPointerInteraction.value;
  if (!interaction || interaction.pointerId !== event.pointerId) return;
  event.preventDefault();
  const deltaX = (event.clientX - interaction.startX) / interaction.canvasWidth * 100;
  const deltaY = (event.clientY - interaction.startY) / interaction.canvasHeight * 100;
  if (interaction.mode === "move") {
    artworkPosition.value = clampArtworkPosition({
      x: interaction.startLeft + deltaX,
      y: interaction.startTop + deltaY,
    });
    return;
  }
  const sizeDelta = (deltaX + deltaY) / 2;
  artworkSize.value = Math.min(85, Math.max(15, interaction.startSize + sizeDelta));
  artworkPosition.value = clampArtworkPosition(artworkPosition.value);
}

function endArtworkPointerInteraction(event: PointerEvent) {
  if (artworkPointerInteraction.value?.pointerId !== event.pointerId) return;
  if (artworkCanvas.value?.hasPointerCapture(event.pointerId)) {
    artworkCanvas.value.releasePointerCapture(event.pointerId);
  }
  artworkPointerInteraction.value = null;
}

function handleArtworkPreviewKeydown(event: KeyboardEvent) {
  const moveStep = event.shiftKey ? 5 : 2;
  if (event.key === "ArrowLeft") artworkPosition.value = clampArtworkPosition({ ...artworkPosition.value, x: artworkPosition.value.x - moveStep });
  else if (event.key === "ArrowRight") artworkPosition.value = clampArtworkPosition({ ...artworkPosition.value, x: artworkPosition.value.x + moveStep });
  else if (event.key === "ArrowUp") artworkPosition.value = clampArtworkPosition({ ...artworkPosition.value, y: artworkPosition.value.y - moveStep });
  else if (event.key === "ArrowDown") artworkPosition.value = clampArtworkPosition({ ...artworkPosition.value, y: artworkPosition.value.y + moveStep });
  else return;
  event.preventDefault();
}

function formatCurrency(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(amount);
}

function getPublishedStickerPrice(productId: string) {
  const prices = publishedStickers.value[productId]?.variants
    .filter((variant) => variant.salePrice > 0 && variant.currency === "MXN")
    .map((variant) => variant.salePrice) ?? [];
  return prices.length ? Math.min(...prices) : null;
}

function normalizeQuantity(value: string) {
  return value.replace(/\D/g, "");
}

async function loadPublishedStickers() {
  catalogError.value = "";
  catalogLoading.value = true;
  try {
    const response = await api.get<{
      items: PublishedSticker[];
      designerProducts?: PublishedDesignerProduct[];
      catalogProducts?: PublishedCatalogProduct[];
    }>("/storefront/catalog");
    publishedStickers.value = Object.fromEntries(response.data.items.map((item) => [item.externalProductId, item]));
    publishedDesignerProducts.value = response.data.designerProducts ?? [];
    publishedCatalogProducts.value = response.data.catalogProducts ?? [];
  } catch (error) {
    catalogError.value = getErrorMessage(error);
  } finally {
    catalogLoading.value = false;
  }
}

function getPublishedDesignerProduct(productId: string) {
  return publishedDesignerProducts.value.find((published) => published.productId === productId);
}

function getPublishedDesignerPrice(productId: string) {
  const prices = getPublishedDesignerProduct(productId)?.variants.map((variant) => variant.salePrice) ?? [];
  return prices.length ? Math.min(...prices) : null;
}

function getDesignerAvailabilityLabel(productId: string) {
  if (catalogLoading.value) return "Consultando disponibilidad";
  if (catalogError.value) return "Disponibilidad no confirmada";
  return getPublishedDesignerProduct(productId)?.variants.length ? "Personaliza y compra" : "Próximamente";
}

async function addStickerToCart() {
  if (catalogLoading.value || catalogError.value || !selectedProduct.value || !selectedSticker.value || !selectedVariant.value || !artworkFile.value || uploadingArtwork.value) return;
  uploadingArtwork.value = true;
  catalogError.value = "";
  try {
    const cartKey = "printly-customer-cart";
    const saved = localStorage.getItem(cartKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) throw new Error("El formato de la bolsa no es válido.");
    const cart = parsed as StorefrontCartItem[];
    const artworkFingerprint = await fingerprintArtwork(artworkFile.value);
    const result = addOrIncrementCartItem(cart, {
      id: `${selectedSticker.value.productId}:${selectedVariant.value.id}`,
      productId: selectedSticker.value.productId,
      variantId: selectedVariant.value.id,
      name: selectedProduct.value.name,
      variant: selectedVariant.value.name,
      price: selectedVariant.value.salePrice,
      quantity: 1,
      artworkFingerprint,
      options: { ...selectedOptions.value },
    });
    if (!result.merged) {
      try {
        const addedItem = result.cart.at(-1);
        if (!addedItem) throw new Error("No se pudo agregar el producto a la bolsa.");
        addedItem.localArtworkId = await saveCustomerArtwork(artworkFile.value);
      } catch (error) {
        result.cart.pop();
        throw error;
      }
    }
    localStorage.setItem(cartKey, JSON.stringify(result.cart));
    window.dispatchEvent(new Event("printly-cart-updated"));
    window.dispatchEvent(new Event("printly-cart-open"));
    selectedProduct.value = null;
  } catch (error) {
    catalogError.value = getErrorMessage(error);
  } finally {
    uploadingArtwork.value = false;
  }
}

function refreshCatalogWhenFocused() {
  if (document.visibilityState === "visible") void loadPublishedStickers();
}

onMounted(() => {
  void loadPublishedStickers();
  window.addEventListener("focus", refreshCatalogWhenFocused);
});
onUnmounted(() => {
  window.removeEventListener("focus", refreshCatalogWhenFocused);
  clearArtworkPreview();
});
</script>

<template>
  <main>
    <section class="store-hero">
      <div class="store-hero-copy">
        <span class="store-kicker"><i></i> STICKERS PARA CADA IDEA</span>
        <h1>Tu diseño,<br />en <em>cada superficie.</em></h1>
        <p>Explora acabados especiales, viniles para exterior y stickers personalizados para tu marca, tus espacios y tus objetos.</p>
        <a class="store-primary-button store-hero-button" href="#productos">Explora los stickers <span>→</span></a>
        <div class="store-hero-proof"><span>✳</span> Catálogo de referencia de Pegapega.mx</div>
      </div>
      <div class="store-hero-art store-sticker-hero-art" aria-label="Muestras ilustrativas de acabados de stickers">
        <div class="store-hero-sun"></div>
        <div class="hero-sticker hero-sticker-holo"><span>HOLA<br />MUNDO</span></div>
        <div class="hero-sticker hero-sticker-metal"><span>BRILLA</span></div>
        <div class="hero-sticker hero-sticker-transfer"><span>✳</span></div>
        <div class="store-hero-sparkle sparkle-one">✳</div><div class="store-hero-sparkle sparkle-two">✳</div>
        <span class="store-art-caption">VINIL · ACABADOS · DISEÑO</span>
      </div>
      <div class="store-hero-index">01 — 03</div>
    </section>

    <section id="como-funciona" class="store-how-section">
      <div><span class="store-kicker">ENCUENTRA EL ACABADO</span><h2>Un sticker para cada superficie.</h2></div>
      <div class="store-how-steps">
        <article><span>01</span><div><strong>Elige el efecto</strong><p>Mate, transparente, metálico, reflejante o con relieve.</p></div></article>
        <article><span>02</span><div><strong>Revisa las opciones</strong><p>Consulta materiales, cortes, tintas y cantidades publicadas.</p></div></article>
        <article><span>03</span><div><strong>Continúa con el proveedor</strong><p>Confirma precio, especificaciones y disponibilidad en su ficha.</p></div></article>
      </div>
    </section>

    <section id="productos" class="store-products-section">
      <div class="store-section-heading">
        <div><span class="store-kicker">CATÁLOGO DE PRODUCTOS</span><h2>Encuentra lo que buscas.</h2></div>
        <label class="store-search"><span aria-hidden="true">⌕</span><input v-model="search" aria-label="Buscar productos" placeholder="Busca un producto o acabado..." /></label>
      </div>
      <div class="store-product-filters" role="group" aria-label="Filtrar por categoría">
        <button v-for="category in stickerCategories" :key="category" type="button" :class="{ active: selectedCategory === category }" @click="selectedCategory = category">{{ category }}</button>
      </div>
      <div v-if="visibleProducts.length" class="store-product-grid">
        <article v-for="(product, index) in visibleProducts" :key="product.id" class="store-product-card sticker-catalog-card">
          <button class="store-product-visual sticker-product-visual" :style="{ '--sticker-accent': product.accent }" type="button" :aria-label="`Ver detalles de ${product.name}`" @click="openStickerProduct(product)">
            <span class="store-product-number">{{ String(index + 1).padStart(2, "0") }}</span>
            <img class="sticker-product-image" :src="product.image" :alt="product.name" loading="lazy" decoding="async">
            <span class="store-product-quick">Ver detalles <b>↗</b></span>
          </button>
          <div class="store-product-info">
            <div><span>{{ product.category }}</span><h3>{{ product.name }}</h3></div>
            <strong v-if="getPublishedStickerPrice(product.id) !== null">{{ formatCurrency(getPublishedStickerPrice(product.id) ?? 0) }}+ <small>MXN</small></strong>
            <strong v-else>Próximamente</strong>
          </div>
          <button class="store-product-link" type="button" @click="openStickerProduct(product)">Materiales y opciones <span>→</span></button>
        </article>
      </div>
      <div v-else-if="!visiblePublishedCatalogProducts.length" class="store-no-results"><strong>No encontramos productos</strong><p>Prueba otra búsqueda o categoría.</p></div>
      <section v-if="visiblePublishedCatalogProducts.length" class="published-catalog-products" aria-labelledby="published-catalog-title">
        <div class="published-catalog-heading">
          <span class="store-kicker">PRODUCTOS PUBLICADOS</span>
          <h3 id="published-catalog-title">Más productos en nuestro catálogo</h3>
        </div>
        <div v-for="section in publishedCatalogSections" :key="section.category" class="published-catalog-section">
          <h4 class="published-catalog-section-title">{{ section.category }}</h4>
          <div class="store-product-grid custom-product-grid">
            <article v-for="product in section.products" :key="product.productId" class="store-product-card published-catalog-product-card">
              <div class="store-product-visual published-catalog-product-visual">
                <span class="custom-product-availability-badge">PRÓXIMAMENTE</span>
                <span class="published-catalog-product-icon" aria-hidden="true">◇</span>
                <strong>{{ product.name }}</strong>
              </div>
              <div class="store-product-info">
                <div><span>{{ product.productType === "custom" ? "Producto" : product.productType }}</span><h3>{{ product.name }}</h3></div>
                <strong v-if="product.startingPrice !== null">Desde {{ formatCurrency(product.startingPrice) }}</strong>
                <strong v-else>Precio próximamente</strong>
              </div>
              <p v-if="product.description" class="published-catalog-product-description">{{ product.description }}</p>
              <p class="store-product-link published-catalog-product-notice">Publicado · personalización y compra próximamente</p>
            </article>
          </div>
        </div>
      </section>
      <p v-if="!catalogError && publishedStickerCount === 0" class="storefront-catalog-notice" role="status">
        El catálogo está en preparación. Printly publicará aquí las etiquetas cuando cada presentación tenga precio y disponibilidad confirmados.
      </p>
      <p v-if="catalogError" class="store-demo-note">No fue posible consultar la disponibilidad actual. {{ catalogError }}</p>
      <p class="store-demo-note">Los precios de venta aparecen solo para productos publicados por Printly. Las fichas resumen medidas, materiales y variantes anunciadas por el proveedor; las dimensiones no publicadas se identifican como tales.</p>
      <a class="store-source-link" href="https://pegapega.mx/shop/" target="_blank" rel="noopener noreferrer">Ver catálogo y precios vigentes en Pegapega.mx <span>↗</span></a>

    <div id="personaliza" class="custom-products-section">
      <div class="store-section-heading">
        <div><span class="store-kicker">TU ESTUDIO DE PERSONALIZACIÓN</span><h2>Diseña prendas y objetos para ti.</h2></div>
        <p>Sube tu arte, agrega texto y ajusta la composición en una vista previa interactiva.</p>
      </div>
      <div v-if="customizableProducts.length" class="store-product-grid custom-product-grid">
        <article v-for="(product, index) in customizableProducts" :key="product.id" class="store-product-card custom-product-card">
          <RouterLink :to="{ name: 'storefront-designer', params: { productId: product.id } }" class="custom-product-visual" :style="{ '--merch-color': product.color }" :aria-label="`Personalizar ${product.name}`">
            <span class="store-product-number">{{ String(index + 1).padStart(2, "0") }}</span>
            <svg class="custom-product-defs" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient :id="`merch-finish-${product.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fff" stop-opacity=".92" />
                  <stop offset="24%" stop-color="var(--merch-color)" />
                  <stop offset="78%" stop-color="var(--merch-color)" />
                  <stop offset="100%" stop-color="#26362c" stop-opacity=".3" />
                </linearGradient>
                <linearGradient :id="`merch-gloss-${product.id}`" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#fff" stop-opacity=".4" />
                  <stop offset="48%" stop-color="#fff" stop-opacity="0" />
                  <stop offset="100%" stop-color="#26362c" stop-opacity=".14" />
                </linearGradient>
                <linearGradient :id="`merch-metal-${product.id}`" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#fff5ce" />
                  <stop offset="42%" stop-color="#a98b56" />
                  <stop offset="68%" stop-color="#fff9df" />
                  <stop offset="100%" stop-color="#706047" />
                </linearGradient>
              </defs>
            </svg>
            <svg v-if="product.kind === 'tee' || product.kind === 'hoodie'" class="custom-product-shape custom-apparel-shape" viewBox="0 0 360 390" aria-hidden="true">
              <path v-if="product.kind === 'tee'" :fill="`url(#merch-finish-${product.id})`" d="M115 35 65 54 18 115l49 39 28-29v211h170V125l28 29 49-39-47-61-50-19c-12 26-35 42-65 42s-53-16-65-42Z" />
              <path v-else :fill="`url(#merch-finish-${product.id})`" d="m115 46-50 17-47 61 49 39 28-29v202h170V134l28 29 49-39-47-61-50-17-20 27-27 21-27-21Z" />
              <path v-if="product.kind === 'hoodie'" :fill="`url(#merch-gloss-${product.id})`" d="M130 53c0-34 20-52 50-52s50 18 50 52l-13 22h-74Z" />
              <path class="custom-product-detail" d="M115 35c12 26 35 42 65 42s53-16 65-42M94 125v220m172-220v220M104 325h152" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m66 57 30-12v275c-18-48-28-145-30-263Zm200 0-30-12v275c18-48 28-145 30-263Z" />
              <path v-if="product.kind === 'hoodie'" class="custom-product-detail" d="M132 68c11 26 28 39 48 39s37-13 48-39m-70 39 22 17 22-17m-53 164h70v48h-70Z" />
            </svg>
            <svg v-else-if="product.kind === 'socks'" class="custom-product-shape custom-apparel-shape" viewBox="0 0 360 360" aria-hidden="true">
              <path :fill="`url(#merch-finish-${product.id})`" d="M95 44h82v162c0 21-12 33-31 45l-46 29c-25 16-22 43 2 52 21 8 55 2 81-15l54-36c25-17 32-35 32-67V44h-82v153l-45 25V44Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="M105 54h62v154l-53 29-8-15V54Zm91 0h62v160c0 28-5 41-26 56l-36 24V54Z" />
              <path class="custom-product-detail" d="M95 44h82m82 0h-82M99 270c-17 12-27 30-20 45m184-45c17 12 27 30 20 45" />
            </svg>
            <svg v-else-if="product.kind === 'mug'" class="custom-product-shape custom-drink-shape" viewBox="0 0 360 300" aria-hidden="true">
              <path class="custom-product-handle" d="M261 88h28c43 0 43 94 0 94h-28" />
              <path :fill="`url(#merch-finish-${product.id})`" d="M60 54h206v194c0 21-16 38-37 38H97c-21 0-37-17-37-38V54Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="M72 68h34v190H96c-13 0-24-11-24-24V68Z" />
              <ellipse cx="163" cy="56" rx="103" ry="13" class="custom-product-rim" />
              <path class="custom-product-detail" d="M61 58c52 16 153 16 204 0m-194 187c40 15 145 15 184 0" />
              <path class="custom-product-detail custom-product-handle-light" d="M274 100c22 2 23 62 0 65" />
            </svg>
            <svg v-else-if="product.kind === 'tote'" class="custom-product-shape" viewBox="0 0 360 380" aria-hidden="true">
              <path class="custom-product-detail custom-tote-straps" d="M118 141V91c0-76 124-76 124 0v50" />
              <path :fill="`url(#merch-finish-${product.id})`" d="m65 120 230 0-18 225H83L65 120Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m82 137 38 0 12 188H99L82 137Zm196 0-38 0-12 188h33l17-188Z" />
              <path class="custom-product-detail" d="m79 137 202 0-15 194H94L79 137Zm39-11V91c0-59 124-59 124 0v35" />
              <path class="custom-product-detail custom-tote-stitch" d="M93 151v171m174-171v171" />
            </svg>
            <svg v-else-if="product.kind === 'pillow' || product.kind === 'puzzle'" class="custom-product-shape" viewBox="0 0 360 360" aria-hidden="true">
              <rect x="50" y="50" width="260" height="260" rx="18" :fill="`url(#merch-finish-${product.id})`" />
              <path v-if="product.kind === 'pillow'" class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m67 65 90 0-39 229H66l1-229Zm226 0-90 0 39 229h52l-1-229Z" />
              <rect x="60" y="60" width="240" height="240" rx="14" class="custom-product-detail custom-product-seam" />
              <rect v-if="product.kind === 'puzzle'" x="67" y="67" width="226" height="226" rx="8" class="custom-product-detail" />
              <path v-if="product.kind === 'puzzle'" class="custom-product-puzzle-line" d="M180 68v224m-112-112h224" />
            </svg>
            <svg v-else-if="product.kind === 'keychain'" class="custom-product-shape" viewBox="0 0 360 360" aria-hidden="true">
              <circle cx="180" cy="83" r="43" fill="none" :stroke="`url(#merch-metal-${product.id})`" stroke-width="15" />
              <circle cx="180" cy="83" r="25" fill="none" stroke="#fff9" stroke-width="3" />
              <path :fill="`url(#merch-finish-${product.id})`" d="m145 123 70 0 18 182H127l18-182Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m151 136 18 0-12 154h-19l13-154Z" />
              <path class="custom-product-detail" d="m145 123 70 0m-55 22h40" />
            </svg>
            <svg v-else-if="product.kind === 'plaque' || product.kind === 'mousepad'" class="custom-product-shape" viewBox="0 0 360 380" aria-hidden="true">
              <rect x="42" y="58" width="276" height="272" :rx="product.kind === 'mousepad' ? 22 : 4" fill="#26362c" opacity=".16" />
              <rect x="42" y="48" width="276" height="272" :rx="product.kind === 'mousepad' ? 22 : 4" :fill="`url(#merch-finish-${product.id})`" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m58 63 60 0-44 236H58V63Zm244 0-60 0 44 236h16V63Z" />
              <rect x="56" y="62" width="248" height="244" :rx="product.kind === 'mousepad' ? 17 : 1" class="custom-product-detail" />
              <path v-if="product.kind === 'mousepad'" class="custom-product-detail custom-mousepad-stitch" d="M70 76h220v216H70z" />
            </svg>
            <svg v-else-if="product.kind === 'apron'" class="custom-product-shape custom-apparel-shape" viewBox="0 0 360 390" aria-hidden="true">
              <path :fill="`url(#merch-finish-${product.id})`" d="M132 100c0-66 96-66 96 0l38 20 38 228H56l38-228 38-20Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m96 129 32-17-28 214H70l26-197Zm168 0-32-17 28 214h30l-26-197Z" />
              <path class="custom-product-detail" d="M132 100q48 32 96 0M94 158h172M132 100 95 120m133-20 37 20" />
              <path class="custom-product-pocket" d="M132 184h96v78c0 8-7 14-14 14h-68c-8 0-14-6-14-14v-78Z" />
            </svg>
            <svg v-else-if="product.kind === 'cap'" class="custom-product-shape" viewBox="0 0 360 300" aria-hidden="true">
              <path :fill="`url(#merch-finish-${product.id})`" d="M48 185c10-86 63-137 133-137s116 42 129 111l-102 33H48Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="M66 165c22-68 60-101 115-109-38 40-59 86-65 150H48Z" />
              <path :fill="`url(#merch-finish-${product.id})`" d="M48 185c54 31 130 25 245-26 20 20 22 47 5 61-62 39-170 42-250 7-14-6-17-28 0-42Z" />
              <path class="custom-product-detail" d="M48 185c54 31 130 25 245-26 20 20 22 47 5 61-62 39-170 42-250 7m133-86c-23 27-35 63-36 106m-92-31c45 13 90 14 136 2" />
            </svg>
            <svg v-else-if="product.kind === 'poster'" class="custom-product-shape" viewBox="0 0 300 380" aria-hidden="true">
              <rect x="34" y="30" width="232" height="332" rx="3" fill="#26362c" opacity=".2" />
              <rect x="34" y="20" width="232" height="332" rx="3" :fill="`url(#merch-finish-${product.id})`" />
              <rect x="44" y="30" width="212" height="312" rx="1" fill="#fffdf8" />
              <rect x="56" y="42" width="188" height="288" rx="1" :fill="`url(#merch-gloss-${product.id})`" />
              <path class="custom-product-detail" d="M52 38h196v296H52z" />
            </svg>
            <svg v-else class="custom-product-shape custom-drink-shape" viewBox="0 0 300 380" aria-hidden="true">
              <path :fill="`url(#merch-finish-${product.id})`" d="M103 54h94l22 36-9 249H90L81 90l22-36Z" />
              <path class="custom-product-gloss" :fill="`url(#merch-gloss-${product.id})`" d="m97 99 24 0-11 221H94L97 99Zm106 0-24 0 11 221h16l-3-221Z" />
              <path :fill="`url(#merch-metal-${product.id})`" d="M103 40h94v26h-94z" />
              <path class="custom-product-detail" d="M103 69h94m-92 31h90m-89 216h87" />
            </svg>
            <span class="custom-product-print" :class="`custom-product-print--${product.kind}`" aria-hidden="true">
              <i>✳</i>
              <strong>{{ product.kind === "mug" ? "BUEN DÍA" : product.kind === "bottle" ? "A TU RITMO" : "HECHO PARA TI" }}</strong>
              <small>PRINTLY STUDIO</small>
            </span>
            <span class="custom-design-badge">CREA TU DISEÑO <b>↗</b></span>
            <span v-if="getDesignerAvailabilityLabel(product.id) === 'Próximamente'" class="custom-product-availability-badge">PRÓXIMAMENTE</span>
          </RouterLink>
          <div class="store-product-info">
            <div><span>{{ product.category }}</span><h3>{{ getPublishedDesignerProduct(product.id)?.name ?? product.name }}</h3></div>
            <strong v-if="getPublishedDesignerPrice(product.id) !== null">Desde {{ formatCurrency(getPublishedDesignerPrice(product.id) ?? 0) }}</strong>
            <strong v-else-if="catalogLoading">Consultando precio</strong>
            <strong v-else-if="catalogError">No disponible</strong>
            <strong v-else>Próximamente</strong>
          </div>
          <RouterLink :to="{ name: 'storefront-designer', params: { productId: product.id } }" class="store-product-link custom-product-cta">
            {{ getPublishedDesignerProduct(product.id) ? "Abrir diseñador profesional" : "Explorar diseñador" }} <span>→</span>
          </RouterLink>
        </article>
      </div>
      <p v-if="catalogError" class="custom-products-note" role="alert">No se pudo verificar qué productos están disponibles para compra. {{ catalogError }}</p>
      <p v-else-if="!customizableProducts.length" class="custom-products-note">Aún no hay productos publicados que se puedan personalizar. Consulta el catálogo para ver los demás productos disponibles próximamente.</p>
      <p v-else class="custom-products-note">En esta sección solo aparecen productos publicados con una plantilla compatible para personalizarlos.</p>
    </div>
    </section>

    <section class="store-cta">
      <div><span class="store-kicker">BUSCA TU PRÓXIMO ACABADO</span><h2>De un diseño a una idea que se pega.</h2><p>Consulta los detalles y opciones directamente en la página del producto.</p></div>
      <a href="https://pegapega.mx/shop/" target="_blank" rel="noopener noreferrer" class="store-cta-link">Abrir el catálogo original <span>↗</span></a>
      <div class="store-cta-orbit"></div>
    </section>

    <div v-if="selectedProduct" class="sticker-detail-backdrop" @click.self="closeStickerDetail" @keydown.esc="closeStickerDetail">
      <section class="sticker-detail-modal" role="dialog" aria-modal="true" :aria-label="selectedProduct.name">
        <button class="sticker-detail-close" type="button" aria-label="Cerrar detalles" @click="closeStickerDetail">×</button>
        <div
          ref="artworkCanvas"
          class="sticker-detail-art"
          :class="{ 'is-artwork-drag-over': isArtworkDragOver, 'is-artwork-captured': artworkDropCaptured }"
          :style="{ '--sticker-accent': selectedProduct.accent }"
          @dragenter="handleArtworkDragEnter"
          @dragover="handleArtworkDragOver"
          @dragleave="handleArtworkDragLeave"
          @drop="handleArtworkDrop"
          @pointermove="moveArtworkPointerInteraction"
          @pointerup="endArtworkPointerInteraction"
          @pointercancel="endArtworkPointerInteraction"
        >
          <img class="sticker-detail-image" :src="selectedProduct.image" :alt="selectedProduct.name" decoding="async">
          <div v-if="!artworkPreviewUrl && !isArtworkDragOver" class="sticker-artwork-drop-hint" aria-hidden="true">
            <span class="sticker-artwork-drop-icon">↑</span>
            <span>ARRASTRA TU DISEÑO AQUÍ</span>
          </div>
          <div v-if="isArtworkDragOver" class="sticker-artwork-drop-overlay" aria-live="polite">
            <span class="sticker-artwork-drop-rings"></span>
            <span class="sticker-artwork-drop-icon">↓</span>
            <strong>Suelta tu diseño</strong>
            <small>PNG, JPG o WebP · hasta 5 MB</small>
          </div>
          <div v-if="artworkDropCaptured" class="sticker-artwork-capture-toast" role="status">
            <span>✓</span> Diseño listo para personalizar
          </div>
          <div
            v-if="artworkPreviewUrl"
            class="sticker-artwork-preview"
            :class="{ 'is-dragging': artworkPointerInteraction?.mode === 'move', 'is-resizing': artworkPointerInteraction?.mode === 'resize' }"
            :style="artworkPreviewStyle"
            role="group"
            aria-label="Vista previa del diseño. Usa las flechas para moverlo."
            tabindex="0"
            @pointerdown="startArtworkPointerInteraction($event, 'move')"
            @keydown="handleArtworkPreviewKeydown"
          >
            <img :src="artworkPreviewUrl" alt="Vista previa de tu diseño">
            <span class="sticker-artwork-active-badge"><i></i> DISEÑO ACTIVO</span>
            <button
              class="sticker-artwork-resize-handle"
              type="button"
              aria-label="Arrastrar para cambiar el tamaño del diseño"
              @pointerdown="startArtworkPointerInteraction($event, 'resize')"
            ></button>
          </div>
          <span v-if="artworkPreviewUrl" class="sticker-artwork-preview-caption">Arrastra el diseño para posicionarlo</span>
          <div v-if="artworkPreviewUrl" class="sticker-artwork-controls" aria-label="Controles del tamaño del diseño">
            <span>TAMAÑO</span>
            <button type="button" aria-label="Reducir tamaño del diseño" :disabled="artworkSize <= 15" @click="resizeArtworkBy(-5)">−</button>
            <input
              :value="artworkSize"
              type="range"
              min="15"
              max="85"
              step="1"
              aria-label="Tamaño del diseño"
              @input="resizeArtworkBy(Number(($event.target as HTMLInputElement).value) - artworkSize)"
            >
            <button type="button" aria-label="Aumentar tamaño del diseño" :disabled="artworkSize >= 85" @click="resizeArtworkBy(5)">+</button>
            <b>{{ artworkSize }}%</b>
          </div>
        </div>
        <div class="sticker-detail-content">
          <span class="store-kicker">{{ selectedProduct.category }}</span>
          <h2>{{ selectedProduct.name }}</h2>
          <p class="sticker-detail-description">{{ selectedProduct.description }}</p>
          <strong v-if="selectedStartingPrice !== undefined && selectedStartingPrice > 0" class="sticker-price-range">{{ formatCurrency(selectedStartingPrice, selectedSticker?.currency) }} <small>desde</small></strong>
          <strong v-else class="sticker-price-range">{{ catalogLoading ? "Consultando precio" : "Próximamente" }}</strong>
          <fieldset v-if="quantityOptions.length" class="sticker-presentation-select">
            <legend>{{ stickerSpecifications[selectedProduct.id]?.optionGroups.some((group) => group.label === "Cantidad") ? "Elige la cantidad de stickers" : "Elige una presentación" }}</legend>
            <div class="sticker-presentation-options" role="group" aria-label="Presentaciones disponibles">
              <button
                v-for="option in quantityOptions"
                :key="option.name"
                class="sticker-presentation-option"
                :class="{ selected: option.variant?.id === selectedVariantId }"
                type="button"
                :aria-pressed="option.variant?.id === selectedVariantId"
                :disabled="!option.variant || option.variant.salePrice <= 0 || option.variant.currency !== 'MXN'"
                @click="selectedVariantId = option.variant?.id ?? ''"
              >
                <span>{{ option.name }}</span>
                <strong>{{ option.variant && option.variant.salePrice > 0 && option.variant.currency === "MXN" ? formatCurrency(option.variant.salePrice, option.variant.currency) : "Próximamente" }}</strong>
              </button>
            </div>
          </fieldset>
          <div v-if="selectedVariant" class="sticker-order-total" aria-live="polite">
            <span>Total por {{ selectedVariant.name }} stickers</span>
            <strong>{{ formatCurrency(selectedQuantityTotal ?? 0, selectedVariant.currency) }}</strong>
          </div>
          <p v-else-if="quantityOptions.length" class="sticker-cart-help">Las cantidades se muestran como referencia. Configura y publica el precio de cada presentación en Printly para habilitar la compra.</p>
          <label v-for="group in selectedOptionGroups" :key="group.label" class="sticker-variant-select">
            <span>{{ group.label }}</span>
            <select v-model="selectedOptions[group.label]">
              <option v-for="option in group.options" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label
            v-if="selectedVariant"
            class="sticker-variant-select sticker-artwork-upload"
            :class="{ 'is-artwork-drag-over': isArtworkDragOver, 'is-artwork-captured': artworkDropCaptured }"
            @dragenter="handleArtworkDragEnter"
            @dragover="handleArtworkDragOver"
            @dragleave="handleArtworkDragLeave"
            @drop="handleArtworkDrop"
          >
            <span>Archivo del diseño</span>
            <span class="sticker-artwork-upload-prompt">{{ isArtworkDragOver ? "Suelta aquí tu diseño" : "Arrastra una imagen aquí o haz clic para seleccionarla" }}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" @change="selectArtwork">
            <small>PNG, JPG o WebP · Máximo 5 MB. Puedes agregarlo sin cuenta; necesitarás iniciar sesión al continuar al pago.</small>
          </label>
          <p v-if="catalogError" class="store-inline-error" role="alert">{{ catalogError }}</p>
          <p v-else-if="cartActionHelp" class="sticker-cart-help">{{ cartActionHelp }}</p>
          <button class="store-primary-button sticker-source-button sticker-add-cart-button" type="button" :disabled="catalogLoading || Boolean(catalogError) || !selectedVariant || !artworkFile || uploadingArtwork" @click="addStickerToCart">
            {{ uploadingArtwork ? "Agregando al carrito…" : selectedVariant ? `Agregar al carrito · ${formatCurrency(selectedQuantityTotal ?? 0, selectedVariant.currency)}` : "Agregar al carrito" }}
          </button>
          <div class="sticker-detail-block"><h3>Medidas publicadas</h3><ul><li v-for="dimension in stickerSpecifications[selectedProduct.id]?.dimensions" :key="dimension">{{ dimension }}</li></ul></div>
          <div class="sticker-detail-block"><h3>Materiales</h3><ul><li v-for="material in stickerSpecifications[selectedProduct.id]?.materials" :key="material">{{ material }}</li></ul></div>
          <div v-for="group in selectedOptionGroups" :key="group.label" class="sticker-detail-block"><h3>{{ group.label }}</h3><ul><li v-for="option in group.options" :key="option">{{ option }}</li></ul></div>
          <div class="sticker-detail-block"><h3>Producción y notas</h3><ul><li v-for="note in stickerSpecifications[selectedProduct.id]?.productionNotes" :key="note">{{ note }}</li></ul></div>
          <div class="sticker-detail-block"><h3>Características publicadas</h3><ul><li v-for="feature in selectedProduct.features" :key="feature">{{ feature }}</li></ul></div>
          <div v-if="selectedProductOptions.length" class="sticker-detail-block"><h3>Opciones disponibles</h3><ul><li v-for="option in selectedProductOptions" :key="option">{{ option }}</li></ul></div>
          <p class="sticker-detail-source">Detalles resumidos y parafraseados del sitio del proveedor. Algunas fichas pueden tener información incompleta o inconsistente; verifica configuración y precio final antes de ordenar.</p>
        </div>
      </section>
    </div>
  </main>
</template>
