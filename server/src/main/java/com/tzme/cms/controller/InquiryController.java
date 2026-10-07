package com.tzme.cms.controller;

import com.tzme.cms.model.Inquiry;
import com.tzme.cms.repository.InquiryRepository;
import com.tzme.cms.repository.InquiryAttachmentRepository;
import com.tzme.cms.service.ContactSettingsService;
import com.tzme.cms.service.InquiryNotificationService;
import com.tzme.cms.service.AnalyticsService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {
    private final InquiryRepository repository;
    private final InquiryAttachmentRepository files;
    private final ContactSettingsService settings;
    private final InquiryNotificationService notification;
    private final AnalyticsService analytics;

    public InquiryController(InquiryRepository repository, InquiryAttachmentRepository files, ContactSettingsService settings, InquiryNotificationService notification, AnalyticsService analytics) {
        this.repository = repository; this.files = files; this.settings = settings; this.notification = notification;
        this.analytics = analytics;
    }

    @GetMapping
    public List<Inquiry> list() {
        var rows = repository.findAllByOrderByCreatedAtDesc();
        rows.forEach(row -> row.setAttachments(files.findByInquiryIdOrderByCreatedAtAsc(row.getId())));
        return rows;
    }

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody JsonNode input) {
        var config = settings.configuration();
        if (!config.path("form").path("enabled").asBoolean()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Inquiries are disabled");
        var item = new Inquiry(); copyFields(item, input);
        String locale = input.path("locale").asText("en");
        if (!locale.matches("[a-zA-Z][a-zA-Z0-9-]{1,19}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid locale");
        item.setLocale(locale);
        for (var field : config.path("form").path("requiredFields")) {
            if (input.path(field.asText()).asText().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing " + field.asText());
        }
        var ids = input.path("attachmentIds");
        if ((!ids.isMissingNode() && !ids.isArray()) || ids.size() > config.path("upload").path("maxFiles").asInt() || (ids.size() > 0 && !config.path("upload").path("enabled").asBoolean())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachments");
        item = repository.save(item);
        var unique = new HashSet<String>();
        for (var id : ids) {
            if (!unique.add(id.asText())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate attachment");
            var file = files.findForClaim(id.asText()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown attachment"));
            boolean allowed = false;
            for (var extension : config.path("upload").path("allowedExtensions")) if (extension.asText().equals(file.getExtension())) allowed = true;
            if (file.getInquiryId() != null || !allowed || file.getSize() > config.path("upload").path("maxFileSizeMb").asLong() * 1024 * 1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachment is unavailable");
            file.setInquiryId(item.getId()); files.save(file);
        }
        notification.enqueue(item, config); repository.save(item);
        analytics.inquirySaved(input.get("analytics"), locale, item.getId());
        return Map.of("id", item.getId(), "createdAt", item.getCreatedAt());
    }

    @PutMapping("/{id}")
    @Transactional
    public Inquiry update(@PathVariable Long id, @RequestBody JsonNode input) {
        if (!input.isObject() || !input.path("status").isTextual()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only the processing status can be changed");
        input.fieldNames().forEachRemaining(key -> {
            if (!key.equals("status")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer inquiry information is read-only");
        });
        String status = input.path("status").asText();
        if (!Set.of("new", "contacted", "closed").contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        repository.updateProcessingStatus(id, status);
        var item = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        item.setAttachments(files.findByInquiryIdOrderByCreatedAtAsc(id)); return item;
    }
    @PostMapping("/{id}/notify") @Transactional
    public Inquiry retryNotification(@PathVariable Long id) {
        var item = repository.findForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (Set.of("pending", "sending").contains(item.getMailStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Notification is already queued");
        var config = settings.configuration();
        if (!config.path("notification").path("enabled").asBoolean()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enable and configure notifications first");
        notification.enqueue(item, config); repository.save(item); item.setAttachments(files.findByInquiryIdOrderByCreatedAtAsc(id)); return item;
    }
    private void copyFields(Inquiry item, JsonNode input) {
        if (input.has("name")) item.setName(text(input, "name", 255));
        if (input.has("company")) item.setCompany(text(input, "company", 255));
        if (input.has("country")) item.setCountry(text(input, "country", 255));
        if (input.has("phone")) item.setPhone(text(input, "phone", 255));
        if (input.has("industry")) item.setIndustry(text(input, "industry", 255));
        if (input.has("requirements")) item.setRequirements(text(input, "requirements", 6000));
        if (input.has("email")) {
            String email = text(input, "email", 255);
            if (!email.isBlank() && !ContactSettingsService.validEmail(email)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email");
            item.setEmail(email);
        }
    }
    private static String text(JsonNode value, String key, int max) {
        if (!value.path(key).isTextual() || value.path(key).asText().length() > max) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + key);
        return value.path(key).asText().trim();
    }
}
