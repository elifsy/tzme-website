package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.model.SiteSettings;
import com.tzme.cms.repository.SiteSettingsRepository;
import java.net.URI;
import java.util.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SeoSettingsService {
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;
    private final ObjectNode defaults;
    public SeoSettingsService(SiteSettingsRepository repository, ObjectMapper mapper) throws java.io.IOException {
        this.repository = repository; this.mapper = mapper;
        try (var stream = new ClassPathResource("seo-defaults.json").getInputStream()) { defaults = (ObjectNode) mapper.readTree(stream); }
    }
    public ObjectNode get() {
        try { var row = repository.findById("seo"); return row.isPresent() ? (ObjectNode) mapper.readTree(row.get().getConfiguration()) : defaults.deepCopy(); }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "搜索展示配置暂不可用。"); }
    }
    public ObjectNode publicView(ObjectNode configuration) {
        var value = configuration.deepCopy(); value.remove(List.of("pages", "overrides", "faqs")); return value;
    }
    @Transactional public ObjectNode save(ObjectNode input) {
        Set<String> keys = Set.of("siteUrl", "siteName", "defaultDescription", "icpNumber", "verification", "pages", "overrides", "faqEnabled", "faqs");
        if (input.size() != keys.size()) invalid("搜索展示配置不完整。");
        input.fieldNames().forEachRemaining(key -> { if (!keys.contains(key)) invalid("存在未知配置字段。"); });
        var value = input.deepCopy();
        String siteUrl = value.path("siteUrl").asText().trim();
        try {
            var uri = URI.create(siteUrl);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getPort() != -1
                || uri.getQuery() != null || uri.getFragment() != null || !(uri.getPath().isEmpty() || uri.getPath().equals("/"))) invalid("正式域名需为不带路径、端口和参数的 HTTPS 地址。");
            value.put("siteUrl", "https://" + uri.getHost().toLowerCase(Locale.ROOT));
        } catch (IllegalArgumentException error) { invalid("请填写有效的正式域名。"); }
        text(value, "siteName", 60, true); text(value, "defaultDescription", 300, true); text(value, "icpNumber", 80, false);
        if (!value.path("verification").isObject() || value.path("verification").size() != 4) invalid("搜索平台验证码配置不完整。");
        for (String key : List.of("baidu", "bing", "so360", "sogou")) {
            String token = text((ObjectNode) value.path("verification"), key, 200, false);
            if (!token.isEmpty() && !token.matches("[A-Za-z0-9_-]+")) invalid("验证码只需填写平台提供的 content 值，不填写 HTML 标签。");
        }
        if (!value.path("pages").isObject() || value.path("pages").size() != defaults.path("pages").size()) invalid("基础页面配置不完整。");
        for (String path : List.of("/", "/about", "/solutions", "/insights", "/contact", "/site-map")) page(value.path("pages").path(path));
        if (!value.path("overrides").isObject() || value.path("overrides").size() > 500) invalid("页面单独配置最多 500 项。");
        value.path("overrides").fields().forEachRemaining(entry -> {
            if (!entry.getKey().matches("/(?:solutions|insights)/[A-Za-z0-9_-]{1,100}") && !entry.getKey().matches("/solutions\\?industry=[A-Za-z0-9_-]{1,100}")) invalid("单独配置只支持实际产品、资讯或行业页面。");
            page(entry.getValue());
        });
        if (!value.path("faqEnabled").isBoolean() || !value.path("faqs").isArray() || value.path("faqs").size() > 12) invalid("常见问题最多 12 条。");
        for (var faq : value.path("faqs")) {
            if (!(faq instanceof ObjectNode node) || faq.size() != 2) invalid("请完整填写问题与回答。");
            text((ObjectNode) faq, "question", 150, true); text((ObjectNode) faq, "answer", 1200, true, true);
        }
        var row = repository.findForUpdate("seo").orElseGet(() -> { var created = new SiteSettings(); created.setId("seo"); return created; });
        try { row.setConfiguration(mapper.writeValueAsString(value)); repository.saveAndFlush(row); return value; }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "搜索展示配置保存失败。"); }
    }
    private static void page(JsonNode node) {
        if (!(node instanceof ObjectNode object) || node.size() != 2 || !node.has("title") || !node.has("description")) invalid("每个页面需填写标题与描述。");
        text((ObjectNode) node, "title", 160, false); text((ObjectNode) node, "description", 400, false);
    }
    private static String text(ObjectNode node, String key, int max, boolean required) {
        return text(node,key,max,required,false);
    }
    private static String text(ObjectNode node, String key, int max, boolean required, boolean multiline) {
        if (!node.path(key).isTextual()) invalid("请填写文本内容。");
        String value = node.path(key).asText().trim();
        if (value.length() > max || (!multiline && (value.contains("\r") || value.contains("\n"))) || (required && value.isEmpty())) invalid("文本内容不完整、过长或包含不支持的换行。");
        node.put(key, value); return value;
    }
    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
