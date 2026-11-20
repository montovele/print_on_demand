<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import api, { getErrorMessage } from "../services/api";
import type { CustomerDesignerOptions, Product } from "../types";
import { defaultPrintTextColors, printTextColors } from "../data/printTextColors";
import { productVariantColors as colors } from "../data/productColors";

interface PrintArea { x: number; y: number; width: number; height: number }
interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  material: string;
  printMethods: string[];
  sizes: string[];
  printArea: PrintArea;
  shape: string;
}
interface UploadedArtwork { id: string; url: string }
interface DesignerConfig {
  color: string;
  text: string;
  textColor: string;
  textColorOptions: string[];
  customerDesignerOptions: CustomerDesignerOptions;
  scale: number;
  x: number;
  y: number;
  rotation: number;
  side: "front" | "back";
}
interface VariantEdit {
  name: string;
  sku: string;
  providerCost: number;
  salePrice: number;
}

const defaultCustomerDesignerOptions: CustomerDesignerOptions = {
  productColors: true,
  printTextColors: true,
  text: true,
  artwork: true,
  sides: true,
  transform: true,
};
const customerDesignerSettings: Array<{ key: keyof CustomerDesignerOptions; label: string }> = [
  { key: "productColors", label: "Colores físicos del producto" },
  { key: "printTextColors", label: "Colores de impresión del texto" },
  { key: "text", label: "Agregar texto" },
  { key: "artwork", label: "Subir imágenes" },
  { key: "sides", label: "Diseñar frente y reverso" },
  { key: "transform", label: "Mover, escalar y rotar el diseño" },
];

const router = useRouter();
const route = useRoute();
const templates = ref<ProductTemplate[]>([]);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const editingProductLoaded = ref(false);
const error = ref("");
const warning = ref("");
const selectedTemplateId = ref("tshirt");
const selectedSizes = ref<string[]>([]);
const selectedColors = ref(["#f7f7f5"]);
const savedVariants = ref<Product["variants"]>([]);
const variantEdits = ref<Record<string, Partial<VariantEdit>>>({});
const artworkAsset = ref<UploadedArtwork | null>(null);
const artworkFile = ref<File | null>(null);
const artworkPreviewUrl = ref("");
const originalArtworkAssetId = ref<string | null>(null);
const mockupSvg = ref<SVGSVGElement | null>(null);
const dragging = ref(false);
const form = ref({
  name: "Camiseta personalizada",
  description: "",
  baseCost: 120,
  salePrice: 299,
  currency: "MXN",
  productionMinutes: 30 as number | null,
  productionMethod: "DTG",
});
const design = ref<DesignerConfig>({
  color: "#f7f7f5",
  text: "",
  textColor: "#252632",
  textColorOptions: [...defaultPrintTextColors],
  scale: 72,
  x: 50,
  y: 48,
  rotation: 0,
  side: "front",
  customerDesignerOptions: { ...defaultCustomerDesignerOptions },
});
const template = computed(() => templates.value.find((item) => item.id === selectedTemplateId.value) ?? null);
const editingProductId = computed(() => typeof route.params.productId === "string" ? route.params.productId : null);
const isBackView = computed(() => design.value.side === "back");
const printRect = computed(() => {
  const area = template.value?.printArea ?? { x: 30, y: 25, width: 40, height: 45 };
  return { x: area.x * 5, y: area.y * 5, width: area.width * 5, height: area.height * 5 };
});
const designCenter = computed(() => ({
  x: printRect.value.x + printRect.value.width * design.value.x / 100,
  y: printRect.value.y + printRect.value.height * design.value.y / 100,
}));
const artworkWidth = computed(() => printRect.value.width * design.value.scale / 100);
const artworkHeight = computed(() => Math.min(printRect.value.height * design.value.scale / 100, artworkWidth.value));
const selectedColorName = computed(() => colors.find((color) => color.value === design.value.color)?.name ?? "Personalizado");
const availablePrintTextColors = computed(() => {
  const legacyColors = design.value.textColorOptions
    .filter((value) => !printTextColors.some((option) => option.value === value))
    .map((value) => ({ name: "Color guardado", value }));
  return [...printTextColors, ...legacyColors];
});
const enabledPrintTextColors = computed(() => availablePrintTextColors.value.filter((option) =>
  design.value.textColorOptions.includes(option.value),
));
const variantColorOptions = computed(() => {
  const knownNames = new Set(colors.map((color) => color.name));
  const extra = (savedVariants.value ?? [])
    .flatMap((variant) => variant.color && !knownNames.has(variant.color) ? [{ name: variant.color, value: variant.color }] : []);
  return [...colors, ...extra.filter((color, index, list) => list.findIndex((item) => item.value === color.value) === index)];
});
const availableSizes = computed(() => [...new Set([
  ...(template.value?.sizes ?? []),
  ...(savedVariants.value ?? []).flatMap((variant) => variant.size ? [variant.size] : !variant.color ? [variant.name] : []),
])]);
function variantKey(size: string, color: string) {
  return JSON.stringify([size, color]);
}
const productVariants = computed(() => selectedColors.value.flatMap((color) => selectedSizes.value.map((size, index) => {
  const label = variantColorOptions.value.find((option) => option.value === color)?.name ?? color;
  const existing = (savedVariants.value ?? []).find((variant) => (
    (variant.size === size || (!variant.size && (variant.name === size || selectedSizes.value.length === 1)))
    && (!variant.color || variant.color === label)
  ));
  const overrides = variantEdits.value[variantKey(size, label)];
  return {
    ...(existing ? { id: existing.id } : {}),
    name: overrides?.name ?? existing?.name ?? `${template.value?.name ?? "Producto"} · ${size} · ${label}`,
    size,
    color: label,
    sku: overrides?.sku ?? existing?.sku ?? `${selectedTemplateId.value.toUpperCase()}-${color.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${size.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${index + 1}`,
    providerCost: overrides?.providerCost ?? existing?.providerCost ?? form.value.baseCost,
    salePrice: overrides?.salePrice ?? existing?.salePrice ?? form.value.salePrice,
  };
})));
const hasTooManyVariants = computed(() => productVariants.value.length > 100);

function updateVariantField(size: string, color: string, field: keyof VariantEdit, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = field === "providerCost" || field === "salePrice" ? input.valueAsNumber : input.value;
  variantEdits.value = {
    ...variantEdits.value,
    [variantKey(size, color)]: {
      ...variantEdits.value[variantKey(size, color)],
      [field]: value,
    },
  };
}

function togglePrintTextColor(value: string) {
  const enabled = design.value.textColorOptions;
  if (enabled.includes(value)) {
    if (enabled.length === 1) return;
    const remaining = enabled.filter((color) => color !== value);
    design.value = {
      ...design.value,
      textColorOptions: remaining,
      textColor: design.value.textColor === value ? remaining[0] ?? "#252632" : design.value.textColor,
    };
    return;
  }
  design.value = { ...design.value, textColorOptions: [...enabled, value] };
}

async function loadTemplates() {
  loading.value = true;
  try {
    const { data } = await api.get("/designer/templates");
    templates.value = data.items as ProductTemplate[];
    const initial = templates.value.find((item) => item.id === selectedTemplateId.value) ?? templates.value[0];
    if (initial) {
      selectedTemplateId.value = initial.id;
      selectedSizes.value = [...initial.sizes];
      form.value.name = `${initial.name} personalizada`;
      form.value.productionMethod = initial.printMethods[0] ?? "";
    }
    if (editingProductId.value) await loadProductForEditing(editingProductId.value);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

async function loadProductForEditing(productId: string) {
  const { data: product } = await api.get<Product & { artworkAsset?: { id: string } | null }>(`/products/${productId}`);
  const productTemplate = templates.value.find((item) => item.id === product.productType)
    ?? (product.productType === "custom" ? templates.value.find((item) => item.id === "custom-item") : undefined);
  if (!productTemplate || product.fulfillmentMode !== "in_house") {
    error.value = "Este producto no tiene un diseño interno editable.";
    return;
  }
  selectedTemplateId.value = productTemplate.id;
  form.value = {
    name: product.name,
    description: product.description ?? "",
    baseCost: product.baseCost,
    salePrice: product.salePrice,
    currency: product.currency,
    productionMinutes: product.productionMinutes,
    productionMethod: product.productionMethod ?? productTemplate.printMethods[0] ?? "",
  };
  const savedTextColorOptions = product.designConfig?.textColorOptions;
  const textColorOptions = Array.isArray(savedTextColorOptions) && savedTextColorOptions.length
    ? [...new Set(savedTextColorOptions.map((color) => color.toLowerCase()))]
    : product.designConfig?.textColor
      ? [product.designConfig.textColor.toLowerCase()]
      : [...defaultPrintTextColors];
  const savedTextColor = product.designConfig?.textColor?.toLowerCase() ?? "#252632";
  design.value = {
    color: product.designConfig?.color ?? "#f7f7f5",
    text: product.designConfig?.text ?? "",
    textColor: textColorOptions.includes(savedTextColor) ? savedTextColor : textColorOptions[0] ?? "#252632",
    textColorOptions,
    scale: product.designConfig?.scale ?? 72,
    x: product.designConfig?.x ?? 50,
    y: product.designConfig?.y ?? 48,
    rotation: product.designConfig?.rotation ?? 0,
    side: product.designConfig?.side ?? "front",
    customerDesignerOptions: {
      ...defaultCustomerDesignerOptions,
      ...product.designConfig?.customerDesignerOptions,
    },
  };
  const variants = product.variants ?? [];
  savedVariants.value = variants;
  variantEdits.value = Object.fromEntries(variants.flatMap((variant) => variant.size && variant.color ? [[
    variantKey(variant.size, variant.color),
    {
      name: variant.name,
      sku: variant.sku ?? "",
      providerCost: variant.providerCost,
      salePrice: variant.salePrice,
    },
  ]] : []));
  const sizedVariants = variants.flatMap((variant) => variant.size ? [variant.size] : []);
  const unnamedVariants = variants.filter((variant) => !variant.size && !variant.color).map((variant) => variant.name);
  selectedSizes.value = variants.length
    ? [...new Set(sizedVariants.length ? sizedVariants : unnamedVariants.length ? unnamedVariants : [productTemplate.sizes[0] ?? "Única"])]
    : [...productTemplate.sizes];
  const knownColors = variants.flatMap((variant) => {
    const color = colors.find((option) => option.name === variant.color);
    return [color?.value ?? variant.color ?? ""].filter(Boolean);
  });
  if (knownColors.length) selectedColors.value = [...new Set(knownColors)];
  originalArtworkAssetId.value = product.artworkAsset?.id ?? null;
  if (product.artworkUrl && originalArtworkAssetId.value) {
    const { data: blob } = await api.get<Blob>(product.artworkUrl, { responseType: "blob" });
    artworkAsset.value = { id: originalArtworkAssetId.value, url: product.artworkUrl };
    artworkFile.value = new File([blob], "diseno-guardado", { type: blob.type });
    artworkPreviewUrl.value = URL.createObjectURL(blob);
  }
  editingProductLoaded.value = true;
}

function chooseTemplate(id: string) {
  const next = templates.value.find((item) => item.id === id);
  if (!next) return;
  selectedTemplateId.value = id;
  const variants = savedVariants.value ?? [];
  const sizedVariants = variants.flatMap((variant) => variant.size ? [variant.size] : []);
  const unnamedVariants = variants.filter((variant) => !variant.size && !variant.color).map((variant) => variant.name);
  selectedSizes.value = variants.length
    ? [...new Set(sizedVariants.length ? sizedVariants : unnamedVariants.length ? unnamedVariants : [next.sizes[0] ?? "Única"])]
    : [...next.sizes];
  if (!editingProductId.value) form.value.name = `${next.name} personalizada`;
  form.value.productionMethod = next.printMethods[0] ?? "";
  design.value = { ...design.value, x: 50, y: 48 };
}

function choosePreviewColor(color: string) {
  design.value.color = color;
  if (!selectedColors.value.includes(color)) selectedColors.value = [...selectedColors.value, color];
}

function toggleProductColor(color: string) {
  if (selectedColors.value.includes(color)) {
    if (selectedColors.value.length === 1) return;
    selectedColors.value = selectedColors.value.filter((value) => value !== color);
    if (design.value.color === color) {
      design.value.color = selectedColors.value.find((value) => colors.some((option) => option.value === value)) ?? "#f7f7f5";
    }
  } else {
    selectedColors.value = [...selectedColors.value, color];
    if (colors.some((option) => option.value === color)) design.value.color = color;
  }
}

async function uploadArtwork(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    error.value = "El diseño debe ser una imagen PNG, JPG o WebP.";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = "La imagen debe pesar hasta 5 MB.";
    return;
  }
  uploading.value = true;
  error.value = "";
  warning.value = "";
  try {
    const image = await createImageBitmap(file);
    if (image.width < 1000 || image.height < 1000) warning.value = "La imagen mide menos de 1000 px en uno de sus lados; puede perder nitidez al imprimir.";
    image.close();
    const previousAsset = artworkAsset.value;
    const { data } = await api.put<UploadedArtwork>("/designer/artwork", file, {
      headers: { "Content-Type": file.type },
    });
    if (artworkPreviewUrl.value) URL.revokeObjectURL(artworkPreviewUrl.value);
    artworkAsset.value = data;
    artworkFile.value = file;
    artworkPreviewUrl.value = URL.createObjectURL(file);
    if (previousAsset && (!editingProductId.value || previousAsset.id !== originalArtworkAssetId.value)) {
      try {
        await api.delete(`/designer/assets/${previousAsset.id}`);
      } catch (reason) {
        warning.value = `La imagen nueva se cargó, pero no se pudo retirar el archivo temporal anterior: ${getErrorMessage(reason)}`;
      }
    }
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    uploading.value = false;
  }
}

async function clearArtwork() {
  const assetId = artworkAsset.value?.id;
  if (artworkPreviewUrl.value) URL.revokeObjectURL(artworkPreviewUrl.value);
  artworkAsset.value = null;
  artworkFile.value = null;
  artworkPreviewUrl.value = "";
  if (assetId && (!editingProductId.value || assetId !== originalArtworkAssetId.value)) {
    try {
      await api.delete(`/designer/assets/${assetId}`);
    } catch (reason) {
      error.value = getErrorMessage(reason);
    }
  }
}

function updateDesignPosition(event: PointerEvent) {
  if (!dragging.value || !mockupSvg.value || !template.value) return;
  const bounds = mockupSvg.value.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * 500;
  const y = (event.clientY - bounds.top) / bounds.height * 520;
  const area = printRect.value;
  design.value.x = Math.round(Math.max(0, Math.min(100, (x - area.x) / area.width * 100)));
  design.value.y = Math.round(Math.max(0, Math.min(100, (y - area.y) / area.height * 100)));
}

function startDrag(event: PointerEvent) {
  dragging.value = true;
  (event.currentTarget as SVGGElement).setPointerCapture(event.pointerId);
  updateDesignPosition(event);
}

function stopDrag() {
  dragging.value = false;
}

async function downloadMockup() {
  if (!mockupSvg.value) return;
  try {
    const serializer = new XMLSerializer();
    let markup = serializer.serializeToString(mockupSvg.value);
    const sourceArtwork = artworkFile.value;
    if (artworkPreviewUrl.value && sourceArtwork) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo preparar la imagen para exportar."));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen para exportar."));
        reader.readAsDataURL(sourceArtwork);
      });
      markup = markup.replaceAll(artworkPreviewUrl.value, dataUrl);
    }
    const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1040;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        error.value = "El navegador no pudo preparar el mockup para descarga.";
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) {
          error.value = "No se pudo generar la imagen PNG.";
          return;
        }
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${form.value.name.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "mockup"}.png`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      error.value = "No se pudo generar el mockup. Intenta nuevamente.";
    };
    image.src = svgUrl;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

async function saveProduct() {
  if (!template.value || !selectedSizes.value.length || !selectedColors.value.length || !productVariants.value.length) {
    error.value = "Selecciona al menos una talla y un color para el producto.";
    return;
  }
  if (hasTooManyVariants.value) {
    error.value = "Un producto puede tener como máximo 100 variantes.";
    return;
  }
  if (productVariants.value.some((variant) => (
    !variant.name.trim()
    || !Number.isFinite(variant.providerCost)
    || variant.providerCost < 0
    || variant.providerCost > 999999999
    || !Number.isFinite(variant.salePrice)
    || variant.salePrice < 0
    || variant.salePrice > 999999999
  ))) {
    error.value = "Revisa el nombre, costo y precio de cada variante.";
    return;
  }
  const primaryVariant = productVariants.value[0];
  if (!primaryVariant) {
    error.value = "Configura al menos una variante con su costo y precio final.";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    const productData = {
      name: form.value.name,
      description: form.value.description || undefined,
      baseCost: primaryVariant.providerCost,
      salePrice: primaryVariant.salePrice,
      currency: form.value.currency,
      productType: template.value.id,
      productionMethod: form.value.productionMethod,
      productionMinutes: form.value.productionMinutes,
      designConfig: {
        ...design.value,
        defaultProductColor: variantColorOptions.value.find((option) => option.value === design.value.color)?.name ?? selectedColorName.value,
      },
      artworkAssetId: artworkAsset.value?.id ?? null,
    };
    if (editingProductId.value) {
      await api.patch(`/products/${editingProductId.value}`, { ...productData, variants: productVariants.value });
      let cleanupFailed = false;
      if (originalArtworkAssetId.value && originalArtworkAssetId.value !== artworkAsset.value?.id) {
        try {
          await api.delete(`/designer/assets/${originalArtworkAssetId.value}`);
        } catch (reason) {
          warning.value = `El producto se actualizó, pero no se pudo retirar el arte anterior: ${getErrorMessage(reason)}`;
          cleanupFailed = true;
        }
      }
      if (!cleanupFailed) await router.push("/products");
    } else {
      await api.post("/products", { ...productData, variants: productVariants.value });
      await router.push("/products");
    }
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

watch(() => design.value.text, (value) => {
  if (value.length > 120) design.value.text = value.slice(0, 120);
});

onMounted(loadTemplates);
onBeforeUnmount(() => {
  if (artworkPreviewUrl.value) URL.revokeObjectURL(artworkPreviewUrl.value);
});
</script>

<template>
  <PageHeader :title="editingProductId ? 'Editar diseño de producto' : 'Diseñador de productos'" :description="editingProductId ? 'Actualiza el diseño y los datos de tu producto.' : 'Crea productos imprimibles, prepara sus variantes y exporta un mockup sin depender de un proveedor externo.'">
    <button type="button" class="button button-secondary" :disabled="loading" @click="downloadMockup">↓ Descargar mockup PNG</button>
  </PageHeader>
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <div v-if="warning" class="alert alert-warning">{{ warning }}</div>
  <div v-if="loading" class="content-card loading-state">Cargando plantillas de productos...</div>
  <section v-else-if="template && (!editingProductId || editingProductLoaded)" class="designer-workspace">
    <div class="designer-preview-panel">
      <div class="designer-preview-heading">
        <div><span class="eyebrow">VISTA PREVIA</span><h2>{{ template.name }}</h2><p>{{ selectedColorName }} · {{ design.side === "front" ? "Frente" : "Reverso" }}</p></div>
        <div class="side-switch">
          <button type="button" :class="{ active: design.side === 'front' }" @click="design.side = 'front'">Frente</button>
          <button type="button" :class="{ active: design.side === 'back' }" @click="design.side = 'back'">Reverso</button>
        </div>
      </div>
      <div class="mockup-stage">
        <svg ref="mockupSvg" class="mockup-svg" viewBox="0 0 500 520" role="img" :aria-label="`Mockup de ${template.name}`" @pointermove="updateDesignPosition" @pointerup="stopDrag" @pointercancel="stopDrag">
          <defs>
            <linearGradient id="garment-shade" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".5" /><stop offset=".48" stop-color="#ffffff" stop-opacity=".04" /><stop offset="1" stop-color="#151626" stop-opacity=".2" /></linearGradient>
            <linearGradient id="mug-shade" x1="0" x2="1"><stop offset="0" stop-color="#151626" stop-opacity=".14" /><stop offset=".2" stop-color="#ffffff" stop-opacity=".5" /><stop offset=".75" stop-color="#ffffff" stop-opacity=".05" /><stop offset="1" stop-color="#151626" stop-opacity=".17" /></linearGradient>
            <filter id="mockup-shadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="13" flood-color="#303044" flood-opacity=".17" /></filter>
            <clipPath id="print-area-clip"><rect :x="printRect.x" :y="printRect.y" :width="printRect.width" :height="printRect.height" rx="4" /></clipPath>
          </defs>
          <rect width="500" height="520" rx="20" fill="#f3f2f7" />
          <ellipse cx="250" cy="456" rx="142" ry="17" fill="#202031" opacity=".08" />
          <g v-if="template.shape === 'tshirt'" filter="url(#mockup-shadow)">
            <path :fill="design.color" d="M167 83 215 61 238 80h24l23-19 48 22 70 52-35 55-42-29v242H167V141l-42 29-35-55z" />
            <path fill="url(#garment-shade)" d="M167 83 215 61 238 80h24l23-19 48 22 70 52-35 55-42-29v242H167V141l-42 29-35-55z" />
            <path v-if="!isBackView" d="M216 62q34 42 46 18 12 24 46-18M167 141l-30 36m196-36 30 36M168 396h164" fill="none" stroke="#262631" stroke-opacity=".14" stroke-width="2" />
            <g v-else fill="none" stroke="#262631" stroke-opacity=".14" stroke-width="2">
              <path d="M216 62q34 24 46 13 12 11 46-13M167 141l-30 36m196-36 30 36M168 396h164" />
              <path d="M217 65q33 29 45 14 12 15 45-14" stroke-opacity=".24" />
            </g>
            <g v-if="isBackView">
              <path d="M235 79h30v17h-30z" fill="#f3f2f7" fill-opacity=".72" stroke="#262631" stroke-opacity=".12" />
              <path d="M241 85h18m-18 5h13" stroke="#262631" stroke-opacity=".2" />
            </g>
          </g>
          <g v-else-if="template.shape === 'hoodie'" filter="url(#mockup-shadow)">
            <path :fill="design.color" d="m177 95 39-25q34 43 68 0l39 25 58 44-31 50-37-26v230H187V163l-37 26-31-50z" />
            <path fill="url(#garment-shade)" d="m177 95 39-25q34 43 68 0l39 25 58 44-31 50-37-26v230H187V163l-37 26-31-50z" />
            <g v-if="!isBackView">
              <path :fill="design.color" d="M216 72q-23 5-30 36 18 26 52 24l12-48zm68 0q23 5 30 36-18 26-52 24l-12-48z" stroke="#262631" stroke-opacity=".15" stroke-width="2" />
              <path d="M187 318h48v43h-48m126-43h-48v43h48m-66-225v98m-13-98v36m26-36v36" fill="none" stroke="#262631" stroke-opacity=".18" stroke-width="2" />
            </g>
            <g v-else fill="none" stroke="#262631" stroke-opacity=".2" stroke-width="2">
              <path :fill="design.color" d="M216 72q34-24 68 0l22 48q-56 38-112 0z" />
              <path d="M222 79q28-16 56 0l16 35q-44 27-88 0zM250 115v96M187 163l-20 27m146-27 20 27" />
            </g>
          </g>
          <g v-else-if="template.shape === 'mug'" filter="url(#mockup-shadow)">
            <path v-if="!isBackView" d="M344 187h44q57 0 57 70t-57 70h-44v-25h42q31 0 31-45t-31-45h-42z" fill="#e1e2e8" stroke="#c9cad2" stroke-width="5" />
            <path v-else d="M129 187H85q-57 0-57 70t57 70h44v-25H87q-31 0-31-45t31-45h42z" fill="#e1e2e8" stroke="#c9cad2" stroke-width="5" />
            <rect x="113" y="160" width="247" height="209" rx="24" :fill="design.color" />
            <rect x="113" y="160" width="247" height="209" rx="24" fill="url(#mug-shade)" />
            <ellipse cx="236" cy="160" rx="123" ry="16" fill="#ffffff" fill-opacity=".72" />
            <path d="M135 367q100 12 203 0" fill="none" stroke="#22232d" stroke-opacity=".1" stroke-width="4" />
          </g>
          <g v-else-if="template.shape === 'tumbler'" filter="url(#mockup-shadow)">
            <path d="m179 126 142 0-17 280q-3 27-29 27h-50q-26 0-29-27z" :fill="design.color" />
            <path d="m179 126 142 0-17 280q-3 27-29 27h-50q-26 0-29-27z" fill="url(#mug-shade)" />
            <path d="M174 117h152v18H174zM190 105h120v12H190z" fill="#a9abb0" />
            <path :d="isBackView ? 'M300 148v240' : 'M200 148v240'" stroke="#fff" stroke-opacity=".28" stroke-width="5" />
          </g>
          <g v-else-if="template.shape === 'tote'" filter="url(#mockup-shadow)">
            <path d="M177 169v-46q0-67 73-67t73 67v46h-23v-44q0-46-50-46t-50 46v44z" fill="none" :stroke="design.color" stroke-width="17" />
            <path d="M140 158h220l-23 285H163z" :fill="design.color" />
            <path d="M140 158h220l-23 285H163z" fill="url(#garment-shade)" />
            <path v-if="!isBackView" d="m177 168-12 250m157-250 12 250" stroke="#292a2d" stroke-opacity=".12" stroke-width="2" />
            <g v-else fill="none" stroke="#292a2d" stroke-opacity=".18" stroke-width="2">
              <path d="M164 184h172M167 410h166" />
              <path d="M229 191h42v8h-42z" fill="#f3f2f7" />
            </g>
          </g>
          <g v-else-if="template.shape === 'pillow'" filter="url(#mockup-shadow)">
            <path d="M133 120q117 18 234 0-18 140 0 280-117-18-234 0 18-140 0-280z" :fill="design.color" />
            <path d="M133 120q117 18 234 0-18 140 0 280-117-18-234 0 18-140 0-280z" fill="url(#garment-shade)" />
            <path v-if="!isBackView" d="M151 142q99 16 198 0-16 118 0 236-99-16-198 0 16-118 0-236z" fill="none" stroke="#292a2d" stroke-opacity=".15" stroke-width="3" stroke-dasharray="4 5" />
            <path v-else d="M155 250h190" fill="none" stroke="#292a2d" stroke-opacity=".2" stroke-width="5" stroke-dasharray="3 4" />
          </g>
          <g v-else-if="template.shape === 'puzzle'" filter="url(#mockup-shadow)">
            <path d="M126 102h88q-18 48 36 48t36-48h88v84q-48-18-48 36t48 36v118H126V258q48 18 48-36t-48-36z" :fill="design.color" />
            <path d="M140 116h72M140 342h220M140 116v54m220-54v54" fill="none" stroke="#292a2d" stroke-opacity=".15" stroke-width="3" />
          </g>
          <g v-else-if="template.shape === 'keychain'" filter="url(#mockup-shadow)">
            <circle cx="250" cy="127" r="44" fill="none" stroke="#a9abb0" stroke-width="18" />
            <path d="M204 170h92l24 274H180z" :fill="design.color" />
            <path d="M215 184h70l18 247h-106z" fill="url(#garment-shade)" />
          </g>
          <g v-else-if="template.shape === 'photo-plaque'" filter="url(#mockup-shadow)">
            <rect x="116" y="65" width="268" height="390" rx="8" :fill="design.color" />
            <rect x="131" y="80" width="238" height="360" rx="4" fill="url(#garment-shade)" />
            <rect x="116" y="65" width="268" height="390" rx="8" fill="none" stroke="#292a2d" stroke-opacity=".12" stroke-width="3" />
          </g>
          <g v-else-if="template.shape === 'apron'" filter="url(#mockup-shadow)">
            <path d="M202 98c0-59 96-59 96 0l38 23 43 309H121l43-309z" :fill="design.color" />
            <path d="M202 98q48 35 96 0M166 168h168" fill="none" stroke="#292a2d" stroke-opacity=".18" stroke-width="5" />
            <path d="M177 250h146m-146 14v54m146-54v54" fill="none" stroke="#292a2d" stroke-opacity=".12" stroke-width="3" />
          </g>
          <g v-else-if="template.shape === 'cap'" filter="url(#mockup-shadow)">
            <path d="M119 290c12-108 70-176 152-176 69 0 113 48 131 137l-123 39z" :fill="design.color" />
            <path d="M119 290c68 39 166 32 283-32 26 24 26 56 3 73-73 45-194 48-303 9" fill="url(#garment-shade)" />
            <path d="M119 290c68 39 166 32 283-32 26 24 26 56 3 73-73 45-194 48-303 9" fill="none" stroke="#292a2d" stroke-opacity=".18" stroke-width="3" />
          </g>
          <g v-else-if="template.shape === 'mousepad'" filter="url(#mockup-shadow)">
            <rect x="82" y="153" width="336" height="245" rx="24" :fill="design.color" />
            <rect x="97" y="168" width="306" height="215" rx="14" fill="url(#garment-shade)" />
            <rect x="82" y="153" width="336" height="245" rx="24" fill="none" stroke="#292a2d" stroke-opacity=".16" stroke-width="3" />
          </g>
          <g v-else-if="template.shape === 'poster'" filter="url(#mockup-shadow)">
            <template v-if="!isBackView">
              <rect x="115" y="58" width="270" height="395" rx="3" fill="#fff" />
              <rect x="127" y="70" width="246" height="371" fill="#ffffff" />
              <rect x="127" y="70" width="246" height="371" fill="url(#garment-shade)" opacity=".15" />
              <path d="M115 58h270v395H115z" fill="none" stroke="#dddde2" stroke-width="2" />
            </template>
            <g v-else>
              <rect x="115" y="58" width="270" height="395" rx="3" fill="#e8e2d5" />
              <rect x="127" y="70" width="246" height="371" fill="#d9d1c2" />
              <path d="M115 58h270v395H115z" fill="none" stroke="#c7bead" stroke-width="3" />
              <path d="M197 80q53-38 106 0" fill="none" stroke="#aaa18f" stroke-width="7" stroke-linecap="round" />
              <path d="M145 420h210" stroke="#b9b09f" stroke-width="2" />
            </g>
          </g>
          <g v-else-if="template.shape === 'label-sheet'" filter="url(#mockup-shadow)">
            <rect x="121" y="91" width="258" height="342" rx="12" fill="#e1dfeb" />
            <rect x="111" y="81" width="278" height="342" rx="12" fill="#fff" stroke="#e1e0e9" stroke-width="2" />
            <path d="M126 96h248v312H126z" fill="none" stroke="#d7d5df" stroke-width="1" stroke-dasharray="3 5" />
            <path d="M250 96v312M126 200h248M126 304h248" fill="none" stroke="#e3e1e9" stroke-width="1" stroke-dasharray="3 5" />
            <rect x="132" y="102" width="107" height="86" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
            <rect x="261" y="102" width="107" height="86" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
            <rect x="132" y="214" width="107" height="76" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
            <rect x="261" y="214" width="107" height="76" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
            <rect x="132" y="318" width="107" height="76" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
            <rect x="261" y="318" width="107" height="76" rx="8" :fill="design.color" fill-opacity=".72" stroke="#c7c4d2" stroke-opacity=".48" />
          </g>
          <g v-else-if="template.shape === 'label-roll'" filter="url(#mockup-shadow)">
            <path d="M165 145q0-24 85-24t85 24v244q0 26-85 26t-85-26z" fill="#d5d3dd" stroke="#c0beca" stroke-width="2" />
            <path d="M165 145q0 24 85 24t85-24" fill="none" stroke="#aaa8b5" stroke-width="2" />
            <path d="M183 181h134v184q0 17-67 17t-67-17z" fill="#fff" stroke="#d8d6df" stroke-width="2" />
            <path d="M183 181q67 21 134 0" fill="#f3f2f7" stroke="#d8d6df" stroke-width="2" />
            <ellipse cx="250" cy="145" rx="85" ry="24" fill="#efedf4" stroke="#c0beca" stroke-width="2" />
            <ellipse cx="250" cy="145" rx="34" ry="10" fill="#b9b7c2" />
            <ellipse cx="250" cy="145" rx="20" ry="6" fill="#f3f2f7" />
            <path d="M179 390q71 19 142 0" fill="none" stroke="#aaa8b5" stroke-opacity=".55" stroke-width="2" />
          </g>
          <g v-else filter="url(#mockup-shadow)">
            <rect x="166" y="60" width="168" height="386" rx="35" :fill="design.color" />
            <rect x="176" y="70" width="148" height="366" rx="29" fill="url(#garment-shade)" />
            <g v-if="isBackView">
              <rect x="179" y="78" width="54" height="58" rx="9" fill="#252632" fill-opacity=".18" stroke="#252632" stroke-opacity=".28" stroke-width="2" />
              <circle cx="192" cy="91" r="5" fill="#252632" fill-opacity=".5" />
              <circle cx="219" cy="91" r="5" fill="#252632" fill-opacity=".5" />
              <circle cx="192" cy="119" r="5" fill="#252632" fill-opacity=".5" />
            </g>
            <g v-else>
              <rect x="180" y="88" width="140" height="338" rx="23" fill="#31333d" fill-opacity=".75" />
              <rect x="188" y="98" width="124" height="318" rx="18" fill="#e8eaf0" />
              <circle cx="250" cy="407" r="4" fill="#8d8e98" />
            </g>
          </g>
          <rect :x="printRect.x" :y="printRect.y" :width="printRect.width" :height="printRect.height" rx="4" fill="none" stroke="#705de9" stroke-width="1.5" stroke-dasharray="6 5" opacity=".68" />
          <text :x="printRect.x" :y="printRect.y - 9" fill="#7665dc" font-size="9" font-family="sans-serif" font-weight="700" letter-spacing="1">ÁREA IMPRIMIBLE</text>
          <g clip-path="url(#print-area-clip)" :transform="`rotate(${design.rotation} ${designCenter.x} ${designCenter.y})`" class="design-overlay" @pointerdown="startDrag">
            <image v-if="artworkPreviewUrl" :href="artworkPreviewUrl" :x="designCenter.x - artworkWidth / 2" :y="designCenter.y - artworkHeight / 2" :width="artworkWidth" :height="artworkHeight" preserveAspectRatio="xMidYMid meet" />
            <text v-else-if="design.text" :x="designCenter.x" :y="designCenter.y" :fill="design.textColor" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" :font-size="27 * design.scale / 72" font-weight="700">{{ design.text }}</text>
            <g v-else>
              <circle :cx="designCenter.x" :cy="designCenter.y" :r="Math.min(artworkWidth, artworkHeight) * .28" fill="#705de9" opacity=".92" />
              <path :d="`M${designCenter.x - 20} ${designCenter.y}l14 14 29-31`" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <rect :x="designCenter.x - artworkWidth / 2" :y="designCenter.y - artworkHeight / 2" :width="artworkWidth" :height="artworkHeight" fill="transparent" stroke="#705de9" stroke-dasharray="4 3" stroke-width="1" class="design-drag-target" />
          </g>
          <text x="250" y="491" text-anchor="middle" fill="#878894" font-family="sans-serif" font-size="11">{{ template.name }} · {{ selectedColorName }}</text>
        </svg>
      </div>
      <div class="preview-footnote"><span>◇</span> Arrastra el diseño sobre el área imprimible para posicionarlo.</div>
    </div>

    <aside class="designer-controls">
      <section class="designer-section">
        <div class="designer-section-title"><span>01</span><div><h2>Producto base</h2><p>Elige una plantilla de fabricación propia.</p></div></div>
        <label class="field"><span>Tipo de producto</span><select :value="selectedTemplateId" @change="chooseTemplate(($event.target as HTMLSelectElement).value)"><option v-for="item in templates" :key="item.id" :value="item.id">{{ item.name }} · {{ item.category }}</option></select></label>
        <div v-if="template" class="template-info"><span>{{ template.material }}</span><span>{{ template.printMethods.join(" · ") }}</span></div>
      </section>

      <section class="designer-section">
        <div class="designer-section-title"><span>02</span><div><h2>Personaliza</h2><p>Agrega arte o texto para tu producto.</p></div></div>
        <label class="field"><span>Imagen de diseño</span><input type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading" @change="uploadArtwork" /></label>
        <div v-if="uploading" class="upload-progress">Subiendo diseño...</div>
        <button v-if="artworkAsset" class="text-button remove-artwork" type="button" @click="clearArtwork">Quitar imagen del mockup</button>
        <label class="field"><span>Texto para imprimir</span><input v-model="design.text" maxlength="120" placeholder="Escribe un texto para tu diseño" /></label>
        <div class="field-row">
          <label class="field"><span>Color de vista previa del texto</span><select v-model="design.textColor"><option v-for="color in enabledPrintTextColors" :key="color.value" :value="color.value">{{ color.name }}</option></select></label>
          <div class="print-text-color-settings">
            <span class="field-label">Colores de texto disponibles para clientes</span>
            <p>Activa solo los tonos que quieres ofrecer en la tienda.</p>
            <div class="print-text-color-options">
              <label v-for="color in availablePrintTextColors" :key="color.value" :class="{ enabled: design.textColorOptions.includes(color.value) }">
                <input type="checkbox" :checked="design.textColorOptions.includes(color.value)" :disabled="design.textColorOptions.length === 1 && design.textColorOptions.includes(color.value)" @change="togglePrintTextColor(color.value)" />
                <span class="mini-swatch" :style="{ '--swatch': color.value }"></span>{{ color.name }}
              </label>
            </div>
          </div>
          <label class="field"><span>Escala (%)</span><input v-model.number="design.scale" type="range" min="10" max="100" step="1" /></label>
        </div>
        <div class="field-row">
          <label class="field"><span>Posición horizontal</span><input v-model.number="design.x" type="range" min="0" max="100" /></label>
          <label class="field"><span>Posición vertical</span><input v-model.number="design.y" type="range" min="0" max="100" /></label>
        </div>
        <label class="field"><span>Rotación (°)</span><input v-model.number="design.rotation" type="range" min="-180" max="180" /></label>
        <div class="design-position">
          <button class="button button-secondary" @click="design.x = 50; design.y = 48; design.rotation = 0">Centrar diseño</button>
          <span>{{ design.x }}% / {{ design.y }}%</span>
        </div>
        <div class="customer-designer-options">
          <strong>Opciones para el diseñador de clientes</strong>
          <p>Elige qué controles estarán disponibles para cada producto publicado.</p>
          <label v-for="option in customerDesignerSettings" :key="option.key">
            <input
              v-model="design.customerDesignerOptions[option.key]"
              type="checkbox"
              :disabled="(option.key === 'text' && !design.customerDesignerOptions.artwork) || (option.key === 'artwork' && !design.customerDesignerOptions.text)"
            />
            {{ option.label }}
          </label>
        </div>
      </section>

      <section class="designer-section">
        <div class="designer-section-title"><span>03</span><div><h2>Variantes y precios</h2><p>Define colores físicos y presentaciones; el color elegido se reflejará en la maqueta del cliente y cada variante conservará su precio.</p></div></div>
          <span class="field-label">Color inicial de la maqueta</span>
        <div class="color-swatches">
          <button v-for="color in colors" :key="color.value" type="button" :title="color.name" :aria-label="color.name" :class="{ selected: design.color === color.value, included: selectedColors.includes(color.value) }" :style="{ '--swatch': color.value }" @click="choosePreviewColor(color.value)"></button>
        </div>
          <span class="field-label">Colores físicos disponibles para el cliente</span>
        <div class="variant-color-list">
          <label v-for="color in variantColorOptions" :key="color.value"><input type="checkbox" :checked="selectedColors.includes(color.value)" @change="toggleProductColor(color.value)" /><span class="mini-swatch" :style="{ '--swatch': colors.find((option) => option.value === color.value)?.value ?? '#a9abb0' }"></span>{{ color.name }}</label>
        </div>
        <span class="field-label">Tallas / presentaciones</span>
        <div class="size-options">
          <label v-for="size in availableSizes" :key="size" :class="{ selected: selectedSizes.includes(size) }"><input v-model="selectedSizes" type="checkbox" :value="size" />{{ size }}</label>
        </div>
        <p class="variant-count" :class="{ 'variant-count-error': hasTooManyVariants }">{{ productVariants.length }} variantes {{ editingProductId ? "configuradas" : "listas para crear" }}{{ hasTooManyVariants ? " (máximo 100)" : "" }}</p>
        <div class="variant-edit-list">
          <div v-for="variant in productVariants" :key="variant.id ?? variantKey(variant.size, variant.color)" class="variant-edit-card">
            <strong>{{ variant.size }} · {{ variant.color }}</strong>
            <label class="field"><span>Nombre de variante</span><input :value="variant.name" required maxlength="191" @input="updateVariantField(variant.size, variant.color, 'name', $event)" /></label>
            <label class="field"><span>SKU</span><input :value="variant.sku" maxlength="100" @input="updateVariantField(variant.size, variant.color, 'sku', $event)" /></label>
            <div class="field-row">
              <label class="field"><span>Costo interno</span><input :value="variant.providerCost" type="number" min="0" step="0.01" required @input="updateVariantField(variant.size, variant.color, 'providerCost', $event)" /></label>
              <label class="field"><span>Precio final</span><input :value="variant.salePrice" type="number" min="0" step="0.01" required @input="updateVariantField(variant.size, variant.color, 'salePrice', $event)" /></label>
            </div>
          </div>
        </div>
      </section>

      <section class="designer-section">
        <div class="designer-section-title"><span>04</span><div><h2>Datos del producto</h2><p>Completa la información general y de fabricación.</p></div></div>
        <label class="field"><span>Nombre comercial</span><input v-model="form.name" required minlength="2" maxlength="191" /></label>
        <label class="field"><span>Descripción</span><textarea v-model="form.description" rows="2" maxlength="10000" placeholder="Describe materiales, acabados o uso"></textarea></label>
        <label class="field"><span>Método de fabricación</span><select v-model="form.productionMethod"><option v-for="method in template.printMethods" :key="method">{{ method }}</option></select></label>
        <div class="form-actions">
          <button class="button button-secondary" type="button" @click="downloadMockup">Descargar PNG</button>
          <button type="button" class="button button-primary" :disabled="saving || hasTooManyVariants || !productVariants.length" @click="saveProduct">{{ saving ? "Guardando..." : editingProductId ? "Guardar cambios" : "Guardar producto" }}</button>
        </div>
      </section>
    </aside>
  </section>
</template>
