<script setup lang="ts">
import { onMounted, ref } from "vue";
import PageHeader from "../components/PageHeader.vue";
import api, { getErrorMessage } from "../services/api";

interface ProviderAccount {
  id: string;
  providerCode: string;
  displayName: string;
  connectionStatus: string;
  createdAt: string;
}

interface UpsSetupStatus {
  quoteReady: boolean;
  labelReady: boolean;
  sandbox: boolean;
  missingQuoteConfiguration: string[];
  missingLabelConfiguration: string[];
}

const accounts = ref<ProviderAccount[]>([]);
const upsStatus = ref<UpsSetupStatus | null>(null);
const accessToken = ref("");
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

async function load() {
  try {
    const [accountResponse, upsResponse] = await Promise.all([
      api.get("/providers/accounts"),
      api.get<UpsSetupStatus>("/providers/ups/status"),
    ]);
    accounts.value = accountResponse.data.items as ProviderAccount[];
    upsStatus.value = upsResponse.data;
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    loading.value = false;
  }
}

async function connect() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.post("/providers/printful/connect", { accessToken: accessToken.value });
    accessToken.value = "";
    success.value = "Cuenta de Printful conectada y credencial guardada cifrada.";
    await load();
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    saving.value = false;
  }
}

async function disconnect(account: ProviderAccount) {
  if (!window.confirm(`¿Desconectar ${account.displayName}?`)) return;
  error.value = "";
  try {
    await api.delete(`/providers/accounts/${account.id}`);
    accounts.value = accounts.value.filter((item) => item.id !== account.id);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  }
}

function disconnectPrintful() {
  const account = accounts.value.find((item) => item.providerCode === "printful");
  if (account) void disconnect(account);
}

onMounted(load);
</script>

<template>
  <PageHeader title="Configuración" description="Administra las conexiones de tu espacio de trabajo." />
  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <div v-if="success" class="alert alert-success">{{ success }}</div>
  <section class="content-card settings-card">
    <div class="section-heading"><div><h2>Proveedores POD</h2><p>Conecta el proveedor que fabricará y enviará tus productos.</p></div><span class="provider-mark">P</span></div>
    <div class="integration-row">
      <div class="integration-logo">P</div>
      <div class="integration-info"><strong>Printful</strong><span>Catálogo, producción y fulfillment</span></div>
      <span v-if="accounts.some(account => account.providerCode === 'printful')" class="connection-state"><i></i> Conectado</span>
      <span v-else class="connection-disconnected">Sin conectar</span>
    </div>
    <div v-if="accounts.some(account => account.providerCode === 'printful')" class="connected-account">
      <div><span class="connected-label">Cuenta conectada</span><strong>{{ accounts.find(account => account.providerCode === "printful")?.displayName }}</strong></div>
      <button class="button button-secondary button-danger" @click="disconnectPrintful">Desconectar</button>
    </div>
    <form v-else class="integration-form" @submit.prevent="connect">
      <p>Genera un token privado desde el portal de desarrolladores de Printful. La credencial se valida con Printful y se guarda cifrada en el servidor; nunca se almacena en el navegador.</p>
      <label class="field"><span>Token privado de Printful</span><input v-model="accessToken" type="password" autocomplete="off" required minlength="20" placeholder="Pega tu token privado" /></label>
      <button class="button button-primary" :disabled="saving || loading">{{ saving ? "Validando con Printful..." : "Conectar cuenta" }} <span>→</span></button>
    </form>
    <div v-if="loading" class="loading-state">Consultando conexiones...</div>
  </section>
  <section class="content-card settings-card">
    <div class="section-heading"><div><h2>UPS · Envíos y rastreo</h2><p>Prepara cotizaciones, compra de guías y actualización de entregas.</p></div><span class="provider-mark">U</span></div>
    <div class="integration-row">
      <div class="integration-logo">U</div>
      <div class="integration-info"><strong>UPS REST API</strong><span>{{ upsStatus?.sandbox ? "Entorno de pruebas" : "Endpoint de producción" }}</span></div>
      <span v-if="upsStatus?.labelReady" class="connection-state"><i></i> Lista para guías</span>
      <span v-else class="connection-disconnected">Configuración pendiente</span>
    </div>
    <div v-if="upsStatus" class="settings-note">
      <span class="metric-icon lavender">◎</span>
      <div>
        <strong>{{ upsStatus.quoteReady ? "Cotizaciones configuradas" : "Cotizaciones pendientes" }}</strong>
        <p>Las credenciales UPS no se guardan en la base de datos ni se solicitan aquí. Cuando tengas las reales, agrégalas al gestor de secretos del servidor y reinicia la API.</p>
        <p v-if="upsStatus.missingLabelConfiguration.length">Falta configurar en el servidor: {{ upsStatus.missingLabelConfiguration.join(", ") }}.</p>
        <p v-else>Origen y medidas de paquete configurados. Compra de guías y rastreo listos.</p>
      </div>
    </div>
    <div v-if="loading" class="loading-state">Consultando configuración UPS...</div>
  </section>
  <section class="content-card settings-card">
    <div class="section-heading"><div><h2>Tu espacio de trabajo</h2><p>Detalles de la cuenta comercial actual.</p></div></div>
    <div class="settings-note"><span class="metric-icon lavender">◎</span><div><strong>Cuenta aislada por tenant</strong><p>Tus productos, pedidos y conexiones se gestionan en el espacio de trabajo autenticado.</p></div></div>
  </section>
</template>
