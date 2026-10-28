package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.auth.*;
import com.tzme.cms.model.*;
import com.tzme.cms.repository.*;
import java.nio.file.*;
import java.util.*;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:seo;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=",
        "tzme.admin.password=",
        "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class SeoIntegrationTest {
    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper mapper;
    @Autowired
    SiteSettingsRepository settings;
    @Autowired
    ContentRepository content;
    @Autowired
    IndustryRepository industries;
    @Autowired
    AdminAccountRepository accounts;
    @Autowired
    SeoSettingsService seo;
    @Autowired
    SeoPageService pages;
    @Autowired
    PublicSiteData data;
    static final Path FRONTEND;
    static {
        try {
            FRONTEND = Files.createTempDirectory("tzme-seo-test");
        } catch (Exception error) {
            throw new ExceptionInInitializerError(error);
        }
    }

    @DynamicPropertySource
    static void frontend(DynamicPropertyRegistry properties) {
        properties.add("tzme.frontend-dir", FRONTEND::toString);
    }

    private AdminAccount editor;

    @BeforeEach
    void setup() throws Exception {
        settings.deleteAll();
        content.deleteAll();
        industries.deleteAll();
        accounts.deleteAll();
        Files.writeString(FRONTEND.resolve("index.html"),
                "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><!--site:head:start--><title>old</title><!--site:head:end--></head><body><div id=\"app\"><!--site:body--></div><!--site:bootstrap--></body></html>");
        setting("website",
                mapper.readTree("{\"translations\":{\"zh\":{}},\"assets\":{},\"values\":{},\"mapCountries\":[]}"));
        setting("contact", mapper.readTree(
                "{\"contact\":{\"address\":{\"zh\":\"天津测试地址\"},\"phone\":\"022-12345678\",\"emails\":[\"test@example.invalid\"],\"facility\":{\"title\":{\"zh\":\"天津总部\"},\"description\":{\"zh\":\"总部资料\"}}},\"subsidiaries\":[],\"form\":{},\"upload\":{},\"notification\":{\"enabled\":false,\"smtp\":{\"password\":\"PRIVATE-SMTP-SENTINEL\"}}}"));
        setting("about-tzme", mapper.readTree(
                "{\"home\":{\"description\":{\"zh\":\"制造与交付服务\"}},\"about\":{\"titleLine1\":{\"zh\":\"中国制造，\"},\"titleLine2\":{\"zh\":\"服务全球工程。\"},\"description\":{\"zh\":\"公司公开介绍\"},\"description2\":{\"zh\":\"生产基地与产品资料\"}}}"));
        industries.saveAndFlush(
                mapper.readValue("{\"id\":\"ports\",\"titleEn\":\"Ports\",\"titleZh\":\"港口\",\"status\":\"published\"}",
                        Industry.class));
        product("ship-unloader", "测试卸船机", "published");
        product("secret-draft", "PRIVATE-DRAFT-SENTINEL", "draft");
        product("removed-product", "PRIVATE-DELETED-SENTINEL", "deleted");
        var article = mapper.readValue(
                "{\"id\":\"delivery-news\",\"type\":\"articles\",\"title\":\"交付资讯\",\"titleZh\":\"交付资讯\",\"summaryZh\":\"公开交付动态\",\"contentZh\":\"<p>交付正文与真实现场资料。</p>\",\"date\":\"2026-10-01\",\"status\":\"published\"}",
                Content.class);
        content.saveAndFlush(article);
        editor = new AdminAccount();
        editor.username = "seo-editor";
        editor.displayName = "测试编辑";
        editor.passwordHash = "unused-test-value";
        editor.mustChangePassword = false;
        editor = accounts.saveAndFlush(editor);
    }

    private void setting(String id, JsonNode value) throws Exception {
        var row = new SiteSettings();
        row.setId(id);
        row.setConfiguration(mapper.writeValueAsString(value));
        settings.saveAndFlush(row);
    }

    private Content product(String id, String title, String status) throws Exception {
        var node = mapper.createObjectNode();
        node.put("id", id);
        node.put("type", "products");
        node.put("title", title);
        node.put("titleZh", title);
        node.put("summaryZh", "用于港口物料卸船，依据图纸制造与检验。");
        node.put("contentZh", "公开的设备制造介绍。");
        node.put("specificationsZh", "供货范围：结构制造与装配\n检验要求：按项目确认");
        node.put("status", status);
        node.putArray("industries").add("ports");
        return content.saveAndFlush(mapper.treeToValue(node, Content.class));
    }

    @Test
    void sourcePartnersAreReadableAndPresentInInitialHtml() throws Exception {
        mvc.perform(get("/api/partners")).andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(24))
                .andExpect(jsonPath("$.items[0].name").value("Metso"));
        mvc.perform(get("/")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<section id=\"partners\"")));
        mvc.perform(get("/about")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<section id=\"partners\"")));
    }

    @Test
    void initialHtmlContainsReusableMetadataAndResponsiveImages() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/api/seo/page")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("srcset=\"/assets/optimized/")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("harbor-overhead-v2-")));
    }

    @Test
    void displayImageOptimizationPreservesOriginalArticleAttachments() throws Exception {
        var article = content.findByIdAndType("delivery-news", "articles").orElseThrow();
        article.setImage("/assets/tzme-j/factories/greenland-aerial.jpg");
        article.setContentZh(
                "<p><img src=\"/assets/tzme-j/factories/greenland-aerial.jpg\" alt=\"制造基地\"></p><p><a href=\"/assets/tzme-newsroom/documents/brochure-zh-en-01.pdf\">产品资料</a></p>");
        content.saveAndFlush(article);
        mvc.perform(get("/insights/delivery-news")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("greenland-aerial-")))
                .andExpect(content().string(
                        org.hamcrest.Matchers.containsString("/assets/tzme-newsroom/documents/brochure-zh-en-01.pdf")));
        assertThat(content.findByIdAndType("delivery-news", "articles").orElseThrow().getContentZh())
                .contains("/assets/tzme-j/factories/greenland-aerial.jpg");
        assertThat(content.findByIdAndType("delivery-news", "articles").orElseThrow().getContentZh())
                .contains("href=\"/assets/tzme-newsroom/documents/brochure-zh-en-01.pdf\"");
    }

    @Test
    void partnersCanBeMaintainedByAnOrdinaryAdministratorWithoutOverwritingOtherData() throws Exception {
        var input = mapper.readTree(mvc.perform(get("/api/partners")).andReturn().getResponse().getContentAsString());
        ((ObjectNode) input).put("title", "测试合作伙伴").put("showOnHome", false);
        ((ObjectNode) input.path("items").get(0)).put("enabled", false);
        mvc.perform(put("/api/partners").with(authentication(editorAuthentication())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(input)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/partners")).andExpect(jsonPath("$.title").value("测试合作伙伴"))
                .andExpect(jsonPath("$.items[0].enabled").value(false));
        mvc.perform(get("/")).andExpect(content()
                .string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("<section id=\"partners\""))));
        assertThat(content.findAllByTypeOrderByDateDesc("products")).hasSize(3);
    }

    @Test
    void partnerWritesRequireLoginAndValidateLocalLogoImages() throws Exception {
        var input = mapper.readTree(mvc.perform(get("/api/partners")).andReturn().getResponse().getContentAsString());
        mvc.perform(put("/api/partners").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(input))).andExpect(status().isUnauthorized());
        for (String image : List.of("https://example.invalid/logo.png", "/assets/../private.png", "javascript:alert(1)",
                "")) {
            ((ObjectNode) input.path("items").get(0)).put("image", image);
            mvc.perform(put("/api/partners").with(authentication(editorAuthentication())).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(input)))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/partners"))
                .andExpect(jsonPath("$.items[0].image").value("/assets/tzme-partners/partner-27.png"));
    }

    private org.springframework.security.core.Authentication editorAuthentication() {
        return UsernamePasswordAuthenticationToken.authenticated(AdminPrincipal.from(editor), null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    @Test
    void explicitArticleOrderIsSharedByThePublicApiAndSearchDocuments() throws Exception {
        var first = mapper.readValue(
                "{\"id\":\"source-first\",\"type\":\"articles\",\"title\":\"原站第一篇\",\"titleZh\":\"原站第一篇\",\"homeOrder\":1,\"date\":\"2025-01-01\",\"status\":\"published\"}",
                Content.class);
        var second = mapper.readValue(
                "{\"id\":\"source-second\",\"type\":\"articles\",\"title\":\"原站第二篇\",\"titleZh\":\"原站第二篇\",\"homeOrder\":2,\"date\":\"2026-12-01\",\"status\":\"published\"}",
                Content.class);
        var draft = mapper.readValue(
                "{\"id\":\"source-draft\",\"type\":\"articles\",\"title\":\"未发布资讯\",\"homeOrder\":1,\"status\":\"draft\"}",
                Content.class);
        content.saveAllAndFlush(List.of(first, second, draft));
        mvc.perform(get("/api/articles")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("source-first"))
                .andExpect(jsonPath("$[1].id").value("source-second"))
                .andExpect(jsonPath("$[2].id").value("delivery-news")).andExpect(jsonPath("$.length()").value(3));
        assertThat(data.read().articles()).extracting(Content::getId).containsExactly("source-first", "source-second",
                "delivery-news");
        var productIds = content.findAllByTypeOrderByDateDesc("products").stream().map(Content::getId).toList();
        assertThat(content.findAllForDisplay("products")).extracting(Content::getId)
                .containsExactlyElementsOf(productIds);
    }

    @Test
    void creatingNewsWithoutACoverIsRejectedForDraftsAndPublishedArticles() throws Exception {
        for (String state : List.of("draft", "published"))
            for (int variant = 0; variant < 4; variant++) {
                var input = mapper.createObjectNode();
                input.put("id", "missing-cover-" + state + "-" + variant);
                input.put("titleZh", "必须有封面的资讯");
                input.put("date", "2026-10-27");
                input.put("status", state);
                if (variant == 1)
                    input.putNull("image");
                else if (variant == 2)
                    input.put("image", "");
                else if (variant == 3)
                    input.put("image", " \t\n");
                mvc.perform(post("/api/articles").with(authentication(editorAuthentication())).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(input.toString()))
                        .andExpect(status().isBadRequest());
                assertThat(content.findByIdAndType(input.path("id").asText(), "articles")).isEmpty();
            }
    }

    @Test
    void aRejectedCoverUpdateDoesNotChangeAnyExistingNewsFields() throws Exception {
        var article = content.findByIdAndType("delivery-news", "articles").orElseThrow();
        article.setImage("/assets/original-news.jpg");
        article.setCategoryZh("公司新闻1");
        content.saveAndFlush(article);
        for (int variant = 0; variant < 4; variant++) {
            var input = mapper.createObjectNode();
            input.put("titleZh", "这次修改不应保存");
            input.put("categoryZh", "不可保存的分类");
            input.put("date", "2026-10-27");
            input.put("status", "draft");
            if (variant == 1)
                input.putNull("image");
            else if (variant == 2)
                input.put("image", "");
            else if (variant == 3)
                input.put("image", " \t\n");
            mvc.perform(put("/api/articles/delivery-news").with(authentication(editorAuthentication())).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(input.toString()))
                    .andExpect(status().isBadRequest());
            var saved = content.findByIdAndType("delivery-news", "articles").orElseThrow();
            assertThat(saved.getTitleZh()).isEqualTo("交付资讯");
            assertThat(saved.getImage()).isEqualTo("/assets/original-news.jpg");
            assertThat(saved.getCategoryZh()).isEqualTo("公司新闻1");
            assertThat(saved.getStatus()).isEqualTo("published");
        }
    }

    @Test
    void newsWithACoverCanBeCreatedAsDraftOrPublished() throws Exception {
        for (String state : List.of("draft", "published")) {
            var input = mapper.createObjectNode();
            input.put("id", "covered-" + state);
            input.put("titleZh", "有封面的资讯");
            input.put("date", "2026-10-27");
            input.put("status", state);
            input.put("image", "/assets/news-cover.jpg");
            mvc.perform(post("/api/articles").with(authentication(editorAuthentication())).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(input.toString())).andExpect(status().isCreated())
                    .andExpect(jsonPath("image").value("/assets/news-cover.jpg"));
            assertThat(content.findByIdAndType("covered-" + state, "articles").orElseThrow().getStatus())
                    .isEqualTo(state);
        }
    }

    @Test
    void aNewsCoverCanBeReplacedAlongWithOtherEdits() throws Exception {
        var input = mapper.createObjectNode();
        input.put("titleZh", "新的资讯标题");
        input.put("date", "2026-10-27");
        input.put("status", "published");
        input.put("image", "/assets/replaced-news-cover.jpg");
        mvc.perform(put("/api/articles/delivery-news").with(authentication(editorAuthentication())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(input.toString())).andExpect(status().isOk())
                .andExpect(jsonPath("image").value("/assets/replaced-news-cover.jpg"))
                .andExpect(jsonPath("titleZh").value("新的资讯标题"));
    }

    @Test
    void publicHtmlContainsReadableProductContentWithoutExecutingJavaScript() throws Exception {
        String html = mvc.perform(get("/solutions/ship-unloader")).andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/html")).andReturn().getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(html).contains("<h1>测试卸船机</h1>", "公开的设备制造介绍。", "结构制造与装配",
                "https://www.tzme.net/solutions/ship-unloader", "application/ld+json", "id=\"site-bootstrap\"");
        assertThat(html).doesNotContain("PRIVATE-SMTP-SENTINEL", "PRIVATE-DRAFT-SENTINEL", "PRIVATE-DELETED-SENTINEL",
                "/api/admin/accounts", "passwordHash");
    }

    @Test
    void peopleAndCrawlersReceiveTheSameContent() throws Exception {
        var first = mvc.perform(get("/about").header("User-Agent", "Mozilla/5.0")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        var second = mvc.perform(get("/about").header("User-Agent", "Baiduspider")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(first).isEqualTo(second);
    }

    @Test
    void siteMapContainsOnlyPublishedPagesAndActiveIndustries() throws Exception {
        var response = mvc.perform(get("/sitemap.xml")).andExpect(status().isOk()).andReturn().getResponse();
        String xml = response.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        var factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        var parsed = factory.newDocumentBuilder().parse(new ByteArrayInputStream(response.getContentAsByteArray()));
        assertThat(parsed.getElementsByTagName("loc").getLength()).isEqualTo(9);
        assertThat(xml).contains("https://www.tzme.net/solutions?industry=ports", "/insights/delivery-news")
                .doesNotContain("secret-draft", "removed-product", "/admin", "/projects", "<lastmod>");
    }

    @Test
    void unknownAndUnpublishedPagesReturn404AndLegacyPathsRedirect() throws Exception {
        for (String path : List.of("/not-a-page", "/solutions/secret-draft", "/solutions/removed-product",
                "/insights/missing"))
            mvc.perform(get(path)).andExpect(status().isNotFound())
                    .andExpect(header().string("X-Robots-Tag", "noindex,follow"));
        mvc.perform(get("/solutions/ports/ship-unloader")).andExpect(status().isMovedPermanently())
                .andExpect(header().string("Location", "/solutions/ship-unloader"));
        mvc.perform(get("/about/")).andExpect(status().isMovedPermanently())
                .andExpect(header().string("Location", "/about"));
    }

    @Test
    void trackingAndFiltersHaveCorrectCanonicalAndIndexingPolicies() throws Exception {
        var normal = pages.document("/solutions/ship-unloader?from=%2Fsolutions&utm_source=baidu").page();
        assertThat(normal.indexable()).isTrue();
        assertThat(normal.url()).isEqualTo("https://www.tzme.net/solutions/ship-unloader");
        var industry = pages.document("/solutions?industry=ports").page();
        assertThat(industry.indexable()).isTrue();
        assertThat(industry.canonicalPath()).isEqualTo("/solutions?industry=ports");
        for (String path : List.of("/solutions?q=test", "/solutions?industry=ports&cat=test", "/about?admin-preview=1",
                "/projects", "/admin/login"))
            assertThat(pages.document(path).page().indexable()).isFalse();
    }

    @Test
    void editingPublishedContentUpdatesHtmlAndUnpublishingRemovesItImmediately() throws Exception {
        var product = content.findByIdAndType("ship-unloader", "products").orElseThrow();
        product.setSummaryZh("最新的公开设备介绍");
        content.saveAndFlush(product);
        mvc.perform(get("/solutions/ship-unloader")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("最新的公开设备介绍")));
        product = content.findByIdAndType("ship-unloader", "products").orElseThrow();
        product.setStatus("draft");
        content.saveAndFlush(product);
        mvc.perform(get("/solutions/ship-unloader")).andExpect(status().isNotFound());
        mvc.perform(get("/sitemap.xml")).andExpect(content()
                .string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("/solutions/ship-unloader"))));
    }

    @Test
    void structuredDataContainsRealProductsAndVisibleQuestionsWithoutInventedCommercialClaims() {
        var document = pages.document("/solutions/ship-unloader");
        var graph = document.page().structuredData().path("@graph");
        assertThat(graph.findValuesAsText("@type")).contains("Organization", "Product", "BreadcrumbList", "FAQPage");
        assertThat(graph.findValuesAsText("offers")).isEmpty();
        assertThat(graph.findValuesAsText("aggregateRating")).isEmpty();
        var faq = java.util.stream.StreamSupport.stream(graph.spliterator(), false)
                .filter(node -> "FAQPage".equals(node.path("@type").asText())).findFirst().orElseThrow();
        assertThat(faq.path("mainEntity").size()).isEqualTo(document.page().faqs().size());
        for (var question : document.page().faqs())
            assertThat(faq.toString()).contains(question.question(), question.answer());
    }

    @Test
    void ordinaryAdministratorsCanSaveSeoButAnonymousRequestsCannot() throws Exception {
        ObjectNode value = seo.get();
        ((ObjectNode) value.path("pages").path("/contact")).put("title", "定制的联系页面标题");
        ((ObjectNode) value.path("verification")).put("baidu", "verified_token");
        mvc.perform(put("/api/seo/settings/admin").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(value.toString())).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/seo/settings/admin").with(authentication(editorAuthentication())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(value.toString())).andExpect(status().isOk());
        mvc.perform(get("/contact"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("<title>定制的联系页面标题</title>")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("verified_token")));
    }

    @Test
    void invalidDomainAndVerificationMarkupAreRejected() throws Exception {
        for (String url : List.of("javascript:alert(1)", "https://user:pass@www.tzme.net", "https://www.tzme.net/other",
                "http://www.tzme.net")) {
            var value = seo.get();
            value.put("siteUrl", url);
            assertThatThrownBy(() -> seo.save(value))
                    .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        }
        var value = seo.get();
        value.with("verification").put("baidu", "<meta name=x>");
        assertThatThrownBy(() -> seo.save(value))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test
    void pageOverridesAndScriptLikeTextDoNotLeakPrivateContentOrExecute() throws Exception {
        var value = seo.get();
        value.with("overrides").putObject("/solutions/secret-draft").put("title", "PRIVATE-OVERRIDE-SENTINEL")
                .put("description", "draft information");
        ((ObjectNode) value.path("pages").path("/contact")).put("title", "</title><script>alert('x')</script>");
        seo.save(value);
        String html = mvc.perform(get("/contact")).andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(html).doesNotContain("<script>alert", "PRIVATE-OVERRIDE-SENTINEL");
        mvc.perform(get("/api/seo/settings")).andExpect(jsonPath("overrides").doesNotExist())
                .andExpect(jsonPath("pages").doesNotExist());
        assertThat(pages.document("/solutions/secret-draft").page().title())
                .doesNotContain("PRIVATE-OVERRIDE-SENTINEL");
    }

    @Test
    void discoveryFilesContainChinesePublicFactsAndExcludePrivateRecords() throws Exception {
        mvc.perform(get("/robots.txt")).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Allow: /api/uploads/images/")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("https://www.tzme.net/sitemap.xml")));
        String text = mvc.perform(get("/llms.txt")).andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(text).contains("公司公开介绍", "公开页面索引", "制造服务常见问题", "/solutions/ship-unloader")
                .doesNotContain("PRIVATE-SMTP-SENTINEL", "PRIVATE-DRAFT-SENTINEL", "PRIVATE-DELETED-SENTINEL");
    }

    @Test
    void questionsSupportParagraphsAndCanBeDisabled() {
        var value = seo.get();
        ((ObjectNode) value.path("faqs").get(0)).put("answer", "第一段制造说明。\n第二段检验要求。");
        seo.save(value);
        assertThat(pages.document("/solutions/ship-unloader").page().faqs().get(1).answer()).contains("\n第二段检验要求。");
        value = seo.get();
        value.put("faqEnabled", false);
        seo.save(value);
        var page = pages.document("/solutions/ship-unloader").page();
        assertThat(page.faqs()).isEmpty();
        assertThat(page.structuredData().findValuesAsText("@type")).doesNotContain("FAQPage");
    }

    @Test
    void serverUses503IfFrontendTemplateIsMissingInsteadOfIndexingAnEmptyPage() throws Exception {
        Files.writeString(FRONTEND.resolve("index.html"), "<div id=app></div>");
        mvc.perform(get("/about")).andExpect(status().isServiceUnavailable())
                .andExpect(header().string("X-Robots-Tag", "noindex,nofollow"));
    }
}
