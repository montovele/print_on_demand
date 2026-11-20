<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getErrorMessage } from "../services/api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref("");
async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.replace({ name: "dashboard" });
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-story">
      <RouterLink class="brand auth-brand" to="/login">
        <span class="brand-mark">P</span><span>print<span class="brand-light">ly</span></span>
      </RouterLink>
      <div class="story-copy">
        <div class="story-kicker"><span></span> TU NEGOCIO, SIN INVENTARIO</div>
        <h1>De tu idea<br />a <em>tu tienda.</em></h1>
        <p>Diseña, administra y vende productos personalizados desde un solo lugar.</p>
        <div class="story-stats"><div><strong>Todo</strong><span>en un mismo panel</span></div><i></i><div><strong>A tu ritmo</strong><span>sin inventario propio</span></div></div>
      </div>
      <div class="story-footer">HECHO PARA QUIENES CREAN <span>© 2026 PRINTLY</span></div>
      <div class="story-orb"></div>
    </div>
    <div class="auth-form-side">
      <div class="auth-form-wrap">
        <p class="eyebrow">ACCESO A TU CUENTA</p>
        <h2>Bienvenido de nuevo</h2>
        <p class="auth-subtitle">Ingresa tus datos para continuar.</p>
        <div v-if="error || auth.initializationError" class="alert alert-error">{{ error || auth.initializationError }}</div>
        <form class="form-stack" @submit.prevent="submit">
          <label class="field">
            <span>Correo electrónico</span><input v-model="email" type="email" autocomplete="email" required placeholder="tu@correo.com" />
          </label>
          <label class="field">
            <span>Contraseña</span><input v-model="password" type="password" autocomplete="current-password" required minlength="8" placeholder="Mínimo 8 caracteres" />
          </label>
          <button class="button button-primary auth-submit" :disabled="busy">
            {{ busy ? "Un momento..." : "Iniciar sesión" }} <span>→</span>
          </button>
        </form>
        <p class="auth-legal">Al continuar, aceptas nuestros términos de servicio y política de privacidad.</p>
        <p class="auth-customer-link">¿Buscas tu cuenta de cliente? <RouterLink to="/store/access">Accede a la tienda</RouterLink></p>
      </div>
    </div>
  </div>
</template>
