<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, RouterView, RouterLink } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { getErrorMessage } from "../services/api";

const auth = useAuthStore();
const router = useRouter();
const isAdmin = computed(() => ["owner", "admin"].includes(auth.tenant?.role ?? ""));
const loggingOut = ref(false);
const logoutError = ref("");
const userInitial = computed(() => auth.user?.name.trim().charAt(0).toUpperCase() ?? "");

async function logout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  logoutError.value = "";
  try {
    await auth.logout();
    await router.replace({ name: "login" });
  } catch (reason) {
    logoutError.value = getErrorMessage(reason);
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">P</span>
        <span>print<span class="brand-light">ly</span></span>
      </RouterLink>
      <div class="tenant-switcher">
        <span class="tenant-avatar">{{ auth.tenant?.name.slice(0, 1).toUpperCase() }}</span>
        <span class="tenant-name">{{ auth.tenant?.name }}</span>
        <span class="chevron">⌄</span>
      </div>
      <p class="nav-label">GESTIÓN</p>
      <nav class="main-nav">
        <RouterLink to="/dashboard" exact-active-class="active" title="Resumen" aria-label="Resumen"><span class="nav-icon">⌂</span> Resumen</RouterLink>
        <RouterLink to="/catalog" active-class="active" title="Catálogo" aria-label="Catálogo"><span class="nav-icon">▦</span> Catálogo</RouterLink>
        <RouterLink to="/products" active-class="active" title="Mis productos" aria-label="Mis productos"><span class="nav-icon">◇</span> Mis productos</RouterLink>
        <RouterLink to="/designer" active-class="active" title="Diseñador" aria-label="Diseñador"><span class="nav-icon">✳</span> Diseñador</RouterLink>
        <RouterLink to="/orders" active-class="active" title="Pedidos" aria-label="Pedidos"><span class="nav-icon">▤</span> Pedidos</RouterLink>
        <RouterLink v-if="isAdmin" to="/support" active-class="active" title="Atención al cliente" aria-label="Atención al cliente"><span class="nav-icon">✦</span> Atención al cliente</RouterLink>
        <RouterLink to="/production" active-class="active" title="Producción" aria-label="Producción"><span class="nav-icon">⚙</span> Producción</RouterLink>
      </nav>
      <div class="sidebar-bottom">
        <RouterLink to="/settings" active-class="active" title="Configuración" aria-label="Configuración"><span class="nav-icon">⚙</span> Configuración</RouterLink>
        <div class="user-card">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-detail">
            <strong>{{ auth.user?.name }}</strong>
            <span>{{ auth.user?.email }}</span>
          </div>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div class="breadcrumbs">Panel <span>/</span> <strong>{{ $route.meta.title ?? $route.name }}</strong></div>
        <div class="topbar-right">
          <span class="online-dot"></span>
          <div class="topbar-user" :title="auth.user?.email">
            <span class="topbar-avatar">{{ userInitial }}</span>
            <span class="topbar-user-name">{{ auth.user?.name }}</span>
          </div>
          <button class="logout-button" type="button" :disabled="loggingOut" @click="logout">
            {{ loggingOut ? "Cerrando..." : "Cerrar sesión" }}
          </button>
          <button class="help-button" title="Ayuda">?</button>
        </div>
      </header>
      <div class="content-wrap">
        <div v-if="logoutError" class="alert alert-error">{{ logoutError }}</div>
        <RouterView />
      </div>
    </main>
  </div>
</template>
