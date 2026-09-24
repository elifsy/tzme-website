import { createApp, h } from "vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";
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
import { i18n } from "./i18n/index.js";

const router = createRouter({
  history: createWebHistory(),
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
    { path: "/about", component: () => import("./views/AboutView.vue") },
    { path: "/insights", component: () => import("./views/InsightsView.vue") },
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
const app = createApp({ render: () => h(RouterView) });
app.use(router);
app.use(i18n);
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
