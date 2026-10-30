import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import {
  ArrowRight,
  Box,
  ChatDotRound,
  CircleCheckFilled,
  DataBoard,
  Document,
  EditPen,
  Picture,
  Plus,
} from "@element-plus/icons-vue";
import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-message-box.css";
import "./style.css";
import "./style/design-reference.css";
import "./style/design-adapter.css";
import "./style/news.css";
import "./style/projects.css";
import "./style/catalog-intro.css";
import "./style/design-j.css";
import "./style/site-layout.css";
import "./style/product-detail.css";
import "./style/site-refinement.css";
import "./style/site-typography.css";
import "./style/admin-auth.css";
import "./style/admin-message-box.css";
import { adminReturnPath, checkSession } from "./services/session.js";
import { i18n } from "./i18n/index.js";
import { installAnalytics } from "./services/analytics.js";
import { installSeo } from "./services/seo.js";
import { revealInitialPage } from "./services/pageStartup.js";
import { loadWebsiteContent } from "./services/website.js";
import { loadContactSettings } from "./services/contactSettings.js";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      const target = document.getElementById(to.hash.slice(1));
      return {
        el: to.hash,
        top: target
          ? parseFloat(getComputedStyle(target).scrollMarginTop) || 0
          : 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      };
    }
    if (to.path !== from.path) return { top: 0 };
    return false;
  },
  routes: [
    { path: "/", component: () => import("./views/HomeView.vue") },
    {
      path: "/solutions",
      component: () => import("./views/ProductsView.vue"),
    },
    {
      path: "/solutions/:category/:id",
      component: () => import("./views/ProductDetailView.vue"),
    },
    {
      path: "/solutions/:id",
      component: () => import("./views/ProductDetailView.vue"),
    },
    { path: "/projects", component: () => import("./views/ProjectsView.vue") },
    {
      path: "/projects/:id",
      component: () => import("./views/ProjectDetailView.vue"),
    },
    { path: "/about", component: () => import("./views/AboutView.vue") },
    { path: "/insights", component: () => import("./views/InsightsView.vue") },
    {
      path: "/insights/:id",
      component: () => import("./views/NewsDetailView.vue"),
    },
    { path: "/site-map", component: () => import("./views/SiteMapView.vue") },
    {
      path: "/contact",
      component: () => import("./views/ContactView.vue"),
    },
    {
      path: "/admin/login",
      component: () => import("./views/AdminLoginView.vue"),
    },
    {
      path: "/admin/:view?",
      component: () => import("./views/AdminView.vue"),
      meta: { admin: true },
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("./views/NotFoundView.vue"),
    },
  ],
});
router.beforeEach(async (to) => {
  if (to.path.length > 1 && to.path.endsWith("/"))
    return {
      path: to.path.slice(0, -1),
      query: to.query,
      hash: to.hash,
      replace: true,
    };
  if (!to.meta.admin && to.path !== "/admin/login") return true;
  try {
    const account = await checkSession();
    if (to.path === "/admin/login")
      return account && !account.mustChangePassword
        ? adminReturnPath(to.query.redirect)
        : true;
    if (!account || account.mustChangePassword)
      return { path: "/admin/login", query: { redirect: to.fullPath } };
    if (to.params.view === "accounts" && account.role !== "SUPER_ADMIN")
      return "/admin";
    return true;
  } catch {
    return to.path === "/admin/login"
      ? true
      : { path: "/admin/login", query: { redirect: to.fullPath } };
  }
});
const app = createApp(App);
app.use(router);
app.use(i18n);
installAnalytics(router, i18n.global.locale);
installSeo(router);
for (const [name, component] of Object.entries({
  ArrowRight,
  Box,
  ChatDotRound,
  CircleCheckFilled,
  DataBoard,
  Document,
  EditPen,
  Picture,
  Plus,
}))
  app.component(name, component);
// Keep the readable server document as a failure/no-script fallback. Show the
// prepared Vue page once, instead of painting two different layouts at startup.
async function start() {
  await Promise.all([loadWebsiteContent(), loadContactSettings()]);
  await router.isReady();
  app.mount("#app");
  await revealInitialPage(router.currentRoute.value.hash);
}
start().catch(() => window.__tzmeSiteBoot?.finish());
