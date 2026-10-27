package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.*;
import com.tzme.cms.model.Content;
import java.nio.file.*;
import java.util.*;
import java.util.regex.Matcher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import static com.tzme.cms.seo.SeoPageService.*;

@Service
public class SeoHtmlRenderer {
    private final ObjectMapper mapper;
    private final SeoPageService pages;
    private final Path frontend;
    private final SeoSettingsService settings;
    public SeoHtmlRenderer(ObjectMapper mapper, SeoPageService pages, SeoSettingsService settings, @Value("${tzme.frontend-dir:../dist}") String frontend) {
        this.mapper = mapper; this.pages = pages; this.settings = settings; this.frontend = Path.of(frontend).toAbsolutePath().normalize();
    }
    public record Bundle(SeoPageService.Page page, String head, String body, String bootstrap) {}
    public Bundle bundle(SeoPageService.Document document) {
        var page = document.page();
        var initial = new LinkedHashMap<>(document.data().bootstrap()); initial.put("/api/seo/settings", settings.publicView(document.configuration()));
        String bootstrap = page.kind().equals("admin") || page.status() != 200 ? "" : "<script id=\"site-bootstrap\" type=\"application/json\">" + json(initial) + "</script>";
        return new Bundle(page, head(document), page.kind().equals("admin") ? "" : body(document), bootstrap);
    }
    public String render(Bundle bundle) throws java.io.IOException {
        Path index = frontend.resolve("index.html");
        if (!Files.isRegularFile(index)) throw new java.io.IOException("Build frontend dist/ or configure TZME_FRONTEND_DIR before serving public HTML.");
        String template = Files.readString(index);
        if (!template.contains("<!--site:head:start-->")) throw new java.io.IOException("Frontend build is outdated; rebuild the frontend with SEO template markers.");
        return template.replaceAll("(?s)<!--site:head:start-->.*?<!--site:head:end-->", Matcher.quoteReplacement(bundle.head()))
            .replace("<!--site:body-->",bundle.body()).replace("<!--site:bootstrap-->",bundle.bootstrap());
    }
    private String head(SeoPageService.Document document) {
        var page = document.page(); String base = document.configuration().path("siteUrl").asText();
        var head = new StringBuilder("<title>").append(e(page.title())).append("</title>\n");
        meta(head,"name","description",page.description()); meta(head,"name","robots",page.robots()); meta(head,"name","format-detection","telephone=no");
        if (page.status() == 200 && !page.kind().equals("admin")) head.append("<link rel=\"canonical\" href=\"").append(e(page.url())).append("\">\n");
        meta(head,"property","og:locale","zh_CN"); meta(head,"property","og:type",page.kind().equals("article") ? "article" : "website");
        meta(head,"property","og:site_name",document.configuration().path("siteName").asText()); meta(head,"property","og:title",page.title()); meta(head,"property","og:description",page.description());
        if (page.status() == 200 && !page.kind().equals("admin")) meta(head,"property","og:url",page.url());
        String image = imageUrl(page.image(),base); if (!image.isBlank()) meta(head,"property","og:image",image);
        var verification = document.configuration().path("verification");
        for (var item : Map.of("baidu","baidu-site-verification","bing","msvalidate.01","so360","360-site-verification","sogou","sogou_site_verification").entrySet()) {
            String token = verification.path(item.getKey()).asText(); if (!token.isBlank()) meta(head,"name",item.getValue(),token);
        }
        if (page.structuredData().path("@graph").size() > 0) head.append("<script id=\"site-structured-data\" type=\"application/ld+json\">").append(json(page.structuredData())).append("</script>\n");
        head.append("<link rel=\"stylesheet\" href=\"/assets/site-document.css\">\n");
        return head.toString();
    }
    private String body(SeoPageService.Document document) {
        var page = document.page(); var snapshot = document.data();
        var html = new StringBuilder("<div class=\"site-document\"><header class=\"sd-header\"><div class=\"sd-wrap sd-nav\"><a class=\"sd-brand\" href=\"/\"><img src=\"").append(LOGO).append("\" width=\"60\" height=\"60\" alt=\"TZME 重钢机械\"><span>").append(COMPANY).append("<small>TZME (Tianjin) Co., Ltd.</small></span></a><nav aria-label=\"网站导航\">");
        for (var link : List.of(new Link("/","首页"),new Link("/about","关于我们"),new Link("/solutions","产品中心"),new Link("/insights","新闻资讯"),new Link("/contact","联系我们"))) html.append(link(link.path(),link.title()));
        html.append("</nav></div></header><main id=\"main-content\">");
        if (page.status() == 404) html.append("<section class=\"sd-wrap sd-section\"><p>404</p><h1>页面未找到</h1><p>该页面不存在或尚未发布。</p>").append(link("/solutions","查看产品中心")).append("</section>");
        else if (page.kind().equals("product")) product(html,document);
        else if (page.kind().equals("article")) article(html,document);
        else if (page.kind().equals("home")) home(html,document);
        else if (page.kind().equals("about")) about(html,document);
        else if (page.kind().equals("catalog") || page.kind().equals("industry")) catalog(html,document);
        else if (page.kind().equals("news")) news(html,snapshot.articles());
        else if (page.kind().equals("contact")) contact(html,document);
        else if (page.kind().equals("map")) {
            html.append("<section class=\"sd-wrap sd-section\"><h1>网站地图</h1><p>从公开的行业、产品和企业资料继续了解重钢机械。</p><ul class=\"sd-link-list\">");
            for (var item : pages.links(snapshot)) html.append("<li>").append(link(item.path(),item.title())).append("</li>"); html.append("</ul></section>");
        } else html.append("<section class=\"sd-wrap sd-section\"><h1>").append(e(page.heading())).append("</h1>").append(link("/contact","联系重钢机械")).append("</section>");
        questions(html,page.faqs());
        html.append("</main><footer class=\"sd-footer\"><div class=\"sd-wrap\"><strong>").append(COMPANY).append("</strong>");
        contactDetails(html,snapshot.contact().path("contact")); html.append(link("/site-map","网站地图")).append(" · ").append(link("/about#certificates-title","资质资料")).append(" · ").append(link("https://www.tzmeglobal.com/","English"));
        String icp = document.configuration().path("icpNumber").asText(); if (!icp.isBlank()) html.append("<p>").append(link("https://beian.miit.gov.cn/",icp)).append("</p>");
        return html.append("</div></footer></div>").toString();
    }
    private void home(StringBuilder html, SeoPageService.Document document) {
        var data = document.data();
        html.append("<section class=\"sd-home-hero\"><img src=\"").append(HARBOR).append("\" alt=\"港口装备与制造现场\" fetchpriority=\"high\"><div class=\"sd-wrap\"><div><p>TZME / 重钢机械</p><h1>成为全球非标机械<br>设备制造领域的<br>领导者。</h1>").append(link("/solutions","了解行业装备 →")).append("</div></div></section>");
        html.append("<section class=\"sd-wrap sd-section\"><h2>以产品质量为核心的非标机械装备制造</h2>");
        paragraphs(html,data.about().path("home").path("description").path("zh").asText());
        html.append(link("/about","了解制造基地与企业资料 →")).append("</section>");
        industries(html,data); html.append("<section class=\"sd-wrap sd-section\"><h2>行业装备与产品</h2>"); cards(html,data.products().stream().filter(item->Boolean.TRUE.equals(item.getShowOnHome())).sorted(Comparator.comparingInt(item->item.getHomeOrder()==null?999:item.getHomeOrder())).limit(5).toList()); html.append("</section>");
        quality(html,data.capabilities());
    }
    private void about(StringBuilder html, SeoPageService.Document document) {
        var about = document.data().about().path("about");
        hero(html,"关于重钢机械",value(about.path("titleLine1").path("zh").asText(),"中国制造，") + value(about.path("titleLine2").path("zh").asText(),"服务全球工程。"),document.page().description(),about.path("image").asText());
        html.append("<section class=\"sd-wrap sd-section\"><h2>完整公司介绍</h2>"); paragraphs(html,about.path("description").path("zh").asText()); paragraphs(html,about.path("description2").path("zh").asText()); html.append("</section>");
        quality(html,document.data().capabilities());
        html.append("<section id=\"manufacturing-bases\" class=\"sd-wrap sd-section\"><h2>总部与制造基地</h2>");
        facility(html,document.data().contact().path("contact"));
        for (var item : document.data().contact().path("subsidiaries")) if (item.path("enabled").asBoolean()) facility(html,item);
        html.append("</section><section id=\"certificates-title\" class=\"sd-wrap sd-section\"><h2>公开资质与质量资料</h2><ul>");
        for (var item : document.data().certificates()) { html.append("<li><h3>").append(e(value(item.getTitleZh(),item.getTitleEn()))).append("</h3>"); paragraphs(html,value(item.getSummaryZh(),item.getSummaryEn())); if(item.getExpiresAt()!=null) html.append("<p>有效期至：").append(item.getExpiresAt()).append("，适用范围以证书文件为准。</p>"); html.append("</li>"); }
        html.append("</ul></section>");
    }
    private void catalog(StringBuilder html, SeoPageService.Document document) {
        String title = document.industry() == null ? "面向不同工况，交付可靠装备。" : document.page().heading();
        var scene = document.data().bootstrap().get("/api/product-showcase"); var image = scene instanceof JsonNode json ? json.path("overview").path("image").asText() : "";
        hero(html,"产品中心 / 行业装备",title,document.page().description(),image);
        industries(html,document.data()); html.append("<section id=\"equipment-catalog\" class=\"sd-wrap sd-section\"><h2>").append(e(document.page().heading())).append("</h2>");
        var products = document.data().products().stream().filter(item -> document.industry() == null || item.getIndustries().contains(document.industry().getId())).toList(); cards(html,products); html.append("</section>");
    }
    private void product(StringBuilder html, SeoPageService.Document document) {
        var product = document.record();
        html.append("<section class=\"sd-soft\"><div class=\"sd-wrap\"><nav class=\"sd-breadcrumb\" aria-label=\"面包屑导航\">").append(link("/","首页")).append(" / ").append(link("/solutions","产品中心")).append(" / ").append(e(name(product))).append("</nav><div class=\"sd-product-hero\"><div><p>").append(e(value(product.getCategoryZh(),product.getCategory()))).append("</p><h1>").append(e(name(product))).append("</h1><span class=\"sd-rule\"></span>");
        paragraphs(html,summary(product)); html.append(link("/contact","咨询该设备 →")).append("<p class=\"sd-note\">结构制造 / 装配试装 / 检验交付</p></div>");
        image(html,value(product.getPresentationImage(),product.getImage()),name(product),"sd-product-image"); html.append("</div></div></section>");
        html.append("<section class=\"sd-wrap sd-section sd-product-body\"><div><h2>产品介绍</h2>"); paragraphs(html,value(product.getContentZh(),product.getSummaryZh()));
        String features = value(product.getFeaturesZh()); if(!features.isBlank()){html.append("<h2>产品特点</h2><ul>");for(var line:features.split("\\R"))if(!line.isBlank())html.append("<li>").append(e(line)).append("</li>");html.append("</ul>");}html.append("</div>");
        String specifications = value(product.getSpecificationsZh()); if(!specifications.isBlank()){html.append("<div><h2>技术信息</h2><dl class=\"sd-specs\">");for(var line:specifications.split("\\R")){if(line.isBlank())continue;String[] pair=line.split("[:：]",2);html.append("<div>");if(pair.length==2)html.append("<dt>").append(e(pair[0])).append("</dt><dd>").append(e(pair[1])).append("</dd>");else html.append("<dd>").append(e(line)).append("</dd>");html.append("</div>");}html.append("</dl></div>");}html.append("</section>");
        html.append("<section class=\"sd-wrap sd-section\"><h2>同类产品</h2><ul class=\"sd-link-list\">");for(var item:document.data().products())if(!item.getId().equals(product.getId())&&item.getIndustries().stream().anyMatch(product.getIndustries()::contains))html.append("<li>").append(link("/solutions/"+item.getId(),name(item))).append("</li>");html.append("</ul></section>");
    }
    private void news(StringBuilder html,List<Content> articles){html.append("<section class=\"sd-wrap sd-section\"><h1>新闻资讯</h1><p>企业动态与装备制造、交付信息。</p>");cards(html,articles);html.append("</section>");}
    private void article(StringBuilder html,SeoPageService.Document document){var item=document.record();html.append("<article class=\"sd-wrap sd-section sd-article\"><nav class=\"sd-breadcrumb\">").append(link("/insights","← 新闻资讯")).append("</nav>");if(item.getDate()!=null)html.append("<time datetime=\"").append(item.getDate()).append("\">").append(item.getDate()).append("</time>");html.append("<h1>").append(e(name(item))).append("</h1>");paragraphs(html,summary(item));image(html,item.getImage(),name(item),"sd-article-cover");paragraphs(html,value(item.getContentZh(),item.getContent(),item.getSummaryZh()));html.append("<p>发布机构：").append(COMPANY).append("</p></article>");}
    private void contact(StringBuilder html,SeoPageService.Document document){hero(html,"联系我们 / CONTACT TZME","下一项制造需求，从交流开始。","告诉我们您的图纸、工况、质量要求与交付计划，一起明确设备制造与交付需求。","");html.append("<section class=\"sd-wrap sd-section\"><h2>直接联系</h2>");contactDetails(html,document.data().contact().path("contact"));html.append("<h2>咨询资料准备</h2><p>设备名称、图纸、工况与物料说明、质量检验要求、数量及交付计划。</p><p>启用浏览器 JavaScript 后可在本页填写咨询表单，也可通过上述邮箱或电话联系。</p></section>");}
    private void industries(StringBuilder html,PublicSiteData.Snapshot data){html.append("<nav class=\"sd-industries sd-wrap\" aria-label=\"应用行业\">");for(var industry:data.industries())if(data.products().stream().anyMatch(item->item.getIndustries().contains(industry.getId())))html.append(link("/solutions?industry="+industry.getId(),value(industry.getTitleZh(),industry.getTitleEn())));html.append("</nav>");}
    private void cards(StringBuilder html,List<Content> records){html.append("<div class=\"sd-card-grid\">");for(var item:records){String path=("articles".equals(item.getType())?"/insights/":"/solutions/")+item.getId();html.append("<article><a href=\"").append(e(path)).append("\">");image(html,"articles".equals(item.getType())?item.getImage():value(item.getPresentationImage(),item.getImage()),name(item),"sd-card-image");html.append("<h3>").append(e(name(item))).append("</h3></a>");paragraphs(html,summary(item));html.append("</article>");}html.append("</div>");}
    private void quality(StringBuilder html,JsonNode quality){if(!quality.path("enabled").asBoolean())return;html.append("<section class=\"sd-soft\"><div class=\"sd-wrap sd-section\"><h2>制造与质量</h2>");paragraphs(html,quality.path("description").path("zh").asText());html.append("<ol class=\"sd-quality\">");for(var step:quality.path("steps"))if(step.path("enabled").asBoolean(true)){html.append("<li><strong>").append(e(step.path("label").path("zh").asText())).append("</strong>");paragraphs(html,step.path("description").path("zh").asText());html.append("</li>");}html.append("</ol></div></section>");}
    private void facility(StringBuilder html,JsonNode item){var facility=item.path("facility");if(!facility.isObject()||(facility.has("enabled")&&!facility.path("enabled").asBoolean()))return;html.append("<article><h3>").append(e(value(facility.path("title").path("zh").asText(),item.path("name").path("zh").asText(),item.path("headquarters").path("zh").asText()))).append("</h3>");paragraphs(html,facility.path("description").path("zh").asText());paragraphs(html,item.path("address").path("zh").asText());html.append("</article>");}
    private void contactDetails(StringBuilder html,JsonNode contact){String address=contact.path("address").path("zh").asText();if(!address.isBlank())html.append("<p>").append(e(address)).append("</p>");String phone=contact.path("phone").asText();if(!phone.isBlank())html.append("<p>电话：").append(e(phone)).append("</p>");for(var email:contact.path("emails"))if(email.asText().matches("[^\\s<>\"]+@[^\\s<>\"]+"))html.append("<p>").append(link("mailto:"+email.asText(),email.asText())).append("</p>");}
    private void hero(StringBuilder html,String kicker,String heading,String description,String image){html.append("<section class=\"sd-soft\"><div class=\"sd-wrap sd-section sd-hero\"><div><p class=\"sd-kicker\">").append(e(kicker)).append("</p><h1>").append(e(heading)).append("</h1><span class=\"sd-rule\"></span>");paragraphs(html,description);html.append("</div>");image(html,image,heading,"sd-hero-image");html.append("</div></section>");}
    private void questions(StringBuilder html,List<Faq> faqs){if(faqs.isEmpty())return;html.append("<section class=\"sd-wrap sd-section sd-questions\"><h2>制造服务常见问题</h2>");for(var item:faqs)html.append("<details open><summary>").append(e(item.question())).append("</summary><p>").append(e(item.answer())).append("</p></details>");html.append("</section>");}
    private static void paragraphs(StringBuilder html,String value){String text=plain(value);if(text.isBlank())return;for(var paragraph:text.split("\\n+"))if(!paragraph.isBlank())html.append("<p>").append(e(paragraph)).append("</p>");}
    private static void image(StringBuilder html,String image,String alt,String css){if(image==null||!(image.startsWith("/assets/")||image.startsWith("/api/uploads/images/")))return;html.append("<img class=\"").append(css).append("\" src=\"").append(e(image)).append("\" alt=\"").append(e(alt)).append("\" decoding=\"async\">");}
    private static String link(String href,String label){return "<a href=\""+e(href)+"\">"+e(label)+"</a>";}
    private static void meta(StringBuilder head,String attribute,String name,String content){head.append("<meta ").append(attribute).append("=\"").append(e(name)).append("\" content=\"").append(e(content)).append("\">\n");}
    private String json(Object value){try{return mapper.writeValueAsString(value).replace("<","\\u003c").replace(">","\\u003e").replace("&","\\u0026").replace("\u2028","\\u2028").replace("\u2029","\\u2029");}catch(Exception error){throw new IllegalStateException("Unable to serialize public page data",error);}}
    private static String e(String value){return HtmlUtils.htmlEscape(value==null?"":value,"UTF-8");}
}
