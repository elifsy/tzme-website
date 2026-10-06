<script setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Edit,
  Plus,
  Promotion,
  Refresh,
} from "@element-plus/icons-vue";
import { setLocale } from "../i18n/index.js";
import { availableLocales } from "../i18n/locales/index.js";
import CertificationsManager from "../components/CertificationsManager.vue";
import IndustriesManager from "../components/IndustriesManager.vue";
import ProjectsManager from "../components/ProjectsManager.vue";
import GlobalReachManager from "../components/GlobalReachManager.vue";
import LegacyDataMigration from "../components/LegacyDataMigration.vue";
import AdminEditorDialog from "../components/AdminEditorDialog.vue";
import AdminEditorPanel from "../components/AdminEditorPanel.vue";
import { sanitizeRichText } from "../utils/richText.js";
import { MAX_HOME_PRODUCTS, useProductCatalog } from "../services/catalog.js";
import { useArticleCatalog } from "../services/articles.js";
import { useInquiryCatalog } from "../services/inquiries.js";
import { apiRequest, dataErrors } from "../services/api.js";
import { industryField, useIndustryCatalog } from "../services/industries.js";

const route = useRoute();
const router = useRouter();
const RichTextEditor = defineAsyncComponent(() => import('../components/RichTextEditor.vue'));
const imageUploading = ref(false);
const editorFullscreen = ref(false);
const { t, locale } = useI18n({ useScope: "global" });
const tab = computed(() => route.params.view || "overview");
const { products, loadProducts } = useProductCatalog();
const { articles, loadArticles } = useArticleCatalog();
const { inquiries, loadInquiries } = useInquiryCatalog();
const certManager = ref(null);
const industryManager = ref(null);
const projectManager = ref(null);
const globalManager = ref(null);
const { industries: industryRecords, loadIndustries } = useIndustryCatalog();
const loading = ref(true);
const modal = ref(false);
const kind = ref("products");
const saving = ref(false);
const editingLocale = ref("en");
const form = reactive({
  id: "",
  titleEn: "",
  titleZh: "",
  categoryEn: "",
  categoryZh: "",
  industries: [],
  summaryEn: "",
  summaryZh: "",
  contentEn: "",
  contentZh: "",
  featuresEn: "",
  featuresZh: "",
  specificationsEn: "",
  specificationsZh: "",
  showOnHome: false,
  homeOrder: null,
  image: "",
  status: "published",
  date: "",
});
const titles = {
  overview: "admin.overview",
  products: "admin.products",
  industries: "admin.industryManagement",
  projects: "admin.projects",
  global: "admin.homeGlobal",
  articles: "admin.insights",
  certifications: "admin.certifications",
  inquiries: "admin.enquiries",
};
const navItems = [
  { key: "overview", label: "admin.overview", icon: "DataBoard" },
  { key: "products", label: "admin.products", icon: "Box" },
  { key: "industries", label: "admin.industryManagement", icon: "DataBoard" },
  { key: "projects", label: "admin.projects", icon: "DataBoard" },
  { key: "global", label: "admin.homeGlobal", icon: "Picture" },
  { key: "articles", label: "admin.insights", icon: "Document" },
  { key: "certifications", label: "admin.certifications", icon: "CircleCheckFilled" },
  { key: "inquiries", label: "admin.enquiries", icon: "ChatDotRound" },
];
const publishedProducts = computed(
  () => products.value.filter((item) => item.status === "published").length,
);
const homeProductCount = computed(() => products.value.filter((item) => item.showOnHome).length);
const publishedArticles = computed(
  () => articles.value.filter((item) => item.status === "published").length,
);
const newInquiries = computed(
  () => inquiries.value.filter((item) => item.status === "new").length,
);
const currentItems = computed(() =>
  tab.value === "products" ? products.value : articles.value,
);
function field(item, key) {
  return locale.value === "zh"
    ? item[`${key}Zh`] || item[`${key}En`] || item[key] || ""
    : item[`${key}En`] || item[key] || "";
}
function industryNames(ids) {
  return (ids || []).map((id) => industryField(industryRecords.value.find((item) => item.id === id), 'title', locale.value))
    .filter(Boolean).join(' · ') || '—';
}
function industryOptionLabel(item) {
  const title = industryField(item, 'title', locale.value);
  return item.status === 'draft' ? `${title} (${t('admin.draft')})` : title;
}
async function writeRecord(type, record, update) {
  return apiRequest('/api/' + type + (update ? '/' + encodeURIComponent(record.id) : ''), {
    method: update ? 'PUT' : 'POST', body: record,
  });
}
async function reloadType(type) {
  return type === 'products' ? loadProducts() : type === 'articles' ? loadArticles() : loadInquiries();
}
async function load() {
  loading.value = true;
  try { await Promise.all([loadProducts(), loadArticles(), loadInquiries()]); }
  finally { loading.value = false; }
}

function openEditor(type, item) {
  kind.value = type;
  editingLocale.value = locale.value === "zh" ? "zh" : "en";
  Object.assign(form, {
    id: item?.id || "",
    titleEn: item?.titleEn || item?.title || "",
    titleZh: item?.titleZh || "",
    categoryEn: item?.categoryEn || item?.category || "",
    categoryZh: item?.categoryZh || "",
    industries: [...(item?.industries || (item?.industry ? [item.industry] : []))],
    summaryEn: item?.summaryEn || item?.summary || "",
    summaryZh: item?.summaryZh || "",
    contentEn: type === 'articles' ? sanitizeRichText(item?.contentEn || item?.content || '') : item?.contentEn || item?.content || "",
    contentZh: type === 'articles' ? sanitizeRichText(item?.contentZh || '') : item?.contentZh || "",
    featuresEn: item?.featuresEn || "",
    featuresZh: item?.featuresZh || "",
    specificationsEn: item?.specificationsEn || "",
    specificationsZh: item?.specificationsZh || "",
    showOnHome: item?.showOnHome ?? false,
    homeOrder: item?.homeOrder ?? null,
    image: item?.image || "",
    status: item?.status || "published",
    date: item?.date || new Date().toISOString().slice(0, 10),
  });
  modal.value = true;
}

async function save() {
  if (saving.value || imageUploading.value) return;
  if (!form.titleEn.trim() || !form.titleZh.trim()) {
    ElMessage.warning(t("admin.bothTitlesRequired"));
    return;
  }
  if (kind.value === 'articles' && !form.date) {
    ElMessage.warning(t('admin.publicationDateRequired'));
    return;
  }
  if (kind.value === 'articles') {
    form.contentEn = sanitizeRichText(form.contentEn);
    form.contentZh = sanitizeRichText(form.contentZh);
  }
  if (kind.value === 'products' && (!form.industries.length ||
      form.industries.some((id) => !industryRecords.value.some((item) => item.id === id)))) {
    ElMessage.warning(t('admin.selectProductIndustry'));
    return;
  }
  if (kind.value === 'products' && form.showOnHome &&
      products.value.filter((item) => item.showOnHome && item.id !== form.id).length >= MAX_HOME_PRODUCTS) {
    ElMessage.warning(t('admin.homeLimitReached', { max: MAX_HOME_PRODUCTS }));
    return;
  }
  saving.value = true;
  const record = {
    ...form, industries: [...form.industries],
    id: form.id || (kind.value === 'products' ? 'product-' : 'article-') + crypto.randomUUID(),
    title: form.titleEn, category: form.categoryEn, summary: form.summaryEn, content: form.contentEn,
  };
  try {
    await writeRecord(kind.value, record, Boolean(form.id));
    await reloadType(kind.value);
    modal.value = false;
    ElMessage.success(t('admin.contentSaved'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); }
  finally { saving.value = false; }
}
async function setHomeFeatured(item, selected) {
  if (selected && homeProductCount.value >= MAX_HOME_PRODUCTS) {
    ElMessage.warning(t('admin.homeLimitReached', { max: MAX_HOME_PRODUCTS })); return;
  }
  const record = { ...item, showOnHome: selected,
    homeOrder: selected && !item.homeOrder ? Math.max(0, ...products.value.map((product) => Number(product.homeOrder) || 0)) + 1 : item.homeOrder };
  try { await writeRecord('products', record, true); await loadProducts(); }
  catch { ElMessage.error(t('admin.apiWriteFailed')); }
}
async function remove(type, item) {
  try {
    await ElMessageBox.confirm(t('admin.deleteConfirm', { title: field(item, 'title') }), t('admin.deleteContent'), {
      confirmButtonText: t('admin.delete'), cancelButtonText: t('admin.cancel'), type: 'warning',
    });
  } catch { return; }
  try {
    await apiRequest('/api/' + type + '/' + encodeURIComponent(item.id), { method: 'DELETE' });
    await reloadType(type);
    ElMessage.success(t('admin.contentDeleted'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); }
}
async function toggle(item, type) {
  const record = { ...item, status: item.status === 'published' ? 'draft' : 'published' };
  try {
    await writeRecord(type, record, true); await reloadType(type);
    ElMessage.success(t(record.status === 'published' ? 'admin.contentPublished' : 'admin.movedToDrafts'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); }
}
async function updateInquiry(item, status) {
  try {
    await apiRequest('/api/inquiries/' + item.id, { method: 'PUT', body: { status } });
    await loadInquiries(); ElMessage.success(t('admin.enquiryUpdated'));
  } catch { ElMessage.error(t('admin.apiWriteFailed')); }
}

function navigate(key) {
  router.push(`/admin/${key === "overview" ? "" : key}`);
}
function refresh() {
  if (tab.value === 'certifications') certManager.value?.load();
  else if (tab.value === 'industries') industryManager.value?.load();
  else if (tab.value === 'projects') projectManager.value?.load();
  else if (tab.value === 'global') globalManager.value?.load();
  else { load(); loadIndustries(); }
}
onMounted(() => { load(); if (tab.value !== 'industries') loadIndustries(); });
</script>

<template>
  <el-container class="admin-shell">
    <el-aside class="admin-sidebar" width="244px">
      <router-link to="/admin" class="admin-brand">
        <span class="admin-brand-mark">T</span>
        <span
          >TZME<small>{{ $t('admin.management') }}</small></span
        >
      </router-link>
      <div class="admin-menu-label">{{ $t('admin.workspace') }}</div>
      <el-menu class="admin-menu" :default-active="tab" @select="navigate">
        <el-menu-item
          v-for="item in navItems"
          :key="item.key"
          :index="item.key"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ $t(item.label) }}</span>
          <el-badge
            v-if="item.key === 'inquiries' && newInquiries"
            :value="newInquiries"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>
      <div class="admin-sidebar-foot">
        <div><span v-if="!dataErrors.size" class="online-dot" />{{ $t(dataErrors.size ? 'admin.databaseReadFailed' : 'admin.systemOperational') }}</div>
        <el-link href="/" target="_blank" :underline="false"
          ><el-icon><Link /></el-icon>{{ $t('admin.viewWebsite') }}</el-link
        >
      </div>
    </el-aside>

    <el-container class="admin-main">
      <el-header class="admin-topbar" height="62px">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>TZME</el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t(titles[tab] || "admin.overview")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="admin-profile">
          <el-button-group class="admin-language">
            <el-button
              v-for="option in availableLocales"
              :key="option.code"
              size="small"
              :type="locale === option.code ? 'primary' : 'default'"
              @click="setLocale(option.code)"
              >{{ option.shortLabel }}</el-button
            >
          </el-button-group>
          <el-avatar :size="32" class="admin-avatar">A</el-avatar>
          <div>
            {{ $t('admin.administrator') }}<small>{{ $t('admin.contentManager') }}</small>
          </div>
          <el-tooltip :content="$t('admin.refreshData')"
            ><el-button text circle :icon="Refresh" @click="refresh"
          /></el-tooltip>
        </div>
      </el-header>

      <el-main class="admin-content">
        <LegacyDataMigration @migrated="refresh" />
        <div class="admin-heading">
          <div>
            <div class="admin-eyebrow">
              {{ $t('admin.contentManagement2026') }}
            </div>
            <h1>{{ $t(titles[tab] || "admin.overview") }}</h1>
            <p>
              {{ $t(tab === 'certifications' ? 'admin.certDescription'
                : tab === 'industries' ? 'admin.industryManagementDescription'
                : tab === 'projects' ? 'admin.projectManagementDescription'
                : tab === 'global' ? 'admin.homeGlobalDescription'
                : 'admin.manageYourCorporateWebsiteContentAndEnquiries') }}
            </p>
          </div>
          <div class="admin-actions">
            <el-button :icon="Refresh" @click="refresh">{{
              $t('admin.refresh')
            }}</el-button>
            <el-button
              v-if="tab === 'products' || tab === 'articles'"
              type="primary"
              :icon="Plus"
              @click="openEditor(tab)"
            >
              {{ $t(tab === "articles" ? "admin.createArticle" : "admin.createProduct") }}
            </el-button>
          </div>
        </div>

        <template v-if="tab === 'overview'">
          <el-row :gutter="16" class="stat-grid">
            <el-col
              v-for="stat in [
                {
                  label: 'admin.totalProducts',
                  value: products.length,
                  hint: `${publishedProducts} ${$t('admin.published3')}`,
                  icon: 'Box',
                  tone: 'blue',
                },
                {
                  label: 'admin.articles',
                  value: articles.length,
                  hint: `${publishedArticles} ${$t('admin.published3')}`,
                  icon: 'Document',
                  tone: 'violet',
                },
                {
                  label: 'admin.totalEnquiries',
                  value: inquiries.length,
                  hint: `${newInquiries} ${$t('admin.awaitingResponse')}`,
                  icon: 'ChatDotRound',
                  tone: 'orange',
                },
                {
                  label: 'admin.websiteStatus',
                  value: dataErrors.size ? 'admin.databaseUnavailable' : loading ? 'admin.databaseConnecting' : 'admin.online',
                  hint: $t(dataErrors.size ? 'admin.databaseReadFailed' : 'admin.allSystemsOperational'),
                  icon: 'CircleCheckFilled',
                  tone: 'green',
                },
              ]"
              :key="stat.label"
              :xs="12"
              :sm="12"
              :md="6"
            >
              <el-card shadow="never" class="stat-card">
                <div class="stat-top">
                  <span class="stat-label">{{ $t(stat.label) }}</span
                  ><span :class="['stat-icon', stat.tone]"
                    ><el-icon><component :is="stat.icon" /></el-icon
                  ></span>
                </div>
                <strong
                  :class="{ 'status-good': stat.label === 'admin.websiteStatus' }"
                  >{{ typeof stat.value === 'string' ? $t(stat.value) : stat.value }}</strong
                >
                <div class="stat-hint">{{ stat.hint }}</div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="dashboard-panels">
            <el-col :xs="24" :md="14">
              <el-card shadow="never" class="dashboard-card">
                <template #header
                  ><div class="card-heading">
                    <div>
                      <strong>{{ $t('admin.recentEnquiries') }}</strong
                      ><small>{{
                        $t('admin.latestMessagesFromYourWebsite')
                      }}</small>
                    </div>
                    <el-button
                      link
                      type="primary"
                      @click="navigate('inquiries')"
                      >{{ $t('admin.viewAll') }} <el-icon><ArrowRight /></el-icon
                    ></el-button></div
                ></template>
                <el-empty
                  v-if="!inquiries.length"
                  :image-size="52"
                  :description="$t('admin.noEnquiriesYet')"
                />
                <div
                  v-for="item in inquiries.slice(0, 4)"
                  :key="item.id"
                  class="mini-inquiry"
                >
                  <el-avatar :size="32">{{
                    (item.name || "U").slice(0, 1).toUpperCase()
                  }}</el-avatar>
                  <div class="inquiry-summary">
                    <strong>{{ item.name || $t('admin.websiteVisitor') }}</strong
                    ><small>{{ item.company }} · {{ item.email }}</small>
                  </div>
                  <time>{{ item.createdAt?.slice(0, 10) || $t('admin.today') }}</time>
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :md="10">
              <el-card shadow="never" class="dashboard-card quick-card">
                <template #header
                  ><div class="card-heading">
                    <div>
                      <strong>{{ $t('admin.quickActions') }}</strong
                      ><small>{{ $t('admin.commonContentTasks') }}</small>
                    </div>
                  </div></template
                >
                <el-button
                  class="quick-action"
                  text
                  @click="openEditor('products')"
                  ><el-icon><Box /></el-icon
                  ><span
                    ><b>{{ $t('admin.addAProduct') }}</b
                    ><small>{{
                      $t('admin.createAProductListingForTheWebsite')
                    }}</small></span
                  ><el-icon class="quick-arrow"><ArrowRight /></el-icon
                ></el-button>
                <el-button
                  class="quick-action"
                  text
                  @click="openEditor('articles')"
                  ><el-icon><EditPen /></el-icon
                  ><span
                    ><b>{{ $t('admin.writeAnArticle') }}</b
                    ><small>{{
                      $t('admin.shareCompanyNewsAndInsights')
                    }}</small></span
                  ><el-icon class="quick-arrow"><ArrowRight /></el-icon
                ></el-button>
                <el-link
                  class="quick-action"
                  href="/"
                  target="_blank"
                  :underline="false"
                  ><el-icon><View /></el-icon
                  ><span
                    ><b>{{ $t('admin.previewWebsite') }}</b
                    ><small>{{
                      $t('admin.openThePublicFacingWebsite')
                    }}</small></span
                  ><el-icon class="quick-arrow"><ArrowRight /></el-icon
                ></el-link>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="dashboard-card content-overview">
            <template #header
              ><div class="card-heading">
                <div>
                  <strong>{{ $t('admin.contentOverview') }}</strong
                  ><small>{{ $t('admin.publishedWebsiteContent') }}</small>
                </div>
              </div></template
            >
            <el-row :gutter="16">
              <el-col
                v-for="item in [
                  {
                    label: 'admin.products',
                    value: publishedProducts,
                    total: products.length,
                    route: 'products',
                    color: '#4388dc',
                  },
                  {
                    label: 'admin.insights',
                    value: publishedArticles,
                    total: articles.length,
                    route: 'articles',
                    color: '#826bd5',
                  },
                  {
                    label: 'admin.openEnquiries',
                    value: newInquiries,
                    total: inquiries.length,
                    route: 'inquiries',
                    color: '#df8b52',
                  },
                ]"
                :key="item.route"
                :xs="24"
                :sm="8"
              >
                <button class="overview-item" @click="navigate(item.route)">
                  <span>{{ $t(item.label) }}</span
                  ><strong
                    >{{ item.value
                    }}<small v-if="item.route !== 'inquiries'">
                      / {{ item.total }}</small
                    ></strong
                  ><el-progress
                    :percentage="
                      item.total
                        ? Math.round((item.value / item.total) * 100)
                        : 0
                    "
                    :show-text="false"
                    :color="item.color"
                    :stroke-width="4"
                  />
                </button>
              </el-col>
            </el-row>
          </el-card>
        </template>

        <el-card
          v-else-if="tab === 'products' || tab === 'articles'"
          shadow="never"
          class="table-card"
        >
          <template #header
            ><div class="card-heading">
              <div>
                <strong>{{
                  $t(
                    tab === "products"
                      ? "admin.productCatalogue"
                      : "admin.articlesAndInsights",
                  )
                }}</strong
                ><small>{{
                  $t(
                    tab === "products"
                      ? "admin.manageSolutionCategoriesAndProductListings"
                      : "admin.publishNewsAndCompanyUpdates",
                  )
                }}</small>
              </div>
              <el-tag effect="plain" type="info"
                >{{ currentItems.length }} {{ $t('admin.records') }}</el-tag
              >
            </div></template
          >
          <el-alert v-if="tab === 'products'" class="home-product-tip" type="info" :closable="false"
            :title="$t('admin.homeSelectionCount', { count: homeProductCount, max: MAX_HOME_PRODUCTS })"
            :description="$t('admin.homeSelectionHint')" />
          <el-table
            :data="currentItems"
            v-loading="loading"
            row-key="id"
            :empty-text="$t('admin.noContentYetCreateYourFirstRecord')"
          >
            <el-table-column :label="$t('admin.content')" min-width="300">
              <template #default="{ row }"
                ><div class="content-cell">
                  <el-image
                    v-if="row.image"
                    :src="row.image"
                    fit="cover"
                    class="content-image"
                    ><template #error
                      ><div class="image-fallback">
                        <el-icon><Picture /></el-icon></div></template
                  ></el-image>
                  <div>
                    <strong>{{ field(row, "title") }}</strong
                    ><small>{{ field(row, "summary") }}</small>
                    <div class="bilingual-badges">
                      <el-tag size="small" type="info" effect="plain">EN</el-tag
                      ><el-tag
                        size="small"
                        :type="row.titleZh ? 'success' : 'warning'"
                        effect="plain"
                        >{{
                          row.titleZh
                            ? $t('admin.zhPresent')
                            : $t('admin.zhMissing')
                        }}</el-tag
                      >
                    </div>
                  </div>
                </div></template
              >
            </el-table-column>
            <el-table-column :label="$t('admin.category')" width="150"
              ><template #default="{ row }"
                ><el-tag size="small" effect="plain" type="info">{{
                  field(row, "category") || $t('admin.general')
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column v-if="tab === 'products'" :label="$t('admin.productIndustry')" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">{{ industryNames(row.industries) }}</template>
            </el-table-column>
            <el-table-column v-if="tab === 'products'" :label="$t('admin.showOnHome')" width="128" align="center">
              <template #default="{ row }">
                <el-switch :model-value="Boolean(row.showOnHome)"
                  :disabled="!row.showOnHome && homeProductCount >= MAX_HOME_PRODUCTS"
                  :aria-label="$t('admin.showOnHome') + ': ' + field(row, 'title')"
                  @change="setHomeFeatured(row, $event)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('admin.status')" width="140"
              ><template #default="{ row }"
                ><el-tag
                  :type="row.status === 'published' ? 'success' : 'warning'"
                  effect="light"
                  round
                  >{{
                    $t(row.status === "published" ? "admin.published" : "admin.draft")
                  }}</el-tag
                ></template
              ></el-table-column
            >
            <el-table-column prop="date" :label="$t('admin.updated')" width="130"
              ><template #default="{ row }">{{
                row.date || "—"
              }}</template></el-table-column
            >
            <el-table-column :label="$t('admin.actions')" width="150" align="right"
              ><template #default="{ row }"
                ><el-button
                  link
                  type="primary"
                  :icon="Edit"
                  :title="$t('admin.edit')"
                  @click="openEditor(tab, row)" /><el-button
                  link
                  :type="row.status === 'published' ? 'warning' : 'success'"
                  :icon="Promotion"
                  :title="
                    $t(row.status === 'published' ? 'admin.unpublish' : 'admin.publish')
                  "
                  @click="toggle(row, tab)" /><el-button
                  link
                  type="danger"
                  :icon="Delete"
                  :title="$t('admin.delete')"
                  @click="remove(tab, row)" /></template
            ></el-table-column>
          </el-table>
        </el-card>

        <ProjectsManager v-else-if="tab === 'projects'" ref="projectManager" />
        <GlobalReachManager v-else-if="tab === 'global'" ref="globalManager" />
        <CertificationsManager v-else-if="tab === 'certifications'" ref="certManager" />
        <IndustriesManager v-else-if="tab === 'industries'" ref="industryManager" :products="products" />

        <el-card
          v-else-if="tab === 'inquiries'"
          shadow="never"
          class="table-card"
        >
          <template #header
            ><div class="card-heading">
              <div>
                <strong>{{ $t('admin.customerEnquiries') }}</strong
                ><small>{{
                  $t('admin.messagesSubmittedThroughTheWebsiteContactForm')
                }}</small>
              </div>
              <el-tag effect="plain" type="info"
                >{{ inquiries.length }} {{ $t('admin.records') }}</el-tag
              >
            </div></template
          >
          <el-table
            :data="inquiries"
            v-loading="loading"
            row-key="id"
            :empty-text="$t('admin.noEnquiriesReceivedYet')"
          >
            <el-table-column :label="$t('admin.contact')" min-width="190"
              ><template #default="{ row }"
                ><strong>{{ row.name }}</strong
                ><small class="table-sub"
                  >{{ row.email }} · {{ row.phone }}</small
                ></template
              ></el-table-column
            >
            <el-table-column :label="$t('admin.companyAndIndustry')" min-width="190"
              ><template #default="{ row }"
                >{{ row.company
                }}<small class="table-sub"
                  >{{ row.country }} · {{ row.industry }}</small
                ></template
              ></el-table-column
            >
            <el-table-column
              prop="requirements"
              :label="$t('admin.requirements')"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column :label="$t('admin.received')" width="130"
              ><template #default="{ row }">{{
                row.createdAt?.slice(0, 10)
              }}</template></el-table-column
            >
            <el-table-column :label="$t('admin.status')" width="140"
              ><template #default="{ row }"
                ><el-tag
                  :type="row.status === 'new' ? 'warning' : 'success'"
                  class="clickable-tag"
                  @click="
                    updateInquiry(
                      row,
                      row.status === 'new' ? 'contacted' : 'new',
                    )
                  "
                  >{{ $t(row.status === "new" ? "admin.new" : "admin.contacted") }}</el-tag
                ></template
              ></el-table-column
            >
          </el-table>
        </el-card>

        <footer class="admin-footer">
          {{ $t('admin.tzmeContentManagement') }}
          <span>{{ $t('admin.secureWorkspaceV100') }}</span>
        </footer>
      </el-main>
    </el-container>

    <AdminEditorDialog v-model="modal"
      :title="$t(form.id ? (kind === 'products' ? 'admin.editProduct' : 'admin.editArticle') : (kind === 'products' ? 'admin.createProduct' : 'admin.createArticle'))"
      :description="$t(kind === 'products' ? 'admin.productEditorDescription' : 'admin.newsEditorDescription')"
      :icon="kind === 'products' ? 'Box' : 'Document'"
      :width="kind === 'articles' ? 'min(1280px, calc(100vw - 40px))' : 'min(1120px, calc(100vw - 40px))'"
      :status="form.status" :saving="saving" :save-disabled="imageUploading" :editor-fullscreen="editorFullscreen" @save="save">
      <el-form :model="form" label-position="top" class="cms-editor-form" @submit.prevent="save">
        <div class="cms-editor-layout">
          <div class="cms-editor-main">
            <AdminEditorPanel step="01" :title="$t('admin.editorBilingualContent')" :description="$t('admin.editorBilingualDescription')">
              <el-alert class="bilingual-tip" type="info" :closable="false" show-icon
                :title="$t('admin.maintainEnglishAndChineseTogetherBothTitlesAreRequiredBeforeSaving')" />
              <el-tabs v-model="editingLocale" class="bilingual-tabs">
                <el-tab-pane :label="$t('admin.english')" name="en">
                  <div class="cms-field-grid">
                    <el-form-item :label="$t('admin.titleEnglish')" required>
                      <el-input v-model="form.titleEn" :placeholder="$t('admin.enterEnglishTitle')" />
                    </el-form-item>
                    <el-form-item :label="$t('admin.categoryEnglish')">
                      <el-input v-model="form.categoryEn" :placeholder="$t('admin.exampleMining')" />
                    </el-form-item>
                  </div>
                  <el-form-item :label="$t('admin.shortDescriptionEnglish')">
                    <el-input v-model="form.summaryEn" type="textarea" :rows="3" :placeholder="$t('admin.englishSummaryPlaceholder')" />
                  </el-form-item>
                  <el-form-item v-if="kind === 'articles'" :label="$t('admin.articleContentEnglish')">
                    <RichTextEditor v-if="modal && editingLocale === 'en'" :key="'en-' + locale"
                      v-model="form.contentEn" :placeholder="$t('admin.englishArticlePlaceholder')"
                      @uploading="imageUploading = $event" @fullscreen-change="editorFullscreen = $event" />
                  </el-form-item>
                  <template v-if="kind === 'products'">
                    <el-form-item :label="$t('admin.productDescriptionEnglish')">
                      <el-input v-model="form.contentEn" type="textarea" :rows="5" />
                    </el-form-item>
                    <div class="cms-field-grid">
                      <el-form-item :label="$t('admin.productFeaturesEnglish')">
                        <el-input v-model="form.featuresEn" type="textarea" :rows="4" :placeholder="$t('admin.oneItemPerLine')" />
                      </el-form-item>
                      <el-form-item :label="$t('admin.productSpecificationsEnglish')">
                        <el-input v-model="form.specificationsEn" type="textarea" :rows="4" :placeholder="$t('admin.specificationFormat')" />
                      </el-form-item>
                    </div>
                  </template>
                </el-tab-pane>
                <el-tab-pane :label="$t('admin.chinese')" name="zh">
                  <div class="cms-field-grid">
                    <el-form-item :label="$t('admin.titleChinese')" required>
                      <el-input v-model="form.titleZh" :placeholder="$t('admin.enterChineseTitle')" />
                    </el-form-item>
                    <el-form-item :label="$t('admin.categoryChinese')">
                      <el-input v-model="form.categoryZh" :placeholder="$t('admin.exampleMiningChinese')" />
                    </el-form-item>
                  </div>
                  <el-form-item :label="$t('admin.summaryChinese')">
                    <el-input v-model="form.summaryZh" type="textarea" :rows="3" :placeholder="$t('admin.chineseSummaryPlaceholder')" />
                  </el-form-item>
                  <el-form-item v-if="kind === 'articles'" :label="$t('admin.articleChinese')">
                    <RichTextEditor v-if="modal && editingLocale === 'zh'" :key="'zh-' + locale"
                      v-model="form.contentZh" :placeholder="$t('admin.chineseArticlePlaceholder')"
                      @uploading="imageUploading = $event" @fullscreen-change="editorFullscreen = $event" />
                  </el-form-item>
                  <template v-if="kind === 'products'">
                    <el-form-item :label="$t('admin.productDescriptionChinese')">
                      <el-input v-model="form.contentZh" type="textarea" :rows="5" />
                    </el-form-item>
                    <div class="cms-field-grid">
                      <el-form-item :label="$t('admin.productFeaturesChinese')">
                        <el-input v-model="form.featuresZh" type="textarea" :rows="4" :placeholder="$t('admin.oneItemPerLine')" />
                      </el-form-item>
                      <el-form-item :label="$t('admin.productSpecificationsChinese')">
                        <el-input v-model="form.specificationsZh" type="textarea" :rows="4" :placeholder="$t('admin.specificationFormat')" />
                      </el-form-item>
                    </div>
                  </template>
                </el-tab-pane>
              </el-tabs>
            </AdminEditorPanel>
          </div>
          <aside class="cms-editor-aside">
            <AdminEditorPanel step="02" :title="$t('admin.editorDisplaySettings')" :description="$t('admin.editorDisplayDescription')">
              <el-form-item :label="$t('admin.editorDisplayImage')">
                <div class="cms-cover-control">
                  <el-image v-if="form.image" :src="form.image" fit="cover" class="cms-cover-image">
                    <template #error><div class="cms-cover-fallback"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImageError') }}</span></div></template>
                  </el-image>
                  <div v-else class="cms-cover-empty"><el-icon><Picture /></el-icon><span>{{ $t('admin.editorImagePreview') }}</span><small>{{ $t('admin.editorImageHint') }}</small></div>
                  <el-input v-model="form.image" :placeholder="$t('admin.imagePathPlaceholder')" />
                </div>
              </el-form-item>
              <el-form-item v-if="kind === 'products'" :label="$t('admin.productIndustry')" required>
                <el-select v-model="form.industries" multiple filterable collapse-tags collapse-tags-tooltip
                  :placeholder="$t('admin.chooseIndustries')">
                  <el-option v-for="industry in industryRecords" :key="industry.id" :label="industryOptionLabel(industry)" :value="industry.id" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="kind === 'articles'" :label="$t('admin.publicationDate')" required>
                <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" :clearable="false" />
              </el-form-item>
              <el-form-item :label="$t('admin.status2')">
                <el-radio-group v-model="form.status" class="cms-status-options">
                  <el-radio-button value="published">{{ $t('admin.published2') }}</el-radio-button>
                  <el-radio-button value="draft">{{ $t('admin.draft2') }}</el-radio-button>
                </el-radio-group>
                <p class="cms-field-hint">{{ $t(form.status === 'published' ? 'admin.editorPublishedHint' : 'admin.editorDraftHint') }}</p>
              </el-form-item>
            </AdminEditorPanel>
            <AdminEditorPanel v-if="kind === 'products'" step="03" :title="$t('admin.editorHomepageSettings')" :description="$t('admin.homeSelectionHint')">
              <div class="cms-switch-row"><strong>{{ $t('admin.showOnHome') }}</strong><el-switch v-model="form.showOnHome" /></div>
              <p class="cms-home-count">{{ $t('admin.homeSelectionCount', { count: homeProductCount, max: MAX_HOME_PRODUCTS }) }}</p>
              <el-form-item v-if="form.showOnHome" :label="$t('admin.homeDisplayOrder')">
                <el-input-number v-model="form.homeOrder" :min="1" :max="999" controls-position="right" />
              </el-form-item>
            </AdminEditorPanel>
          </aside>
        </div>
      </el-form>
    </AdminEditorDialog>
  </el-container>
</template>

<style>
.admin-shell {
  --el-color-primary: #2f74d0;
  min-height: 100vh;
  background: #f4f6f9;
  color: #16212d;
  font-family: Inter, "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: 13px;
  line-height: 1.5;
}
.admin-sidebar {
  height: 100vh;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 5;
  background: #111e2b;
  color: #cbd5df;
  padding: 22px 14px;
  display: flex;
  flex-direction: column;
}
.admin-brand {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 9px 25px;
  color: #f4f8fc;
  text-decoration: none;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.12em;
}
.admin-brand-mark {
  height: 32px;
  width: 32px;
  display: grid;
  place-items: center;
  border-radius: 5px;
  background: #e96727;
  color: #fff;
  font-size: 14px;
}
.admin-brand small {
  display: block;
  color: #718093;
  font-size: 8px;
  letter-spacing: 0.19em;
}
.admin-menu-label {
  padding: 17px 10px 8px;
  color: #8190a1;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.15em;
}
.admin-menu.el-menu {
  border: 0;
  background: transparent;
}
.admin-menu .el-menu-item {
  height: 42px;
  margin: 3px 0;
  border-radius: 5px;
  color: #aab6c3;
  font-size: 12px;
}
.admin-menu .el-menu-item .el-icon {
  font-size: 16px;
  color: #8493a4;
}
.admin-menu .el-menu-item:hover {
  background: #1a2a3a;
  color: #fff;
}
.admin-menu .el-menu-item.is-active {
  background: #233a50;
  color: #fff;
}
.admin-menu .el-menu-item.is-active .el-icon {
  color: #71b5fa;
}
.menu-badge {
  margin-left: auto;
}
.menu-badge .el-badge__content {
  border: 0;
}
.admin-sidebar-foot {
  margin-top: auto;
  border-top: 1px solid #293745;
  padding: 14px 8px 2px;
  font-size: 10px;
  color: #94a2b1;
}
.online-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 7px;
  border-radius: 50%;
  background: #37bd87;
}
.admin-sidebar-foot .el-link {
  margin: 12px 0 0 12px;
  color: #c0cbd5;
  font-size: 10px;
}
.admin-sidebar-foot .el-link .el-icon {
  margin-right: 6px;
}
.admin-main {
  min-height: 100vh;
  margin-left: 244px;
}
.admin-topbar.el-header {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
  background: #fff;
  border-bottom: 1px solid #e9edf2;
}
.admin-topbar .el-breadcrumb {
  font-size: 11px;
}
.admin-topbar .el-breadcrumb__inner {
  color: #687686 !important;
  font-weight: 500 !important;
}
.admin-profile {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #344354;
  font-size: 11px;
}
.admin-profile small {
  display: block;
  color: #9aa5b1;
  font-size: 9px;
}
.admin-profile .admin-avatar {
  background: #e5eefb;
  color: #3378c9;
  font-weight: 700;
}
.admin-profile .el-button {
  margin-left: 5px;
  color: #768797;
}
.admin-content.el-main {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 34px 38px 12px;
  overflow: visible;
}
.admin-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}
.admin-eyebrow {
  color: #718297;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.15em;
}
.admin-heading h1 {
  margin: 5px 0 3px;
  color: #16212d;
  font-size: 27px;
  font-weight: 690;
  letter-spacing: -0.04em;
}
.admin-heading p {
  margin: 0;
  color: #8995a1;
  font-size: 11px;
}
.admin-actions {
  display: flex;
  gap: 9px;
}
.admin-actions .el-button {
  height: 34px;
  font-size: 11px;
}
.stat-grid {
  row-gap: 14px;
}
.stat-card.el-card,
.dashboard-card.el-card,
.table-card.el-card {
  border: 1px solid #e8edf2;
  border-radius: 6px;
}
.stat-card .el-card__body {
  padding: 17px 18px;
  min-height: 125px;
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-label {
  color: #82909d;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.085em;
}
.stat-icon {
  width: 29px;
  height: 29px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  font-size: 15px;
}
.stat-icon.blue {
  background: #eaf2ff;
  color: #3d7ed0;
}
.stat-icon.violet {
  background: #f1edff;
  color: #7660cd;
}
.stat-icon.orange {
  background: #fff2e8;
  color: #df8242;
}
.stat-icon.green {
  background: #e7f7f0;
  color: #35a879;
}
.stat-card strong {
  display: block;
  margin-top: 6px;
  color: #263544;
  font-size: 25px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: -0.04em;
}
.stat-card strong.status-good {
  font-size: 20px;
  color: #28a774;
  margin-top: 10px;
}
.stat-hint {
  margin-top: 8px;
  color: #98a3af;
  font-size: 10px;
}
.dashboard-panels {
  margin-top: 15px;
  row-gap: 15px;
}
.dashboard-card .el-card__header,
.table-card .el-card__header {
  padding: 15px 18px;
  border-bottom: 1px solid #edf0f4;
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.card-heading strong {
  display: block;
  color: #263544;
  font-size: 13px;
  font-weight: 650;
}
.card-heading small {
  display: block;
  margin-top: 3px;
  color: #8995a1;
  font-size: 10px;
  font-weight: 400;
}
.card-heading .el-button {
  font-size: 10px;
}
.mini-inquiry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}
.inquiry-summary {
  flex: 1;
  min-width: 0;
}
.inquiry-summary strong,
.inquiry-summary small {
  display: block;
}
.inquiry-summary strong {
  font-size: 10px;
  font-weight: 650;
}
.inquiry-summary small,
.mini-inquiry time {
  overflow: hidden;
  color: #909ba7;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quick-card .el-card__body {
  padding: 4px 17px 10px;
}
.quick-action.el-button,
.quick-action.el-link {
  display: flex;
  width: 100%;
  height: auto;
  justify-content: flex-start;
  margin: 0;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
  text-align: left;
}
.quick-action:last-child {
  border-bottom: 0;
}
.quick-action > .el-icon:first-child {
  margin-right: 10px;
  color: #4d83c4;
  font-size: 16px;
}
.quick-action > span {
  flex: 1;
}
.quick-action b,
.quick-action small {
  display: block;
}
.quick-action b {
  color: #344354;
  font-size: 10px;
  font-weight: 650;
}
.quick-action small {
  margin-top: 2px;
  color: #929da8;
  font-size: 9px;
}
.quick-action .quick-arrow {
  color: #9aa6b2;
}
.content-overview {
  margin-top: 15px;
}
.overview-item {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #edf0f4;
  border-radius: 4px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.overview-item > span {
  display: block;
  color: #768391;
  font-size: 10px;
}
.overview-item > strong {
  display: block;
  margin: 7px 0 10px;
  color: #293747;
  font-size: 18px;
  font-weight: 650;
}
.overview-item > strong small {
  color: #9ca6b0;
  font-size: 10px;
  font-weight: 400;
}
.table-card .el-card__body {
  padding: 0;
}
.table-card .el-table {
  font-size: 11px;
}
.table-card .el-table th.el-table__cell {
  height: 38px;
  background: #fafbfd;
  color: #84919e;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.table-card .el-table td.el-table__cell {
  padding: 12px 0;
}
.content-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}
.content-image {
  height: 36px;
  width: 50px;
  flex: none;
  border-radius: 3px;
  background: #eef1f4;
}
.image-fallback {
  height: 100%;
  display: grid;
  place-items: center;
  color: #9aa6b2;
}
.content-cell strong {
  display: block;
  color: #293747;
  font-size: 10px;
  font-weight: 650;
}
.content-cell small,
.table-sub {
  display: block;
  max-width: 320px;
  margin-top: 3px;
  overflow: hidden;
  color: #98a2ad;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.table-sub {
  max-width: none;
}
.clickable-tag {
  cursor: pointer;
}
.admin-footer {
  display: flex;
  justify-content: space-between;
  padding: 20px 0 10px;
  color: #a1aab4;
  font-size: 8px;
  letter-spacing: 0.08em;
}
.admin-footer span {
  letter-spacing: 0;
}
.full-width {
  width: 100%;
}
.el-message-box {
  max-width: calc(100vw - 32px);
}
@media (max-width: 1050px) {
  .admin-sidebar {
    width: 205px;
  }
  .admin-main {
    margin-left: 205px;
  }
  .admin-content.el-main {
    padding: 26px 22px 10px;
  }
}
@media (max-width: 680px) {
  .admin-sidebar {
    width: 58px;
    padding: 18px 6px;
  }
  .admin-brand {
    padding: 0 5px 22px;
  }
  .admin-brand > span:not(.admin-brand-mark),
  .admin-menu-label,
  .admin-menu .el-menu-item span,
  .admin-sidebar-foot {
    display: none;
  }
  .admin-menu .el-menu-item {
    justify-content: center;
    padding: 0 !important;
  }
  .admin-menu .el-menu-item .el-icon {
    margin: 0;
  }
  .admin-main {
    margin-left: 58px;
  }
  .admin-topbar.el-header {
    height: 54px !important;
    padding: 0 12px;
  }
  .admin-content.el-main {
    padding: 22px 12px 8px;
  }
  .admin-heading {
    align-items: flex-start;
  }
  .admin-heading h1 {
    font-size: 23px;
  }
  .admin-heading p {
    max-width: 190px;
    font-size: 9px;
  }
  .admin-actions {
    flex-direction: column;
    gap: 4px;
  }
  .admin-actions .el-button {
    margin: 0;
    padding: 0 8px;
    font-size: 9px;
  }
  .admin-profile > div {
    display: none;
  }
  .admin-footer {
    font-size: 7px;
  }
  .table-card .el-card__body {
    overflow: auto;
  }
}
.admin-profile .admin-language {
  display: flex;
  margin-right: 12px;
}
.admin-profile .admin-language .el-button {
  margin: 0;
  padding: 0 10px;
}
.bilingual-tip {
  margin-bottom: 14px;
}
.bilingual-tabs .el-tab-pane {
  padding-top: 8px;
}
.bilingual-badges {
  display: flex;
  gap: 4px;
  margin-top: 5px;
}
.bilingual-badges .el-tag {
  height: 17px;
  font-size: 9px;
}
</style>
