import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "./stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: () => import("./views/LoginView.vue"), meta: { guestOnly: true } },
    { path: "/admin", name: "admin-login", component: () => import("./views/LoginView.vue"), meta: { guestOnly: true } },
    {
      path: "/store",
      component: () => import("./layouts/StorefrontLayout.vue"),
      children: [
        { path: "", name: "storefront", component: () => import("./views/StorefrontView.vue") },
        { path: "design/:productId?", name: "storefront-designer", component: () => import("./views/CustomerDesignerView.vue") },
        { path: "access", name: "customer-access", component: () => import("./views/CustomerAccessView.vue") },
        { path: "checkout", name: "storefront-checkout", component: () => import("./views/CustomerCheckoutView.vue") },
      ],
    },
    {
      path: "/",
      component: () => import("./layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true, staffOnly: true },
      children: [
        { path: "dashboard", name: "dashboard", component: () => import("./views/DashboardView.vue") },
        { path: "catalog", name: "catalog", component: () => import("./views/CatalogView.vue") },
        { path: "products", name: "products", component: () => import("./views/ProductsView.vue") },
        { path: "designer/:productId?", name: "designer", component: () => import("./views/DesignerView.vue") },
        { path: "orders", name: "orders", component: () => import("./views/OrdersView.vue") },
        { path: "support", name: "support", component: () => import("./views/SupportView.vue"), meta: { adminOnly: true } },
        { path: "production", name: "production", component: () => import("./views/ProductionView.vue") },
        { path: "settings", name: "settings", component: () => import("./views/SettingsView.vue") },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach(async (to) => {
  if (to.path === "/") return { name: "customer-access" };

  const needsSession = to.meta.requiresAuth || to.meta.guestOnly || to.meta.staffOnly || to.meta.adminOnly;
  if (!needsSession) return;
  const auth = useAuthStore();
  await auth.initialize();
  if (to.meta.requiresAuth && !auth.user) return { name: "login" };
  if (to.meta.staffOnly && auth.tenant?.role === "customer") return { name: "login" };
  if (to.meta.adminOnly && !["owner", "admin"].includes(auth.tenant?.role ?? "")) return { name: "dashboard" };
  if (to.meta.guestOnly && auth.user && auth.tenant?.role !== "customer") return { name: "dashboard" };
});
