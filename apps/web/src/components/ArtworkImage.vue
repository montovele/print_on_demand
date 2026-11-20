<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import api from "../services/api";

const props = defineProps<{ src: string; alt: string }>();
const imageUrl = ref("");
let currentObjectUrl = "";

async function loadImage(source: string) {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  imageUrl.value = "";
  currentObjectUrl = "";
  try {
    const { data } = await api.get<Blob>(source, { responseType: "blob" });
    currentObjectUrl = URL.createObjectURL(data);
    imageUrl.value = currentObjectUrl;
  } catch {
    imageUrl.value = "";
  }
}

watch(() => props.src, loadImage);
onMounted(() => loadImage(props.src));
onBeforeUnmount(() => {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
});
</script>

<template>
  <img v-if="imageUrl" :src="imageUrl" :alt="alt" class="artwork-image" loading="lazy" />
  <span v-else class="artwork-image-placeholder" aria-hidden="true">◇</span>
</template>
