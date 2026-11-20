<script setup lang="ts">
import axios from "axios";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api, { getErrorMessage, setCsrfToken } from "../services/api";

const mode = ref<"login" | "register">("login");
const name = ref("");
const email = ref("");
const password = ref("");
const customer = ref<{ name: string; email: string } | null>(null);
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const router = useRouter();
const route = useRoute();

function checkoutRedirect() {
  return route.query.redirect === "/store/checkout" ? "/store/checkout" : null;
}

onMounted(async () => {
  try {
    const { data: session } = await api.get<{
      user: { name: string; email: string };
      csrfToken: string;
    }>("/auth/customer/me");
    customer.value = session.user;
    setCsrfToken(session.csrfToken);
    const redirect = checkoutRedirect();
    if (redirect) await router.replace(redirect);
  } catch (reason) {
    if (!axios.isAxiosError(reason) || reason.response?.status !== 401) {
      error.value = getErrorMessage(reason);
    }
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const endpoint = mode.value === "login" ? "/auth/customer/login" : "/auth/customer/register";
    const payload = mode.value === "login"
      ? { email: email.value, password: password.value }
      : { name: name.value, email: email.value, password: password.value };
    const { data } = await api.post<{
      user: { name: string; email: string };
      csrfToken: string;
    }>(endpoint, payload);
    customer.value = data.user;
    password.value = "";
    setCsrfToken(data.csrfToken);
    const redirect = checkoutRedirect();
    if (redirect) await router.replace(redirect);
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    busy.value = false;
  }
}

async function logout() {
  busy.value = true;
  error.value = "";
  try {
    await api.post("/auth/customer/logout");
    customer.value = null;
    password.value = "";
    setCsrfToken(null);
    await router.replace("/store/access");
  } catch (reason) {
    error.value = getErrorMessage(reason);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main class="customer-access-page">
    <div class="customer-access-art">
      <div class="customer-access-copy">
        <span class="store-kicker"><i></i> PRINTLY · HECHO A TU MANERA</span>
        <h1>Tu próxima idea<br />empieza <em>aquí.</em></h1>
        <p>Diseña productos únicos, guarda tus creaciones y sigue cada pedido desde un solo lugar.</p>
        <ul class="customer-access-benefits">
          <li><span>✓</span> Tus diseños, siempre a la mano</li>
          <li><span>✓</span> Compra segura y seguimiento sencillo</li>
        </ul>
      </div>
      <div class="access-showcase" aria-label="Ejemplo de productos personalizados">
        <div class="access-showcase-sun"></div>
        <div class="access-showcase-shirt"><span>YOUR<br />DESIGN</span></div>
        <div class="access-showcase-mug"><span>printly</span></div>
        <div class="access-showcase-caption"><span>DISEÑADO POR TI</span><strong>Ideas que se vuelven tuyas.</strong></div>
      </div>
    </div>
    <section class="customer-access-card">
      <RouterLink to="/store" class="customer-back-link"><span>←</span> Volver a la tienda</RouterLink>
      <div v-if="loading" class="customer-auth-loading" role="status">Conectando con la tienda…</div>
      <template v-else-if="customer">
        <span class="store-kicker">TU CUENTA</span>
        <h2>Hola, {{ customer.name.split(" ")[0] }}.</h2>
        <p>Tu cuenta de cliente ya está activa.</p>
        <div class="customer-signed-in">
          <span class="customer-signed-avatar">{{ customer.name.charAt(0).toUpperCase() }}</span>
          <div><strong>{{ customer.name }}</strong><span>{{ customer.email }}</span></div>
        </div>
        <p v-if="error" class="store-inline-error" role="alert">{{ error }}</p>
        <button class="store-primary-button customer-logout-button" type="button" :disabled="busy" @click="logout">
          {{ busy ? "Cerrando sesión…" : "Cerrar sesión" }} <span>→</span>
        </button>
      </template>
      <template v-else>
        <span class="store-kicker">{{ mode === "login" ? "QUÉ BUENO VERTE" : "EMPIEZA ALGO NUEVO" }}</span>
        <h2>{{ mode === "login" ? "Hola de nuevo." : "Crea tu cuenta." }}</h2>
        <p class="customer-access-intro">{{ mode === "login" ? "Inicia sesión para continuar con tus ideas." : "Regístrate para guardar tus diseños y pedidos." }}</p>
        <div class="customer-access-tabs" role="tablist" aria-label="Acceso a tu cuenta">
          <button type="button" role="tab" :aria-selected="mode === 'login'" :class="{ active: mode === 'login' }" @click="mode = 'login'; error = ''">Iniciar sesión</button>
          <button type="button" role="tab" :aria-selected="mode === 'register'" :class="{ active: mode === 'register' }" @click="mode = 'register'; error = ''">Crear cuenta</button>
        </div>
        <form class="customer-access-form" @submit.prevent="submit">
          <label v-if="mode === 'register'"><span>Nombre</span><input v-model="name" autocomplete="name" required minlength="2" maxlength="160" placeholder="Tu nombre"></label>
          <label><span>Correo electrónico</span><input v-model="email" type="email" autocomplete="email" required maxlength="191" placeholder="tu@correo.com"></label>
          <label><span>Contraseña</span><input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required minlength="8" maxlength="128" placeholder="Mínimo 8 caracteres"></label>
          <p v-if="error" class="store-inline-error" role="alert">{{ error }}</p>
          <button class="store-primary-button" type="submit" :disabled="busy">
            {{ busy ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta" }} <span>→</span>
          </button>
        </form>
        <div class="customer-access-note"><span>♧</span><p>Tu cuenta te ayuda a mantener tus datos y diseños en un mismo lugar.</p></div>
      </template>
      <p class="customer-access-legal">Al continuar, aceptas los términos de servicio y la política de privacidad de la tienda.</p>
      <p class="customer-access-admin-link">¿Administras esta tienda? <RouterLink to="/admin">Accede al panel administrativo</RouterLink></p>
    </section>
  </main>
</template>
