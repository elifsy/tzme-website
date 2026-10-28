<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useDesignPage } from "../composables/useDesignPage.js";
import { localizedField } from "../services/catalog.js";
import {
  articleCategoryKey,
  resolveArticleCategory,
  articlePath,
  useArticleCatalog,
} from "../services/articles.js";
import NewsArticlePresentation from "../components/NewsArticlePresentation.vue";
import SiteFooter from "../components/SiteFooter.vue";
import SiteNav from "../components/SiteNav.vue";

const page = ref(null);
const route = useRoute();
const { locale } = useI18n({ useScope: "global" });
const { goTo } = useDesignPage("hc-news-detail", page);
const { publishedArticles, loadArticles } = useArticleCatalog();
const loading = ref(true);
const field = (item, name) => localizedField(item, name, locale.value);
const articleIndex = computed(() =>
  publishedArticles.value.findIndex((item) => item.id === route.params.id),
);
const article = computed(() => publishedArticles.value[articleIndex.value]);
const selectedCategory = computed(() =>
  resolveArticleCategory(route.query.category, publishedArticles.value),
);
const navigationArticles = computed(() =>
  selectedCategory.value
    ? publishedArticles.value.filter(
        (item) => articleCategoryKey(item) === selectedCategory.value,
      )
    : publishedArticles.value,
);
const navigationIndex = computed(() =>
  navigationArticles.value.findIndex((item) => item.id === route.params.id),
);
const previous = computed(() =>
  navigationIndex.value > 0
    ? navigationArticles.value[navigationIndex.value - 1]
    : null,
);
const next = computed(() =>
  navigationIndex.value >= 0
    ? navigationArticles.value[navigationIndex.value + 1]
    : null,
);
const listQuery = computed(() => ({
  ...(route.query.page ? { page: route.query.page } : {}),
  ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
}));
const listLink = computed(() => ({
  path: "/insights",
  query: listQuery.value,
}));
const detailLink = (id) => ({ path: articlePath(id), query: listQuery.value });
onMounted(async () => {
  await loadArticles();
  loading.value = false;
});
watch(
  () => route.params.id,
  () => window.scrollTo({ top: 0, behavior: "instant" }),
);
</script>

<template>
  <main ref="page" class="design-site news-detail site-refined refined-article">
    <div class="hc-page">
      <SiteNav />
      <template v-if="article">
        <NewsArticlePresentation :record="article" @contact="goTo('/contact')">
          <template #back
            ><router-link class="news-text-link article-back" :to="listLink"
              >← {{ $t("site.backToNews") }}</router-link
            ></template
          >
          <template #navigation>
            <nav class="article-pagination" :aria-label="$t('site.newsroom')">
              <router-link v-if="previous" :to="detailLink(previous.id)"
                ><span>← {{ $t("site.previousArticle") }}</span
                ><strong>{{ field(previous, "title") }}</strong></router-link
              >
              <div v-else></div>
              <router-link v-if="next" :to="detailLink(next.id)"
                ><span>{{ $t("site.nextArticle") }} →</span
                ><strong>{{ field(next, "title") }}</strong></router-link
              >
            </nav>
            <router-link class="news-text-link" :to="listLink"
              >← {{ $t("site.backToNews") }}</router-link
            >
          </template>
        </NewsArticlePresentation>
      </template>
      <section v-else class="hc-sec article-unavailable hc-w">
        <el-skeleton v-if="loading" :rows="8" animated />
        <el-empty v-else :description="$t('site.newsNotFound')"
          ><el-button type="primary" @click="goTo('/insights')">{{
            $t("site.backToNews")
          }}</el-button></el-empty
        >
      </section>
      <SiteFooter />
    </div>
  </main>
</template>
