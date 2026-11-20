import { defineStore } from "pinia";
import { ref } from "vue";
import api, { getErrorMessage, setCsrfToken } from "../services/api";
import type { Tenant, User } from "../types";
import axios from "axios";

interface AuthResponse {
  user: User;
  tenant: Tenant;
  csrfToken: string;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const tenant = ref<Tenant | null>(null);
  const initialized = ref(false);
  const initializationError = ref("");

  function applySession(data: AuthResponse) {
    user.value = data.user;
    tenant.value = data.tenant;
    setCsrfToken(data.csrfToken);
  }

  async function initialize() {
    if (initialized.value) return;
    try {
      const { data } = await api.get<AuthResponse>("/auth/me", { timeout: 5000 });
      applySession(data);
    } catch (reason) {
      user.value = null;
      tenant.value = null;
      setCsrfToken(null);
      if (axios.isAxiosError(reason) && reason.response?.status === 401) {
        initializationError.value = "";
      } else {
        initializationError.value = getErrorMessage(reason);
      }
    } finally {
      initialized.value = true;
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password }, { timeout: 8000 });
    applySession(data);
    initializationError.value = "";
    initialized.value = true;
  }

  async function logout() {
    await api.post("/auth/logout");
    user.value = null;
    tenant.value = null;
    setCsrfToken(null);
  }

  return { user, tenant, initialized, initializationError, initialize, login, logout };
});
