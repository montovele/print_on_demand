<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const showScrollTop = ref(false);

function updateScrollTopVisibility() {
  showScrollTop.value = window.scrollY > 360;
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

onMounted(() => {
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollTopVisibility);
});
</script>

<template>
  <RouterView />
  <button
    v-if="showScrollTop"
    class="scroll-to-top"
    type="button"
    aria-label="Volver a la parte superior"
    title="Volver arriba"
    @click="scrollToTop"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5m0 0L6 11m6-6 6 6" />
    </svg>
  </button>
</template>
