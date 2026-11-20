<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { customerProducts, defaultCustomerProduct, getCustomerProductTemplate } from "../data/customerProducts";
import { getPrintTextColorName, normalizePrintTextColors } from "../data/printTextColors";
import { getProductVariantColorValue } from "../data/productColors";
import type { CustomerDesignerOptions } from "../types";
import api, { getErrorMessage } from "../services/api";
import { deleteCustomerArtwork, saveCustomerArtwork } from "../services/customerArtwork";
import { addOrIncrementCartItem, fingerprintArtwork, type StorefrontCartItem } from "../services/storefrontCart";

type DesignSide = "front" | "back";

interface PublishedDesignerVariant {
  id: string;
  name: string;
  size: string | null;
  color: string | null;
  salePrice: number;
  currency: string;
}

interface PublishedDesignerProduct {
  productId: string;
  name: string;
  productType: string;
  textColorOptions: string[];
  customerDesignerOptions?: Partial<CustomerDesignerOptions>;
  defaultProductColor?: string;
  variants: PublishedDesignerVariant[];
}

interface DesignerCartDesign {
  text: string;
  textColor: string;
  sides: Record<DesignSide, { artwork: boolean; positionX: number; positionY: number; scale: number; rotation: number }>;
}

const defaultCustomerDesignerOptions: CustomerDesignerOptions = {
  productColors: true,
  printTextColors: true,
  text: true,
  artwork: true,
  sides: true,
  transform: true,
};
const route = useRoute();
const routeProductId = computed(() => typeof route.params.productId === "string" ? route.params.productId : "");
const freeProductId = ref("");
const isFreeMode = computed(() => !routeProductId.value);
const legacyProduct = computed(() => customerProducts.find((item) => item.id === routeProductId.value));
const publishedDesignerProducts = ref<PublishedDesignerProduct[]>([]);
const publishedProduct = computed(() => {
  const requestedProductId = routeProductId.value || freeProductId.value;
  return publishedDesignerProducts.value.find((item) => item.productId === requestedProductId)
    ?? (legacyProduct.value
      ? publishedDesignerProducts.value.find((item) => item.productType === legacyProduct.value?.templateId)
      : undefined)
    ?? (!routeProductId.value ? publishedDesignerProducts.value[0] : undefined);
});
const product = computed(() => {
  const definition = publishedProduct.value ? getCustomerProductTemplate(publishedProduct.value.productType) : undefined;
  return definition && publishedProduct.value
    ? { ...definition, id: publishedProduct.value.productId, name: publishedProduct.value.name }
    : legacyProduct.value ?? defaultCustomerProduct;
});
const designerOptions = computed(() => ({
  ...defaultCustomerDesignerOptions,
  ...publishedProduct.value?.customerDesignerOptions,
}));
const selectedColor = ref<string>(product.value.color);
const selectedVariantId = ref("");
const initializedProductId = ref("");
const publishedCatalogLoading = ref(true);
const publishedCatalogError = ref("");
const addingToBag = ref(false);
const text = ref("");
const textColor = ref("#252632");
const selectedSide = ref<DesignSide>("front");
const sideDesigns = ref<Record<DesignSide, { artworkUrl: string; file: File | null; scale: number; positionX: number; positionY: number; rotation: number }>>({
  front: { artworkUrl: "", file: null, scale: 85, positionX: 50, positionY: 48, rotation: 0 },
  back: { artworkUrl: "", file: null, scale: 85, positionX: 50, positionY: 48, rotation: 0 },
});
const currentSideDesign = computed(() => sideDesigns.value[selectedSide.value]);
const artworkUrl = computed(() => currentSideDesign.value.artworkUrl);
const publishedColorValues = computed(() => [...new Set((publishedProduct.value?.variants ?? [])
  .map((variant) => variant.color?.trim())
  .filter((color): color is string => Boolean(color)))]);
const publishedColors = computed(() => publishedColorValues.value.map((value) => ({
  value,
  name: product.value.colors.find((color) => color.value.toLowerCase() === value.toLowerCase() || color.name.toLowerCase() === value.toLowerCase())?.name ?? value,
})));
const publishedTextColors = computed(() => publishedProduct.value && designerOptions.value.printTextColors
  ? normalizePrintTextColors(publishedProduct.value.textColorOptions)
    .map((value) => ({ value, name: getPrintTextColorName(value) }))
  : []);
function resolvePreviewColor(raw: string) {
  const known = getProductVariantColorValue(raw, product.value.colors);
  if (known) return known;
  return typeof CSS !== "undefined" && CSS.supports("color", raw) ? raw : product.value.color;
}
const selectedPreviewColor = computed(() => resolvePreviewColor(selectedColor.value));
const variantsForColor = computed(() => (publishedProduct.value?.variants ?? [])
  .filter((variant) => !publishedColorValues.value.length || variant.color?.trim() === selectedColor.value));
const selectedVariantRecord = computed(() => variantsForColor.value.find((variant) => variant.id === selectedVariantId.value) ?? variantsForColor.value[0]);
const selectedVariant = computed(() => selectedVariantRecord.value?.size ?? selectedVariantRecord.value?.name ?? "");
const canAddToBag = computed(() => Boolean(
  publishedProduct.value
  && selectedVariantRecord.value
  && (
    (designerOptions.value.artwork && (
      sideDesigns.value.front.file
      || (designerOptions.value.sides && sideDesigns.value.back.file)
    ))
    || (designerOptions.value.text && text.value.trim())
  )
  && !publishedCatalogLoading.value
  && !addingToBag.value
));
const scale = computed({
  get: () => currentSideDesign.value.scale,
  set: (value: number) => { currentSideDesign.value.scale = value; },
});
const positionX = computed({
  get: () => currentSideDesign.value.positionX,
  set: (value: number) => { currentSideDesign.value.positionX = value; },
});
const positionY = computed({
  get: () => currentSideDesign.value.positionY,
  set: (value: number) => { currentSideDesign.value.positionY = value; },
});
const rotation = computed({
  get: () => currentSideDesign.value.rotation,
  set: (value: number) => { currentSideDesign.value.rotation = value; },
});
const fileInput = ref<HTMLInputElement | null>(null);
const printArea = ref<HTMLDivElement | null>(null);
const designComposition = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const isArtworkFileOver = ref(false);
const artworkDropCount = ref(0);
const artworkCaptured = ref(false);
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizeStartX = 0;
let resizeStartScale = 0;
let artworkCapturedTimeout: ReturnType<typeof setTimeout> | undefined;
const added = ref(false);
const error = ref("");
const sideLabel = computed(() => selectedSide.value === "front" ? "frente" : "parte trasera");
const money = computed(() => selectedVariantRecord.value
  ? new Intl.NumberFormat("es-MX", { style: "currency", currency: selectedVariantRecord.value.currency }).format(selectedVariantRecord.value.salePrice)
  : "No disponible");

function clearArtwork(side: DesignSide) {
  const design = sideDesigns.value[side];
  if (design.artworkUrl) URL.revokeObjectURL(design.artworkUrl);
  design.artworkUrl = "";
  design.file = null;
}

function applyCustomerDesignerOptions(options?: Partial<CustomerDesignerOptions>) {
  const enabled = { ...defaultCustomerDesignerOptions, ...options };
  if (!enabled.text) text.value = "";
  if (!enabled.artwork) {
    clearArtwork("front");
    clearArtwork("back");
  }
  if (!enabled.sides) {
    selectedSide.value = "front";
    clearArtwork("back");
  }
  if (!enabled.transform) {
    for (const design of Object.values(sideDesigns.value)) {
      design.scale = 85;
      design.positionX = 50;
      design.positionY = 48;
      design.rotation = 0;
    }
  }
}

async function loadPublishedDesignerProducts() {
  publishedCatalogLoading.value = true;
  publishedCatalogError.value = "";
  try {
    const { data } = await api.get<{ designerProducts?: PublishedDesignerProduct[] }>("/storefront/catalog");
    publishedDesignerProducts.value = data.designerProducts ?? [];
    if (!routeProductId.value && !publishedDesignerProducts.value.some((item) => item.productId === freeProductId.value)) {
      freeProductId.value = publishedDesignerProducts.value[0]?.productId ?? "";
    }
    const activeProduct = publishedProduct.value;
    applyCustomerDesignerOptions(activeProduct?.customerDesignerOptions);
    const activeOptions = { ...defaultCustomerDesignerOptions, ...activeProduct?.customerDesignerOptions };
    const variants = activeProduct?.variants ?? [];
    const allowedTextColors = normalizePrintTextColors(activeProduct?.textColorOptions);
    if (!allowedTextColors.includes(textColor.value.toLowerCase())) textColor.value = allowedTextColors[0] ?? "#252632";
    if (activeProduct && initializedProductId.value !== activeProduct.productId) {
      initializedProductId.value = activeProduct.productId;
      selectedColor.value = product.value.color;
    }
    const firstColor = variants.find((variant) => variant.color)?.color?.trim();
    const defaultColor = activeProduct?.defaultProductColor;
    if (!activeOptions.productColors && defaultColor && variants.some((variant) => variant.color?.trim() === defaultColor)) {
      selectedColor.value = defaultColor;
    } else if (firstColor && !variants.some((variant) => variant.color?.trim() === selectedColor.value)) {
      selectedColor.value = firstColor;
    } else if (!firstColor && !product.value.colors.some((color) => color.value === selectedColor.value)) {
      selectedColor.value = product.value.color;
    }
    selectedVariantId.value = variants.find((variant) => !firstColor || variant.color?.trim() === selectedColor.value)?.id ?? "";
  } catch (reason) {
    publishedCatalogError.value = getErrorMessage(reason);
  } finally {
    publishedCatalogLoading.value = false;
  }
}

function refreshCatalogWhenFocused() {
  if (document.visibilityState === "visible") void loadPublishedDesignerProducts();
}

function selectFreeProduct(productId: string) {
  const next = publishedDesignerProducts.value.find((item) => item.productId === productId);
  if (!next) return;
  freeProductId.value = productId;
  initializedProductId.value = next.productId;
  applyCustomerDesignerOptions(next.customerDesignerOptions);
  const options = { ...defaultCustomerDesignerOptions, ...next.customerDesignerOptions };
  const template = getCustomerProductTemplate(next.productType);
  const firstColor = next.variants.find((variant) => variant.color)?.color?.trim();
  const defaultColor = next.defaultProductColor;
  selectedColor.value = !options.productColors && defaultColor && next.variants.some((variant) => variant.color?.trim() === defaultColor)
    ? defaultColor
    : firstColor ?? template?.color ?? defaultCustomerProduct.color;
  selectedVariantId.value = next.variants.find((variant) => !firstColor || variant.color?.trim() === selectedColor.value)?.id ?? "";
  const allowedTextColors = normalizePrintTextColors(next.textColorOptions);
  if (!allowedTextColors.includes(textColor.value.toLowerCase())) textColor.value = allowedTextColors[0] ?? "#252632";
  void nextTick().then(() => updatePosition(positionX.value, positionY.value));
}

watch(selectedColor, () => {
  selectedVariantId.value = variantsForColor.value[0]?.id ?? "";
});

watch(routeProductId, () => {
  initializedProductId.value = "";
  if (!routeProductId.value) freeProductId.value = "";
  selectedColor.value = product.value.color;
  textColor.value = "#252632";
  selectedVariantId.value = "";
  void loadPublishedDesignerProducts();
});

watch(() => publishedProduct.value?.productId, async (productId, previousProductId) => {
  if (!productId || productId === previousProductId) return;
  await nextTick();
  updatePosition(positionX.value, positionY.value);
});

function setSelectedSide(side: DesignSide) {
  if (!designerOptions.value.sides && side === "back") return;
  selectedSide.value = side;
  isDragging.value = false;
  isResizing.value = false;
}

function constrainPosition(x: number, y: number) {
  const area = printArea.value;
  const composition = designComposition.value;
  if (!area || !composition) return { x, y };

  const areaRect = area.getBoundingClientRect();
  const designRect = composition.getBoundingClientRect();
  const halfWidth = Math.min(50, designRect.width / areaRect.width * 50);
  const halfHeight = Math.min(50, designRect.height / areaRect.height * 50);
  return {
    x: Math.min(100 - halfWidth, Math.max(halfWidth, x)),
    y: Math.min(100 - halfHeight, Math.max(halfHeight, y)),
  };
}

function updatePosition(x: number, y: number) {
  const constrained = constrainPosition(x, y);
  positionX.value = constrained.x;
  positionY.value = constrained.y;
}

function startDesignDrag(event: PointerEvent) {
  if (!designerOptions.value.transform || event.button !== 0 || (!artworkUrl.value && !text.value)) return;
  const area = printArea.value;
  const composition = designComposition.value;
  if (!area || !composition) return;

  event.preventDefault();
  const areaRect = area.getBoundingClientRect();
  dragOffsetX = positionX.value / 100 * areaRect.width - (event.clientX - areaRect.left);
  dragOffsetY = positionY.value / 100 * areaRect.height - (event.clientY - areaRect.top);
  isDragging.value = true;
  composition.setPointerCapture(event.pointerId);
}

function moveDesign(event: PointerEvent) {
  if (!isDragging.value || !printArea.value) return;
  const areaRect = printArea.value.getBoundingClientRect();
  const x = (event.clientX - areaRect.left + dragOffsetX) / areaRect.width * 100;
  const y = (event.clientY - areaRect.top + dragOffsetY) / areaRect.height * 100;
  updatePosition(x, y);
}

function stopDesignDrag(event: PointerEvent) {
  isDragging.value = false;
  const composition = designComposition.value;
  if (composition?.hasPointerCapture(event.pointerId)) composition.releasePointerCapture(event.pointerId);
}

function startArtworkResize(event: PointerEvent) {
  if (!designerOptions.value.transform || event.button !== 0 || !printArea.value || !artworkUrl.value) return;
  event.preventDefault();
  event.stopPropagation();
  resizeStartX = event.clientX;
  resizeStartScale = scale.value;
  isResizing.value = true;
  (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
}

function resizeArtwork(event: PointerEvent) {
  if (!isResizing.value || !printArea.value) return;
  const areaWidth = printArea.value.getBoundingClientRect().width;
  if (areaWidth <= 0) return;
  scale.value = Math.max(10, Math.min(100, resizeStartScale + (event.clientX - resizeStartX) / areaWidth * 100));
}

function stopArtworkResize(event: PointerEvent) {
  isResizing.value = false;
  const handle = event.currentTarget as HTMLButtonElement;
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
}

function adjustDesignWithKeyboard(event: KeyboardEvent) {
  if (!designerOptions.value.transform) return;
  const movement = event.shiftKey ? 5 : 2;
  if (event.key === "ArrowLeft") updatePosition(positionX.value - movement, positionY.value);
  else if (event.key === "ArrowRight") updatePosition(positionX.value + movement, positionY.value);
  else if (event.key === "ArrowUp") updatePosition(positionX.value, positionY.value - movement);
  else if (event.key === "ArrowDown") updatePosition(positionX.value, positionY.value + movement);
  else if (event.key === "+" || event.key === "=") scale.value = Math.min(100, scale.value + 5);
  else if (event.key === "-") scale.value = Math.max(10, scale.value - 5);
  else return;
  event.preventDefault();
}

function updateHorizontalPosition(event: Event) {
  updatePosition(Number((event.target as HTMLInputElement).value), positionY.value);
}

function updateVerticalPosition(event: Event) {
  updatePosition(positionX.value, Number((event.target as HTMLInputElement).value));
}

function processArtworkFile(file: File | undefined) {
  if (!designerOptions.value.artwork || !file) return;
  error.value = "";
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    error.value = "Elige un archivo PNG, JPG o WebP.";
    if (fileInput.value) fileInput.value.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = "La imagen debe pesar menos de 5 MB.";
    if (fileInput.value) fileInput.value.value = "";
    return;
  }
  if (artworkUrl.value) URL.revokeObjectURL(artworkUrl.value);
  currentSideDesign.value.artworkUrl = URL.createObjectURL(file);
  currentSideDesign.value.file = file;
  if (fileInput.value) fileInput.value.value = "";
  artworkCaptured.value = true;
  if (artworkCapturedTimeout) clearTimeout(artworkCapturedTimeout);
  artworkCapturedTimeout = setTimeout(() => { artworkCaptured.value = false; }, 1800);
}

function isFileDrag(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function handleArtworkDragEnter(event: DragEvent) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  artworkDropCount.value += 1;
  isArtworkFileOver.value = true;
}

function handleArtworkDragOver(event: DragEvent) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
}

function handleArtworkDragLeave(event: DragEvent) {
  if (!isFileDrag(event)) return;
  event.preventDefault();
  artworkDropCount.value = Math.max(0, artworkDropCount.value - 1);
  isArtworkFileOver.value = artworkDropCount.value > 0;
}

function handleArtworkDrop(event: DragEvent) {
  event.preventDefault();
  artworkDropCount.value = 0;
  isArtworkFileOver.value = false;
  processArtworkFile(event.dataTransfer?.files[0]);
}

watch([scale, text, artworkUrl, rotation], async () => {
  await nextTick();
  updatePosition(positionX.value, positionY.value);
}, { flush: "post" });

function uploadArtwork(event: Event) {
  processArtworkFile((event.target as HTMLInputElement).files?.[0]);
}

async function addToBag() {
  if (!publishedProduct.value) {
    error.value = "No hay una publicación activa con variantes y precio en MXN para este producto. Vuelve a consultar la disponibilidad.";
    return;
  }
  const variant = selectedVariantRecord.value;
  if (!variant) {
    error.value = "Selecciona una variante con precio válido para comprar.";
    return;
  }
  const options = designerOptions.value;
  const frontFile = options.artwork ? sideDesigns.value.front.file : null;
  const backFile = options.artwork && options.sides ? sideDesigns.value.back.file : null;
  const textValue = options.text ? text.value : "";
  if (!frontFile && !backFile && !textValue.trim()) {
    error.value = "Agrega una imagen o escribe un texto para continuar.";
    return;
  }
  if (addingToBag.value) return;
  addingToBag.value = true;
  error.value = "";
  try {
    const stored = localStorage.getItem("printly-customer-cart");
    const cart: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(cart)) throw new Error("No se pudo actualizar la bolsa.");
    const designConfig: DesignerCartDesign = {
      text: textValue,
      textColor: textColor.value,
      sides: {
        front: {
          artwork: Boolean(frontFile),
          positionX: sideDesigns.value.front.positionX,
          positionY: sideDesigns.value.front.positionY,
          scale: sideDesigns.value.front.scale,
          rotation: sideDesigns.value.front.rotation,
        },
        back: {
          artwork: Boolean(backFile),
          positionX: sideDesigns.value.back.positionX,
          positionY: sideDesigns.value.back.positionY,
          scale: sideDesigns.value.back.scale,
          rotation: sideDesigns.value.back.rotation,
        },
      },
    };
    const artworkFingerprints = await Promise.all((["front", "back"] as const).map(async (side) => {
      const file = side === "front" ? frontFile : backFile;
      return file ? fingerprintArtwork(file) : "";
    }));
    const designFingerprint = await fingerprintArtwork(new Blob([JSON.stringify({
      color: selectedColor.value,
      text: textValue,
      textColor: textColor.value,
      sides: designConfig.sides,
      artwork: artworkFingerprints,
    })], { type: "application/json" }));
    const cartItem: StorefrontCartItem = {
      id: `${publishedProduct.value.productId}:${variant.id}`,
      name: publishedProduct.value.name,
      variant: `${publishedColors.value.find((color) => color.value === selectedColor.value)?.name ?? selectedColor.value} · ${variant.size ?? variant.name}`,
      price: variant.salePrice,
      quantity: 1,
      productId: publishedProduct.value.productId,
      variantId: variant.id,
      artworkFingerprint: designFingerprint,
      designConfig,
      options: options.productColors && publishedColorValues.value.length
        ? { Color: publishedColors.value.find((color) => color.value === selectedColor.value)?.name ?? selectedColor.value }
        : {},
    };
    const result = addOrIncrementCartItem(cart as StorefrontCartItem[], cartItem);
    const savedArtworkIds: string[] = [];
    if (!result.merged) {
      try {
        const localArtworkIds: Partial<Record<DesignSide, string>> = {};
        for (const side of ["front", "back"] as const) {
          const file = side === "front" ? frontFile : backFile;
          if (!file) continue;
          const savedId = await saveCustomerArtwork(file);
          localArtworkIds[side] = savedId;
          savedArtworkIds.push(savedId);
        }
        const addedItem = result.cart.at(-1);
        if (!addedItem) throw new Error("No se pudo agregar el producto a la bolsa.");
        if (Object.keys(localArtworkIds).length) addedItem.localArtworkIds = localArtworkIds;
      } catch (reason) {
        await Promise.all(savedArtworkIds.map((id) => deleteCustomerArtwork(id)));
        result.cart.pop();
        throw reason;
      }
    }
    try {
      localStorage.setItem("printly-customer-cart", JSON.stringify(result.cart));
    } catch (reason) {
      if (!result.merged) {
        const addedItem = result.cart.at(-1);
        result.cart.pop();
        await Promise.all(Object.values(addedItem?.localArtworkIds ?? {}).map((id) => deleteCustomerArtwork(id)));
      }
      throw reason;
    }
    window.dispatchEvent(new Event("printly-cart-updated"));
    window.dispatchEvent(new Event("printly-cart-open"));
    added.value = true;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "No se pudo agregar el diseño a la bolsa.";
  } finally {
    addingToBag.value = false;
  }
}

function removeArtwork() {
  clearArtwork(selectedSide.value);
  if (fileInput.value) fileInput.value.value = "";
}

function handleArtworkLoadError() {
  error.value = "No se pudo leer la imagen. Verifica que el archivo no esté dañado.";
  removeArtwork();
}

onBeforeUnmount(() => {
  window.removeEventListener("focus", refreshCatalogWhenFocused);
  if (artworkCapturedTimeout) clearTimeout(artworkCapturedTimeout);
  for (const design of Object.values(sideDesigns.value)) {
    if (design.artworkUrl) URL.revokeObjectURL(design.artworkUrl);
  }
});

onMounted(() => {
  window.addEventListener("focus", refreshCatalogWhenFocused);
  void loadPublishedDesignerProducts();
});
</script>

<template>
  <main class="customer-designer-page">
    <div class="customer-designer-heading">
      <RouterLink to="/store#productos" class="customer-back-link"><span>←</span> Volver a la tienda</RouterLink>
      <div class="customer-designer-title"><div><span class="store-kicker">{{ product.category }} · DISEÑO PERSONALIZADO</span><h1>Diseña algo <em>tuyo.</em></h1><p>Personaliza los detalles y mira cómo toma forma.</p></div><span class="designer-save-status"><i></i> Vista previa en vivo</span></div>
      <ol class="customer-steps"><li class="step-done"><span>✓</span> Elige tu pieza</li><li class="step-current"><span>02</span> Personalízala</li><li><span>03</span> Revísala</li></ol>
    </div>
    <div class="customer-designer-workspace">
      <section class="customer-preview-card">
        <div class="customer-preview-top"><div><span class="store-kicker">VISTA PREVIA</span><h2>{{ publishedProduct?.name ?? product.name }}</h2></div><span class="preview-tag">MAQUETA DIGITAL</span></div>
        <div v-if="designerOptions.sides" class="customer-side-switch" role="group" aria-label="Seleccionar lado del producto">
          <button type="button" :class="{ selected: selectedSide === 'front' }" :aria-pressed="selectedSide === 'front'" @click="setSelectedSide('front')"><span>◉</span> Frente</button>
          <button type="button" :class="{ selected: selectedSide === 'back' }" :aria-pressed="selectedSide === 'back'" @click="setSelectedSide('back')"><span>◉</span> Parte trasera <i v-if="sideDesigns.back.artworkUrl" aria-label="Imagen agregada">✓</i></button>
        </div>
        <div class="customer-preview-stage" :class="{ 'is-viewing-back': selectedSide === 'back' }">
          <div class="customer-product-mockup" :class="`mockup-${product.kind}`">
            <Transition name="mockup-flip" mode="out-in">
            <div :key="selectedSide" class="customer-mockup-face" :class="`mockup-side-${selectedSide}`" :style="{ '--product-color': selectedPreviewColor }">
            <svg v-if="product.kind === 'tee' || product.kind === 'hoodie'" class="mockup-shape" viewBox="0 0 360 390" role="img" :aria-label="`${publishedProduct?.name ?? product.name}, vista ${sideLabel}`">
              <path v-if="selectedSide === 'front'" d="M115 35 65 54 18 115l49 39 28-29v211h170V125l28 29 49-39-47-61-50-19c-12 26-35 42-65 42s-53-16-65-42Z" />
              <path v-else d="M115 35 65 54 18 115l49 39 28-29v211h170V125l28 29 49-39-47-61-50-19c-10 13-27 21-65 21s-55-8-65-21Z" />
              <path class="mockup-neck" d="M115 35c12 26 35 42 65 42s53-16 65-42" />
            </svg>
            <svg v-else-if="product.kind === 'mug'" class="mockup-shape" viewBox="0 0 360 300" role="img" aria-label="Taza personalizable">
              <path d="M66 54h200v198c0 18-14 32-32 32H98c-18 0-32-14-32-32V54Z" />
              <path class="mockup-handle" d="M266 91h28c34 0 38 84 0 84h-28" />
              <path class="mockup-rim" d="M66 62h200" />
            </svg>
            <svg v-else-if="product.kind === 'tote'" class="mockup-shape" viewBox="0 0 360 380" role="img" aria-label="Bolsa personalizable">
              <path d="M65 120h230l-18 225H83L65 120Z" />
              <path class="mockup-handle" d="M118 131V92c0-59 124-59 124 0v39" />
            </svg>
            <svg v-else-if="product.kind === 'poster'" class="mockup-shape" viewBox="0 0 300 380" role="img" aria-label="Póster personalizable">
              <rect x="34" y="24" width="232" height="332" rx="3" />
              <path class="poster-inner" d="M52 42h196v296H52z" />
            </svg>
            <svg v-else-if="product.kind === 'pillow'" class="mockup-shape" viewBox="0 0 360 360" role="img" aria-label="Funda de cojín personalizable">
              <rect x="44" y="44" width="272" height="272" rx="26" />
              <rect x="59" y="59" width="242" height="242" rx="18" fill="none" stroke="#00000020" stroke-width="3" />
            </svg>
            <svg v-else-if="product.kind === 'puzzle'" class="mockup-shape" viewBox="0 0 360 360" role="img" aria-label="Rompecabezas personalizable">
              <path d="M76 57h70c-10 33 8 51 35 51s45-18 35-51h68v70c-33-10-51 8-51 35s18 45 51 35v106H76V197c33 10 51-8 51-35s-18-45-51-35V57Z" />
              <path d="M90 72h56M90 289h180M90 72v48m180-48v48" fill="none" stroke="#00000020" stroke-width="3" />
            </svg>
            <svg v-else-if="product.kind === 'keychain'" class="mockup-shape" viewBox="0 0 360 360" role="img" aria-label="Llavero personalizable">
              <circle cx="180" cy="72" r="42" fill="none" stroke="#9b9ba0" stroke-width="16" />
              <path d="M142 112h76l20 205H122l20-205Z" />
              <path d="M153 128h54l14 171h-82l14-171Z" fill="none" stroke="#00000020" stroke-width="3" />
            </svg>
            <svg v-else-if="product.kind === 'plaque'" class="mockup-shape" viewBox="0 0 360 380" role="img" aria-label="Placa fotográfica personalizable">
              <rect x="48" y="34" width="264" height="312" rx="7" />
              <rect x="64" y="50" width="232" height="280" rx="3" fill="none" stroke="#00000020" stroke-width="3" />
            </svg>
            <svg v-else-if="product.kind === 'apron'" class="mockup-shape" viewBox="0 0 360 390" role="img" aria-label="Mandil personalizable">
              <path d="M132 97c0-64 96-64 96 0l38 22 38 228H56l38-228 38-22Z" />
              <path d="M132 97q48 32 96 0M96 155h168" fill="none" stroke="#00000020" stroke-width="5" />
            </svg>
            <svg v-else-if="product.kind === 'cap'" class="mockup-shape" viewBox="0 0 360 300" role="img" aria-label="Gorra personalizable">
              <path d="M49 185c10-86 63-137 133-137s116 42 129 111l-102 33H49Z" />
              <path d="M49 185c54 31 130 25 245-26 20 20 22 47 5 61-62 39-170 42-250 7" fill="none" stroke="#00000020" stroke-width="5" />
            </svg>
            <svg v-else-if="product.kind === 'mousepad'" class="mockup-shape" viewBox="0 0 360 300" role="img" aria-label="Mouse pad personalizable">
              <rect x="27" y="44" width="306" height="212" rx="22" />
              <rect x="42" y="59" width="276" height="182" rx="12" fill="none" stroke="#00000020" stroke-width="3" />
            </svg>
            <svg v-else class="mockup-shape" viewBox="0 0 300 380" role="img" aria-label="Termo personalizable">
              <path d="M103 54h94l22 36-9 249H90L81 90l22-36Z" />
              <path class="mockup-rim" d="M108 52h84v20h-84zM105 99h90" />
            </svg>
            <div ref="printArea" class="customer-print-area">
              <div
                ref="designComposition"
                class="customer-design-composition"
                :class="{ 'is-draggable': designerOptions.transform && (artworkUrl || text), 'is-dragging': isDragging, 'is-resizing': isResizing }"
                :style="{ left: `${positionX}%`, top: `${positionY}%`, width: artworkUrl ? `${scale}%` : undefined, height: artworkUrl ? `${scale}%` : undefined, transform: `translate(-50%, -50%) rotate(${rotation}deg)${artworkUrl ? '' : ` scale(${scale / 100})`}` }"
                :role="designerOptions.transform && (artworkUrl || text) ? 'group' : undefined"
                :aria-label="designerOptions.transform && (artworkUrl || text) ? 'Diseño; arrastra para mover, usa la esquina inferior para cambiar el tamaño de la imagen, las flechas para ajustar la posición y más o menos para cambiar el tamaño' : undefined"
                :tabindex="designerOptions.transform && (artworkUrl || text) ? 0 : undefined"
                @pointerdown="startDesignDrag"
                @pointermove="moveDesign"
                @pointerup="stopDesignDrag"
                @pointercancel="stopDesignDrag"
                @lostpointercapture="isDragging = false"
                @keydown="adjustDesignWithKeyboard"
              >
                <img v-if="artworkUrl" class="customer-design-image" :src="artworkUrl" :alt="`Diseño para la ${sideLabel}`" @error="handleArtworkLoadError" />
                <span v-if="text" class="customer-design-text" :style="{ color: textColor }">{{ text }}</span>
                <span v-if="!artworkUrl && !text" class="customer-design-text customer-design-placeholder">Tu diseño en la {{ sideLabel }}</span>
                <button
                  v-if="artworkUrl && designerOptions.transform"
                  class="customer-design-resize-handle"
                  type="button"
                  aria-label="Arrastra para cambiar el tamaño de la imagen"
                  @pointerdown="startArtworkResize"
                  @pointermove="resizeArtwork"
                  @pointerup="stopArtworkResize"
                  @pointercancel="stopArtworkResize"
                  @lostpointercapture="isResizing = false"
                ></button>
              </div>
            </div>
            </div>
            </Transition>
          </div>
          <span class="preview-side-label">{{ selectedSide === "front" ? "VISTA FRONTAL" : "VISTA TRASERA" }} <i></i></span>
        </div>
        <div class="customer-preview-disclaimer"><span>ⓘ</span><p>La vista previa es una referencia digital. El resultado final puede variar según el material y el proceso de impresión.</p></div>
      </section>
      <section class="customer-controls-card">
        <div class="customer-control-section">
          <div class="customer-control-heading"><span class="customer-control-number">01</span><div><h2>Elige tus opciones</h2><p>Escoge el acabado y la variante de tu producto.</p></div></div>
          <label v-if="isFreeMode" class="customer-input-label" for="free-product">Producto disponible</label>
          <select v-if="isFreeMode" id="free-product" class="customer-product-select" :value="publishedProduct?.productId ?? ''" :disabled="publishedCatalogLoading || !publishedDesignerProducts.length" @change="selectFreeProduct(($event.target as HTMLSelectElement).value)">
            <option v-if="!publishedDesignerProducts.length" value="">No hay productos disponibles</option>
            <option v-for="item in publishedDesignerProducts" :key="item.productId" :value="item.productId">{{ item.name }}</option>
          </select>
          <span v-if="publishedColors.length" class="customer-control-label">COLOR DEL PRODUCTO · {{ publishedColors.find((color) => color.value === selectedColor)?.name }}</span>
          <div v-if="designerOptions.productColors && publishedColors.length > 1" class="customer-color-options">
            <button v-for="color in publishedColors" :key="color.value" type="button" class="customer-color-swatch" :class="{ selected: selectedColor === color.value }" :style="{ '--swatch': resolvePreviewColor(color.value) }" :aria-label="color.name" :aria-pressed="selectedColor === color.value" @click="selectedColor = color.value"></button>
          </div>
          <span class="customer-control-label customer-size-label">{{ product.variantLabel }}</span>
          <div v-if="variantsForColor.length" class="customer-size-options"><button v-for="variant in variantsForColor" :key="variant.id" type="button" :class="{ selected: selectedVariantRecord?.id === variant.id }" :aria-pressed="selectedVariantRecord?.id === variant.id" @click="selectedVariantId = variant.id">{{ variant.size ?? variant.name }}</button></div>
          <p v-else-if="publishedCatalogLoading" class="customer-catalog-status" role="status">Consultando disponibilidad y precios…</p>
          <div v-else-if="publishedCatalogError" class="customer-catalog-status is-error" role="alert">
            <p>{{ publishedCatalogError }}</p>
            <button type="button" class="customer-catalog-refresh" @click="loadPublishedDesignerProducts">Volver a consultar</button>
          </div>
          <div v-else class="customer-catalog-status">
            <p>Este producto no tiene una publicación activa con variantes y precio en MXN. Si ya fue publicado, vuelve a consultar la disponibilidad.</p>
            <button type="button" class="customer-catalog-refresh" @click="loadPublishedDesignerProducts">Actualizar disponibilidad</button>
          </div>
        </div>
        <div class="customer-control-section">
          <div class="customer-control-heading"><span class="customer-control-number">02</span><div><h2>Agrega tu diseño</h2><p>Escribe algo o carga una imagen.</p></div></div>
          <template v-if="designerOptions.text">
            <label class="customer-input-label" for="design-text">Tu texto</label>
            <textarea id="design-text" v-model="text" maxlength="60" rows="2" placeholder="Escribe algo que te represente..."></textarea>
            <div v-if="designerOptions.printTextColors" class="customer-text-options">
              <div class="customer-print-color-control">
                <span class="customer-control-label">Color de impresión</span>
                <span class="customer-print-color-name">{{ publishedTextColors.find((color) => color.value === textColor)?.name }}</span>
                <div v-if="publishedTextColors.length" class="customer-print-color-options" role="group" aria-label="Colores de impresión habilitados">
                  <button v-for="color in publishedTextColors" :key="color.value" type="button" class="customer-print-color-swatch" :class="{ selected: textColor === color.value }" :style="{ '--swatch': color.value }" :aria-label="`Usar color ${color.name}`" :aria-pressed="textColor === color.value" :title="color.name" @click="textColor = color.value"></button>
                </div>
              </div>
              <span class="customer-text-count">{{ text.length }}/60</span>
            </div>
            <span v-else class="customer-text-count">{{ text.length }}/60</span>
          </template>
          <template v-if="designerOptions.artwork">
            <input ref="fileInput" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" @change="uploadArtwork">
            <div
              class="customer-upload-zone"
              :class="{ 'is-file-over': isArtworkFileOver, 'is-captured': artworkCaptured }"
              @dragenter="handleArtworkDragEnter"
              @dragover="handleArtworkDragOver"
              @dragleave="handleArtworkDragLeave"
              @drop="handleArtworkDrop"
            >
              <button class="customer-upload-button" type="button" @click="fileInput?.click()"><span>↑</span><div><strong>{{ artworkUrl ? `Cambiar imagen de ${sideLabel}` : `Subir imagen para ${sideLabel}` }}</strong><small>Arrastra y suelta aquí o haz clic · PNG, JPG o WebP · Máx. 5 MB</small></div><b>+</b></button>
              <div v-if="isArtworkFileOver" class="customer-upload-drop-overlay" aria-live="polite">
                <span class="customer-upload-drop-icon">↓</span>
                <strong>Suelta tu imagen aquí</strong>
                <small>Se agregará a la {{ sideLabel }}</small>
              </div>
              <div v-if="artworkCaptured" class="customer-upload-captured" role="status"><span>✓</span> Imagen agregada a la {{ sideLabel }}</div>
            </div>
            <button v-if="artworkUrl" class="customer-remove-artwork" type="button" @click="removeArtwork">Quitar imagen</button>
          </template>
        </div>
        <div v-if="designerOptions.transform" class="customer-control-section customer-adjust-section">
          <div class="customer-control-heading"><span class="customer-control-number">03</span><div><h2>Ajusta tu composición</h2><p>Arrastra el diseño para moverlo y la esquina inferior para cambiar el tamaño de la imagen. También puedes usar los controles; el diseño se mantiene dentro del área de impresión.</p></div></div>
          <label class="customer-range-control">Tamaño <span>{{ Math.round(scale) }}%</span><input v-model.number="scale" type="range" min="10" max="100" step="1" aria-label="Tamaño del diseño"></label>
          <label class="customer-range-control">Posición horizontal <span>{{ Math.round(positionX) }}%</span><input :value="positionX" type="range" min="0" max="100" step="1" aria-label="Posición horizontal del diseño" @input="updateHorizontalPosition"></label>
          <label class="customer-range-control">Posición vertical <span>{{ Math.round(positionY) }}%</span><input :value="positionY" type="range" min="0" max="100" step="1" aria-label="Posición vertical del diseño" @input="updateVerticalPosition"></label>
          <label class="customer-range-control">Rotación <span>{{ Math.round(rotation) }}°</span><input v-model.number="rotation" type="range" min="-180" max="180" step="1" aria-label="Rotación del diseño"></label>
          <button class="customer-design-reset" type="button" @click="positionX = 50; positionY = 48; rotation = 0">Centrar diseño</button>
        </div>
        <div v-if="error" class="store-inline-error">{{ error }}</div>
        <div v-if="added" class="customer-added-notice">Diseño agregado a la bolsa. Puedes continuar al pago desde la bolsa.</div>
        <div class="customer-designer-bottom"><div><strong>{{ money }}</strong><span>{{ publishedProduct ? "MXN · precio publicado" : "Producto no disponible para compra" }}</span></div><button class="store-primary-button" type="button" :disabled="!canAddToBag" @click="addToBag">{{ addingToBag ? "Agregando…" : "Agregar a la bolsa" }} <span>→</span></button></div>
      </section>
    </div>
  </main>
</template>
