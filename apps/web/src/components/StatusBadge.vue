<script setup lang="ts">
const props = defineProps<{ status: string }>();
const labels: Record<string, string> = {
  draft: "Borrador",
  processing: "Procesando",
  ready: "Listo",
  published: "Publicado",
  sync_error: "Error de sincronización",
  archived: "Archivado",
  received: "Recibido",
  validation_pending: "Validación",
  awaiting_approval: "Por aprobar",
  submitted: "Enviado",
  accepted: "Aceptado",
  in_production: "En producción",
  shipped: "Enviado",
  delivered: "Entregado",
  cancel_requested: "Cancelación solicitada",
  cancelled: "Cancelado",
  failed: "Fallido",
  action_required: "Requiere atención",
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
  queued: "En cola",
  prepress: "Preprensa",
  quality_check: "Control de calidad",
  packed: "Empacado",
  completed: "Completado",
  blocked: "Bloqueado",
  active: "Activo",
  maintenance: "Mantenimiento",
  inactive: "Inactivo",
  open: "Abierto",
  in_progress: "En progreso",
  waiting_customer: "Esperando cliente",
  resolved: "Resuelto",
  closed: "Cerrado",
};
</script>

<template>
  <span class="status-badge" :class="`status-${props.status}`">{{ labels[props.status] ?? props.status }}</span>
</template>
