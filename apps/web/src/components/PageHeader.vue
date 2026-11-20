<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="page-header">
    <div>
      <p class="eyebrow">WORKSPACE</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="page-description">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
