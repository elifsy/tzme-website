package com.tzme.cms.seo;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

@RestController
public class SeoPublicController {
    private final SeoPageService pages;
    private final PublicSiteData data;
    private final SeoSettingsService settings;
    private final SeoHtmlRenderer renderer;
    public SeoPublicController(SeoPageService pages,PublicSiteData data,SeoSettingsService settings,SeoHtmlRenderer renderer){this.pages=pages;this.data=data;this.settings=settings;this.renderer=renderer;}
    @GetMapping(value="/robots.txt",produces="text/plain;charset=UTF-8") public String robots(){return "User-agent: *\nAllow: /\nAllow: /api/uploads/images/\nDisallow: /admin\nDisallow: /api/\nDisallow: /docs/\nDisallow: /database/\nDisallow: /server/\nDisallow: /scripts/\nDisallow: /src/\nDisallow: /node_modules/\n\nSitemap: "+settings.get().path("siteUrl").asText()+"/sitemap.xml\n";}
    @GetMapping(value="/sitemap.xml",produces="application/xml;charset=UTF-8") public String sitemap(){
        String base=settings.get().path("siteUrl").asText();var xml=new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for(var link:pages.links(data.read()))xml.append("<url><loc>").append(HtmlUtils.htmlEscape(base+link.path(),"UTF-8")).append("</loc></url>\n");
        return xml.append("</urlset>\n").toString(); // No fabricated modification dates or hidden/draft records.
    }
    @GetMapping(value="/llms.txt",produces="text/plain;charset=UTF-8") public String knowledge(){
        var snapshot=data.read();var config=settings.get();String base=config.path("siteUrl").asText();
        var text=new StringBuilder("# "+SeoPageService.COMPANY+"（TZME）\n\n> 非标机械装备制造企业。以公开官网页面、产品资料和证书文件为事实依据；具体供货范围与交付条件需沟通确认。\n\n## 企业资料\n\n");
        text.append(SeoPageService.plain(snapshot.about().path("about").path("description").path("zh").asText())).append("\n\n").append(SeoPageService.plain(snapshot.about().path("about").path("description2").path("zh").asText())).append("\n\n");
        text.append("## 公开页面索引\n\n");for(var link:pages.links(snapshot))text.append("- [").append(markdown(link.title())).append("](").append(base).append(link.path()).append(")\n");
        text.append("\n## 制造服务常见问题\n\n");if(config.path("faqEnabled").asBoolean())for(var item:config.path("faqs"))text.append("### ").append(item.path("question").asText()).append("\n\n").append(item.path("answer").asText()).append("\n\n");
        text.append("## 联系方式\n\n").append(snapshot.contact().path("contact").path("address").path("zh").asText()).append("\n").append(snapshot.contact().path("contact").path("phone").asText()).append("\n");
        for(var email:snapshot.contact().path("contact").path("emails"))text.append(email.asText()).append("\n");
        return text.toString();
    }
    @GetMapping(value={"/","/{*path}"},produces="text/html;charset=UTF-8") public ResponseEntity<String> html(HttpServletRequest request){
        try{
            String target=request.getRequestURI()+(request.getQueryString()==null?"":"?"+request.getQueryString());
            var document=pages.document(target);var page=document.page();
            String canonicalBase=URI.create(page.canonicalPath()).getPath();
            if(page.status()==200&&!page.kind().equals("admin")&&!canonicalBase.equals(request.getRequestURI())){
                String location=canonicalBase+(request.getQueryString()==null?"":"?"+request.getQueryString());
                return ResponseEntity.status(301).location(URI.create(location)).build();
            }
            var response=ResponseEntity.status(page.status()).contentType(MediaType.parseMediaType("text/html;charset=UTF-8")).header("Cache-Control","no-store");
            if(!page.indexable())response.header("X-Robots-Tag",page.robots());
            return response.body(renderer.render(renderer.bundle(document)));
        }catch(Exception error){return ResponseEntity.status(503).contentType(MediaType.parseMediaType("text/html;charset=UTF-8")).header("X-Robots-Tag","noindex,nofollow").header("Retry-After","300").body("<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow\"><title>网站暂时不可用 - TZME 重钢机械</title><h1>网站暂时不可用</h1><p>请稍后重试。</p></html>");}
    }
    private static String markdown(String value){return value.replace("[","\\[").replace("]","\\]").replace("\n"," ");}
}
