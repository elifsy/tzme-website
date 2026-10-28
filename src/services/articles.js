import { computed } from "vue";
import { createCollection } from "./api.js";
import { normalizeContent } from "./catalog.js";
import { groupArticleCategories } from "../utils/articleCategories.js";
export {
  articleCategoryKey,
  resolveArticleCategory,
} from "../utils/articleCategories.js";

const catalog = createCollection("/api/articles", normalizeContent);
const articles = catalog.records;
const displayOrder = (item) =>
  Number(item.homeOrder) > 0 ? Number(item.homeOrder) : Number.MAX_SAFE_INTEGER;
const publishedArticles = computed(() =>
  articles.value
    .filter((item) => item.status === "published")
    .sort(
      (a, b) =>
        displayOrder(a) - displayOrder(b) ||
        String(b.date || "").localeCompare(String(a.date || "")) ||
        a.id.localeCompare(b.id),
    ),
);

const newsCategories = computed(() =>
  groupArticleCategories(publishedArticles.value),
);

export const articlePath = (id) => `/insights/${encodeURIComponent(id)}`;
export const articleDate = (date) => String(date || "").replaceAll("-", ".");

export function useArticleCatalog() {
  return {
    articles,
    publishedArticles,
    newsCategories,
    loadArticles: catalog.load,
    loading: catalog.loading,
  };
}
