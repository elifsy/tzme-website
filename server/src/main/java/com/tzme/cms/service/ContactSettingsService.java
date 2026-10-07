package com.tzme.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.repository.SiteSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.util.*;

@Service
public class ContactSettingsService {
    public static final Set<String> FILE_TYPES = Set.of("pdf", "dwg", "dxf", "xls", "xlsx", "doc", "docx", "jpg", "jpeg", "png", "webp", "zip", "txt");
    public static final Set<String> FORM_FIELDS = Set.of("name", "company", "country", "email", "phone", "industry", "requirements");
    private static final Set<String> SOCIAL_PLATFORMS = Set.of("linkedin", "youtube", "x", "wechat", "weibo", "bilibili", "facebook", "instagram", "link");
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;
    public ContactSettingsService(SiteSettingsRepository repository, ObjectMapper mapper) {
        this.repository = repository; this.mapper = mapper;
    }
    public ObjectNode configuration() {
        try {
            var row = repository.findById("contact").orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Import the contact configuration SQL migration"));
            return (ObjectNode) mapper.readTree(row.getConfiguration());
        } catch (ResponseStatusException error) { throw error; }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid contact configuration"); }
    }
    public ObjectNode publicConfiguration() {
        var value = configuration(); value.remove("notification"); return value;
    }
    public ObjectNode adminConfiguration() {
        return publicConfiguration();
    }
    public ObjectNode mailConfiguration() {
        return maskedNotification((ObjectNode) configuration().path("notification"));
    }
    private ObjectNode maskedNotification(ObjectNode notification) {
        var value = notification.deepCopy();
        var smtp = (ObjectNode) value.path("smtp");
        smtp.put("passwordConfigured", !smtp.path("password").asText().isBlank());
        smtp.put("password", ""); return value;
    }
    @Transactional
    public ObjectNode save(ObjectNode input) {
        var row = repository.findForUpdate("contact").orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var value = parse(row.getConfiguration());
        var storedSocialLinks = value.path("contact").get("socialLinks");
        var keys = Set.of("contact", "subsidiaries", "form", "upload");
        input.fieldNames().forEachRemaining(key -> { if (!keys.contains(key)) invalid("Unknown contact configuration field"); });
        for (String key : keys) {
            if (!input.has(key)) invalid("Contact configuration is incomplete");
            value.set(key, input.get(key).deepCopy());
        }
        // Preserve social links when an older client updates contact information.
        if (storedSocialLinks != null && value.path("contact") instanceof ObjectNode contact && !contact.has("socialLinks")) contact.set("socialLinks", storedSocialLinks);
        validateContact(value);
        try {
            row.setConfiguration(mapper.writeValueAsString(value)); repository.save(row);
        } catch (Exception error) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to save configuration"); }
        value.remove("notification"); return value;
    }
    @Transactional
    public ObjectNode saveMail(ObjectNode input) {
        var row = repository.findForUpdate("contact").orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var value = parse(row.getConfiguration());
        var notification = input.deepCopy();
        input.fieldNames().forEachRemaining(key -> { if (!Set.of("enabled", "recipients", "smtp").contains(key)) invalid("Unknown mail configuration field"); });
        if (!(notification.path("smtp") instanceof ObjectNode)) invalid("SMTP configuration is required");
        var smtp = (ObjectNode) notification.path("smtp");
        if (smtp.path("password").asText().isEmpty() && !smtp.path("clearPassword").asBoolean()) {
            smtp.put("password", value.path("notification").path("smtp").path("password").asText());
        }
        smtp.remove(List.of("passwordConfigured", "clearPassword"));
        validateNotification(notification);
        value.set("notification", notification);
        try { row.setConfiguration(mapper.writeValueAsString(value)); repository.save(row); }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to save mail configuration"); }
        return maskedNotification(notification);
    }
    private ObjectNode parse(String json) {
        try { return (ObjectNode) mapper.readTree(json); }
        catch (Exception error) { throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid stored configuration"); }
    }
    private void validateContact(ObjectNode value) {
        var contact = value.path("contact");
        translated(contact.path("headquarters"), 255, true); translated(contact.path("address"), 2000, true);
        translated(contact.path("port"), 500, false);
        text(contact, "phone", 255); text(contact, "fax", 255); website(contact.path("website").asText());
        if (!contact.path("emails").isArray() || contact.path("emails").size() > 10) invalid("Maximum 10 contact emails");
        for (var email : contact.path("emails")) if (!validEmail(email.asText())) invalid("Invalid contact email");
        validateSocialLinks(contact.path("socialLinks"));
        if (!value.path("subsidiaries").isArray() || value.path("subsidiaries").size() > 50) invalid("Maximum 50 subsidiaries");
        var ids = new HashSet<String>();
        for (var item : value.path("subsidiaries")) {
            if (!item.path("id").asText().matches("[a-zA-Z0-9-]{1,100}") || !ids.add(item.path("id").asText())) invalid("Invalid subsidiary ID");
            translated(item.path("name"), 255, true); translated(item.path("address"), 2000, true);
            text(item, "phone", 255); website(item.path("website").asText());
            if (!item.path("email").asText().isBlank() && !validEmail(item.path("email").asText())) invalid("Invalid subsidiary email");
        }
        var form = value.path("form");
        for (String key : List.of("title", "buttonText", "successText", "closedText")) translated(form.path(key), 1000, true);
        translated(form.path("privacyText"), 1000, false);
        if (!form.path("requiredFields").isArray()) invalid("Required fields are invalid");
        for (var field : form.path("requiredFields")) if (!FORM_FIELDS.contains(field.asText())) invalid("Invalid form field");
        var upload = value.path("upload");
        if (upload.path("maxFileSizeMb").asInt() < 1 || upload.path("maxFileSizeMb").asInt() > 50) invalid("File size must be 1 to 50 MB");
        if (upload.path("maxFiles").asInt() < 1 || upload.path("maxFiles").asInt() > 10) invalid("File count must be 1 to 10");
        if (!upload.path("allowedExtensions").isArray() || (upload.path("enabled").asBoolean() && upload.path("allowedExtensions").isEmpty())) invalid("Select permitted file types");
        for (var extension : upload.path("allowedExtensions")) if (!FILE_TYPES.contains(extension.asText())) invalid("Unsupported file type");
    }
    private void validateSocialLinks(JsonNode locales) {
        if (locales.isMissingNode()) return;
        if (!locales.isObject() || locales.size() > 30) invalid("Invalid social link languages");
        locales.fields().forEachRemaining(entry -> {
            if (!entry.getKey().matches("[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*")) invalid("Invalid social link language");
            var links = entry.getValue();
            if (!links.isArray() || links.size() > 8) invalid("Maximum 8 social links per language");
            var ids = new HashSet<String>();
            for (var link : links) {
                if (!link.isObject() || !link.path("id").asText().matches("[a-zA-Z0-9-]{1,100}") || !ids.add(link.path("id").asText())) invalid("Invalid social link ID");
                if (!SOCIAL_PLATFORMS.contains(link.path("platform").asText())) invalid("Invalid social platform");
                if (!link.path("enabled").isBoolean()) invalid("Invalid social link visibility");
                text(link, "label", 100); text(link, "url", 1000);
                var icon = link.path("icon");
                if (!icon.isMissingNode() && !icon.isTextual()) invalid("Invalid custom social icon");
                if (!icon.asText().isEmpty() && !icon.asText().matches("/api/uploads/images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|webp)")) invalid("Custom social icons must be uploaded images");
                if (link.path("platform").asText().equals("link") && link.path("enabled").asBoolean() && link.path("label").asText().isBlank()) invalid("A visible custom link requires a name");
                String url = link.path("url").asText().trim();
                if ((link.path("enabled").asBoolean() || !url.isEmpty()) && !validSocialUrl(url)) invalid("A visible social link requires a complete HTTP or HTTPS URL");
            }
        });
    }
    private static boolean validSocialUrl(String value) {
        try {
            if (value.matches(".*\\s.*")) return false;
            var uri = URI.create(value);
            return Set.of("http", "https").contains(Optional.ofNullable(uri.getScheme()).orElse("").toLowerCase(Locale.ROOT))
                && uri.getHost() != null && uri.getRawUserInfo() == null;
        } catch (IllegalArgumentException error) { return false; }
    }
    private void validateNotification(JsonNode notification) {
        if (!notification.path("recipients").isArray() || notification.path("recipients").size() > 20) invalid("Maximum 20 recipients");
        var emails = new HashSet<String>(); var active = 0;
        for (var recipient : notification.path("recipients")) {
            String email = recipient.path("email").asText().trim().toLowerCase(Locale.ROOT);
            if (!validEmail(email) || !emails.add(email)) invalid("Invalid or duplicate recipient");
            if (recipient.path("enabled").asBoolean()) active++;
        }
        var smtp = notification.path("smtp");
        text(smtp, "host", 255); text(smtp, "username", 255); text(smtp, "password", 1000);
        if (smtp.path("host").asText().contains("/") || smtp.path("host").asText().matches(".*\\s.*")) invalid("Invalid SMTP host");
        if (smtp.path("port").asInt() < 1 || smtp.path("port").asInt() > 65535) invalid("Invalid SMTP port");
        if (!Set.of("starttls", "ssl", "none").contains(smtp.path("security").asText())) invalid("Invalid SMTP security mode");
        if (!smtp.path("from").asText().isBlank() && !validEmail(smtp.path("from").asText())) invalid("Invalid sender email");
        if (notification.path("enabled").asBoolean() && (active == 0 || smtp.path("host").asText().isBlank() || !validEmail(smtp.path("from").asText()) || (!smtp.path("username").asText().isBlank() && smtp.path("password").asText().isBlank()))) invalid("Complete sender configuration and select recipients before enabling notifications");
    }
    private static void translated(JsonNode value, int max, boolean required) {
        if (!value.isObject()) invalid("Bilingual text is required");
        for (String locale : List.of("en", "zh")) {
            var text = value.path(locale).asText();
            if (text.length() > max || (required && text.isBlank())) invalid("Complete both Chinese and English text");
        }
    }
    private static void text(JsonNode value, String key, int max) {
        if (value.path(key).asText().length() > max || value.path(key).asText().contains("\r") || value.path(key).asText().contains("\n")) invalid("Invalid " + key);
    }
    private static void website(String value) {
        if (value.length() > 500 || (!value.isBlank() && !value.matches("(?i)(https?://)?[a-z0-9][a-z0-9.-]+(?::[0-9]+)?(?:/[^\\s]*)?"))) invalid("Invalid website");
    }
    public static boolean validEmail(String value) { return value != null && value.length() <= 255 && value.matches("^[^\\s@<>,;]+@[^\\s@<>,;]+\\.[^\\s@<>,;]+$"); }
    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
