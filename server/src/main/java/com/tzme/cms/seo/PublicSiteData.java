package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.*;
import com.tzme.cms.model.*;
import com.tzme.cms.repository.*;
import com.tzme.cms.service.ContactSettingsService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicSiteData {
    private final ContentRepository content;
    private final IndustryRepository industries;
    private final CertificationRepository certificates;
    private final SiteSettingsRepository settings;
    private final HomeGlobalRepository global;
    private final ContactSettingsService contact;
    private final ObjectMapper mapper;
    public PublicSiteData(ContentRepository content, IndustryRepository industries, CertificationRepository certificates,
            SiteSettingsRepository settings, HomeGlobalRepository global, ContactSettingsService contact, ObjectMapper mapper) {
        this.content = content; this.industries = industries; this.certificates = certificates; this.settings = settings; this.global = global; this.contact = contact; this.mapper = mapper;
    }
    public record Snapshot(JsonNode website, JsonNode about, JsonNode contact, JsonNode capabilities,
        List<Content> products, List<Content> articles, List<Industry> industries, List<Certification> certificates, Map<String, Object> bootstrap) {}
    private JsonNode setting(String id) {
        try { var row = settings.findById(id); return row.isPresent() ? mapper.readTree(row.get().getConfiguration()) : mapper.createObjectNode(); }
        catch (Exception error) { throw new IllegalStateException("Invalid public site configuration: " + id, error); }
    }
    @Transactional(readOnly = true) public Snapshot read() {
        var products = content.findAllByTypeOrderByDateDesc("products").stream().filter(item -> "published".equals(item.getStatus())).toList();
        var articles = content.findAllByTypeOrderByDateDesc("articles").stream().filter(item -> "published".equals(item.getStatus())).toList();
        var visibleIndustries = industries.findAllByOrderBySortOrderAscTitleEnAsc().stream().filter(item -> "published".equals(item.getStatus())).toList();
        var visibleCertificates = certificates.findAllByOrderBySortOrderAscTitleEnAsc().stream().filter(item -> "published".equals(item.getStatus())).toList();
        var website = setting("website"); var about = setting("about-tzme"); var capabilities = setting("capabilities");
        var publicContact = contact.publicConfiguration(); // Never read or serialize SMTP/admin account/inquiry data here.
        var bootstrap = new LinkedHashMap<String, Object>();
        bootstrap.put("/api/site-settings", website); bootstrap.put("/api/contact-settings", publicContact);
        bootstrap.put("/api/products", products); bootstrap.put("/api/articles", articles); bootstrap.put("/api/industries", visibleIndustries);
        bootstrap.put("/api/certifications", visibleCertificates); bootstrap.put("/api/about-tzme", about); bootstrap.put("/api/home-capabilities", capabilities);
        bootstrap.put("/api/home-solutions", setting("home-solutions")); bootstrap.put("/api/product-showcase", setting("product-showcase"));
        global.findById(1L).ifPresent(row -> {
            try { bootstrap.put("/api/home-global", mapper.readValue(row.getConfiguration(), HomeGlobalSettings.class).withMapDefaults()); }
            catch (Exception error) { throw new IllegalStateException("Invalid global reach configuration", error); }
        });
        return new Snapshot(website, about, publicContact, capabilities, products, articles, visibleIndustries, visibleCertificates, bootstrap);
    }
}
