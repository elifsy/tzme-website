package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.tzme.cms.model.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class SeoPageService {
    public static final String COMPANY = "天津重钢机械装备股份有限公司";
    public static final String LOGO = "/assets/tzme-j/brand/official-mark.jpg";
    public static final String HARBOR = "/assets/tzme-j/banners/harbor-overhead-v2.webp";
    private final SeoSettingsService settings;
    private final PublicSiteData data;
    private final ObjectMapper mapper;
    public SeoPageService(SeoSettingsService settings, PublicSiteData data, ObjectMapper mapper) { this.settings = settings; this.data = data; this.mapper = mapper; }
    public record Faq(String question, String answer) {}
    public record Link(String path, String title) {}
    public record Page(String path, String canonicalPath, String url, String kind, String heading, String title,
        String description, String image, String robots, int status, boolean indexable, List<Faq> faqs, JsonNode structuredData) {}
    public record Document(Page page, PublicSiteData.Snapshot data, ObjectNode configuration, Content record, Industry industry) {}
    public Document document(String target) {
        var snapshot = data.read(); var config = settings.get();
        return document(target, snapshot, config);
    }
    public Document document(String target, PublicSiteData.Snapshot snapshot, ObjectNode config) {
        String path = "/", kind = "missing", canonicalPath = "/", heading = "页面未找到", image = HARBOR;
        String description = config.path("defaultDescription").asText();
        int status = 404; boolean indexable = false; Content record = null; Industry industry = null;
        Map<String,String> query = new LinkedHashMap<>();
        try {
            if (target == null || target.length() > 3000 || !target.startsWith("/") || target.startsWith("//")) throw new IllegalArgumentException();
            var uri = URI.create(target); path = uri.getPath();
            if (path.length() > 1 && path.endsWith("/")) path = path.substring(0,path.length()-1);
            if (uri.getRawQuery() != null) for (String pair : uri.getRawQuery().split("&")) {
                String[] parts = pair.split("=",2); query.put(URLDecoder.decode(parts[0], StandardCharsets.UTF_8), parts.length == 2 ? URLDecoder.decode(parts[1], StandardCharsets.UTF_8) : "");
            }
        } catch (Exception error) { path = "/404"; }
        canonicalPath = path;
        var mainPages = Map.of("/", "非标机械装备制造", "/about", "关于重钢机械", "/solutions", "产品中心与行业装备", "/insights", "新闻资讯", "/contact", "联系我们", "/site-map", "网站地图");
        if (mainPages.containsKey(path)) {
            status = 200; indexable = true; heading = mainPages.get(path);
            kind = Map.of("/","home","/about","about","/solutions","catalog","/insights","news","/contact","contact","/site-map","map").get(path);
            description = value(config.path("pages").path(path).path("description").asText(), description);
            if (path.equals("/about")) image = value(snapshot.about().path("about").path("image").asText(), image);
            if (path.equals("/solutions") && query.containsKey("industry")) {
                String id = query.get("industry");
                industry = snapshot.industries().stream().filter(item -> item.getId().equals(id) && snapshot.products().stream().anyMatch(product -> product.getIndustries().contains(id))).findFirst().orElse(null);
                if (industry != null) {
                    kind = "industry"; heading = value(industry.getTitleZh(), industry.getTitleEn()) + "装备";
                    canonicalPath = "/solutions?industry=" + industry.getId();
                    description = heading + "与产品资料：" + String.join("、", snapshot.products().stream().filter(product -> product.getIndustries().contains(id)).map(SeoPageService::name).toList()) + "。依据客户图纸与技术要求，沟通制造、质量检验与交付需求。";
                } else indexable = false;
            }
        } else if (path.matches("/solutions/(?:[A-Za-z0-9_-]+/)?[A-Za-z0-9_-]+")) {
            String id = path.substring(path.lastIndexOf('/') + 1); if (id.equals("ship-loader")) id = "bulk-ship-loader";
            final String wanted = id;
            record = snapshot.products().stream().filter(item -> item.getId().equals(wanted)).findFirst().orElse(null);
            if (record != null) {
                kind = "product"; status = 200; indexable = true; heading = name(record); canonicalPath = "/solutions/" + record.getId();
                description = value(summary(record), plain(record.getContentZh()), description); image = value(record.getImage(), record.getPresentationImage(), image);
            }
        } else if (path.matches("/insights/[A-Za-z0-9_-]+")) {
            String id = path.substring(path.lastIndexOf('/') + 1);
            record = snapshot.articles().stream().filter(item -> item.getId().equals(id)).findFirst().orElse(null);
            if (record != null) { kind = "article"; status = 200; indexable = true; heading = name(record); description = value(summary(record), plain(record.getContentZh()), description); image = value(record.getImage(), image); }
        } else if (path.equals("/projects") || path.startsWith("/projects/")) {
            kind = "hidden"; heading = "项目资料"; status = 200; description = "项目资料请通过官网联系入口沟通确认。";
        } else if (path.equals("/admin") || path.startsWith("/admin/")) { kind = "admin"; heading = "管理后台登录"; status = 200; }
        if (!query.isEmpty()) {
            var remaining = new HashMap<>(query); if (kind.equals("industry")) remaining.remove("industry");
            remaining.keySet().removeIf(key -> key.equals("from") || key.startsWith("utm_") || Set.of("gclid","bd_vid").contains(key));
            if (!remaining.isEmpty()) indexable = false; // Search, facets, pagination and previews do not create duplicate indexed pages.
        }
        String title = heading + " - " + config.path("siteName").asText();
        if (mainPages.containsKey(path) && !kind.equals("industry")) title = value(config.path("pages").path(path).path("title").asText(), title);
        if (kind.equals("product")) title = heading + "｜设备介绍与制造服务 - " + config.path("siteName").asText();
        var override = status == 200 && !Set.of("admin","hidden").contains(kind) ? config.path("overrides").path(canonicalPath) : mapper.createObjectNode();
        title = value(override.path("title").asText(), title); description = value(override.path("description").asText(), description);
        description = truncate(plain(description), 220);
        String url = config.path("siteUrl").asText() + canonicalPath;
        String robots = indexable ? "index,follow,max-image-preview:large" : kind.equals("admin") ? "noindex,nofollow,noarchive" : "noindex,follow";
        var faqs = faqs(kind, record, industry, snapshot, config);
        var schema = schema(kind, heading, description, url, image, record, faqs, snapshot, config, status);
        return new Document(new Page(path, canonicalPath, url, kind, heading, title, description, image, robots, status, indexable, faqs, schema), snapshot, config, record, industry);
    }
    public List<Link> links(PublicSiteData.Snapshot snapshot) {
        var links = new ArrayList<Link>();
        for (var pair : List.of(new Link("/","首页"),new Link("/about","关于我们"),new Link("/solutions","产品中心"),new Link("/insights","新闻资讯"),new Link("/contact","联系我们"),new Link("/site-map","网站地图"))) links.add(pair);
        for (var industry : snapshot.industries()) if (snapshot.products().stream().anyMatch(product -> product.getIndustries().contains(industry.getId()))) links.add(new Link("/solutions?industry=" + industry.getId(), value(industry.getTitleZh(), industry.getTitleEn()) + "装备"));
        snapshot.products().forEach(item -> links.add(new Link("/solutions/" + item.getId(), name(item))));
        snapshot.articles().forEach(item -> links.add(new Link("/insights/" + item.getId(), name(item))));
        return links;
    }
    private List<Faq> faqs(String kind, Content record, Industry industry, PublicSiteData.Snapshot snapshot, ObjectNode config) {
        if (!config.path("faqEnabled").asBoolean() || !Set.of("about","contact","catalog","industry","product").contains(kind)) return List.of();
        var result = new ArrayList<Faq>();
        if (kind.equals("product") && !summary(record).isBlank()) result.add(new Faq(name(record) + "主要用于哪些场景？", summary(record)));
        if (industry != null) result.add(new Faq(value(industry.getTitleZh(), industry.getTitleEn()) + "行业有哪些相关产品？", String.join("、", snapshot.products().stream().filter(product -> product.getIndustries().contains(industry.getId())).map(SeoPageService::name).toList()) + "。具体产品资料可在本页查看。"));
        for (var item : config.path("faqs")) result.add(new Faq(item.path("question").asText(), item.path("answer").asText()));
        return result;
    }
    private JsonNode schema(String kind, String heading, String description, String url, String image, Content record, List<Faq> faqs, PublicSiteData.Snapshot snapshot, ObjectNode config, int status) {
        var root = mapper.createObjectNode(); root.put("@context", "https://schema.org"); var graph = root.putArray("@graph");
        if (status != 200 || kind.equals("admin") || kind.equals("hidden")) return root;
        String siteUrl = config.path("siteUrl").asText(), orgId = siteUrl + "/#organization";
        var org = mapper.createObjectNode(); org.put("@type","Organization"); org.put("@id",orgId); org.put("name",COMPANY); org.put("url",siteUrl + "/"); org.put("logo", siteUrl + LOGO);
        org.putArray("alternateName").add("TZME").add("重钢机械"); org.putArray("sameAs").add("https://www.tzmeglobal.com/");
        var contact = snapshot.contact().path("contact");
        if (!contact.path("phone").asText().isBlank()) org.put("telephone",contact.path("phone").asText());
        if (contact.path("emails").size() > 0) org.put("email",contact.path("emails").get(0).asText());
        String address = contact.path("address").path("zh").asText();
        if (!address.isBlank()) { var postal = org.putObject("address"); postal.put("@type","PostalAddress"); postal.put("addressCountry","CN"); postal.put("addressRegion","天津"); postal.put("streetAddress",address); }
        graph.add(org);
        var website = mapper.createObjectNode(); website.put("@type","WebSite"); website.put("@id",siteUrl + "/#website"); website.put("url",siteUrl + "/"); website.put("name",config.path("siteName").asText()); website.put("inLanguage","zh-CN"); website.putObject("publisher").put("@id",orgId); graph.add(website);
        var page = mapper.createObjectNode(); page.put("@type",kind.equals("article") ? "Article" : kind.equals("contact") ? "ContactPage" : kind.equals("about") ? "AboutPage" : Set.of("catalog","industry","map","news").contains(kind) ? "CollectionPage" : "WebPage");
        page.put("@id",url + "#webpage"); page.put("url",url); page.put("name",heading); page.put("description",description); page.put("inLanguage","zh-CN"); page.putObject("isPartOf").put("@id",siteUrl + "/#website"); page.putObject("publisher").put("@id",orgId);
        if (kind.equals("article") && record != null) { page.put("headline",heading); if (record.getDate() != null) page.put("datePublished",record.getDate().toString()); page.put("articleBody",plain(value(record.getContentZh(),record.getContent()))); }
        String absoluteImage = imageUrl(image, siteUrl); if (!absoluteImage.isBlank()) page.put("image",absoluteImage); graph.add(page);
        if (!kind.equals("home")) {
            var breadcrumbs = mapper.createObjectNode(); breadcrumbs.put("@type","BreadcrumbList"); var items = breadcrumbs.putArray("itemListElement");
            breadcrumb(items,1,"首页",siteUrl + "/");
            if (kind.equals("product") || kind.equals("industry")) breadcrumb(items,2,"产品中心",siteUrl + "/solutions");
            else if (kind.equals("article")) breadcrumb(items,2,"新闻资讯",siteUrl + "/insights");
            breadcrumb(items,items.size()+1,heading,url); graph.add(breadcrumbs);
        }
        if (kind.equals("product")) { var product = mapper.createObjectNode(); product.put("@type","Product"); product.put("@id",url + "#product"); product.put("name",heading); product.put("url",url); product.put("description",description); product.put("productID",record.getId()); if (!absoluteImage.isBlank()) product.put("image",absoluteImage); product.putObject("manufacturer").put("@id",orgId); product.putObject("mainEntityOfPage").put("@id",url + "#webpage"); graph.add(product); }
        if (!faqs.isEmpty()) { var faq = mapper.createObjectNode(); faq.put("@type","FAQPage"); faq.put("@id",url + "#questions"); var questions = faq.putArray("mainEntity"); for (var item : faqs) { var question = questions.addObject(); question.put("@type","Question"); question.put("name",item.question()); question.putObject("acceptedAnswer").put("@type","Answer").put("text",item.answer()); } graph.add(faq); }
        return root;
    }
    private static void breadcrumb(ArrayNode items, int position, String name, String url) { items.addObject().put("@type","ListItem").put("position",position).put("name",name).put("item",url); }
    public static String imageUrl(String image, String siteUrl) { if (image == null) return ""; if (image.startsWith("/assets/") || image.startsWith("/api/uploads/images/")) return siteUrl + image; return image.matches("https://[^\\s<>\"]+") ? image : ""; }
    public static String name(Content record) { return record == null ? "" : value(record.getTitleZh(), record.getTitle()); }
    public static String summary(Content record) { return record == null ? "" : plain(record.getSummaryZh() == null ? record.getSummary() : record.getSummaryZh()); }
    public static String value(String... values) { for (var value : values) if (value != null && !value.isBlank()) return value.trim(); return ""; }
    public static String plain(String html) { return html == null ? "" : HtmlUtils.htmlUnescape(html.replaceAll("(?is)<(script|style)\\b[^>]*>.*?</\\1\\s*>","").replaceAll("(?i)</(?:p|div|h[1-6]|li)>|<br\\s*/?>","\n").replaceAll("<[^>]*>","")).replace('\u00a0',' ').strip(); }
    private static String truncate(String value, int max) { return value.codePointCount(0,value.length()) > max ? value.substring(0,value.offsetByCodePoints(0,max-1)) + "…" : value; }
}
