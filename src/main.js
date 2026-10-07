import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from './App.vue';
import {
  ArrowRight,
  Box,
  ChatDotRound,
  CircleCheckFilled,
  DataBoard,
  Delete,
  Document,
  Edit,
  EditPen,
  Link,
  Picture,
  Plus,
  Promotion,
  Refresh,
  View,
} from "@element-plus/icons-vue";
import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-message-box.css";
import "./style.css";
import "./style/design-reference.css";
import "./style/design-adapter.css";
import "./style/news.css";
import "./style/projects.css";
import "./style/catalog-intro.css";
import { i18n } from "./i18n/index.js";
import { installAnalytics } from "./services/analytics.js";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: "smooth" };
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
    { path: "/projects/:id", component: () => import("./views/ProjectDetailView.vue") },
    { path: "/about", component: () => import("./views/AboutView.vue") },
    { path: "/insights", component: () => import("./views/InsightsView.vue") },
    { path: "/insights/:id", component: () => import("./views/NewsDetailView.vue") },
    {
      path: "/contact",
      component: () => import("./views/ContactView.vue"),
    },
    {
      path: "/admin/:view?",
      component: () => import("./views/AdminView.vue"),
      meta: { admin: true },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
const app = createApp(App);
app.use(router);
app.use(i18n);
installAnalytics(router, i18n.global.locale);
for (const [name, component] of Object.entries({
  ArrowRight,
  Box,
  ChatDotRound,
  CircleCheckFilled,
  DataBoard,
  Delete,
  Document,
  Edit,
  EditPen,
  Link,
  Picture,
  Plus,
  Promotion,
  Refresh,
  View,
}))
  app.component(name, component);
app.mount("#app");
