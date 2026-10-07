package com.tzme.cms.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.repository.SiteSettingsRepository;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/about-tzme")
public class AboutTzmeController {
    private static final String SETTINGS_ID = "about-tzme";
    private static final int ENTRY_COUNT = 4;
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;

    public AboutTzmeController(SiteSettingsRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @GetMapping
    public JsonNode get() throws JsonProcessingException {
        var row = repository.findById(SETTINGS_ID).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize the About TZME configuration first"));
        return mapper.readTree(row.getConfiguration());
    }

    @PutMapping
    @Transactional
    public ObjectNode save(@RequestBody ObjectNode input) throws JsonProcessingException {
        var value = input.deepCopy();
        exactKeys(value, Set.of("home", "about"));
        section(value.path("home"));
        section(value.path("about"));
        var row = repository.findForUpdate(SETTINGS_ID).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize the About TZME configuration first"));
        row.setConfiguration(mapper.writeValueAsString(value));
        repository.save(row);
        return value;
    }

    private static void section(JsonNode node) {
        if (!(node instanceof ObjectNode)) invalid("Invalid About TZME section");
        var value = (ObjectNode) node;
        exactKeys(value, Set.of("kicker", "titleLine1", "titleLine2", "description", "description2", "image", "imageAlt", "entries"));
        translated(value.path("kicker"), 100, true, false);
        translated(value.path("titleLine1"), 120, true, false);
        translated(value.path("titleLine2"), 120, false, false);
        translated(value.path("description"), 2000, true, true);
        translated(value.path("description2"), 2000, false, true);
        translated(value.path("imageAlt"), 255, false, false);
        if (!value.path("image").isTextual()) invalid("Invalid section image");
        String path = value.path("image").asText().trim();
        boolean uploaded = path.matches("/api/uploads/images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|webp)");
        boolean preset = path.matches("/assets/[a-zA-Z0-9_-]+\\.(jpg|png|gif|webp)");
        if (!path.isEmpty() && !uploaded && !preset) invalid("Select an uploaded image");
        value.put("image", path);
        var entries = value.path("entries");
        if (!entries.isArray() || entries.size() != ENTRY_COUNT) invalid("Each section must contain exactly four entries");
        for (var entry : entries) {
            if (!(entry instanceof ObjectNode)) invalid("Invalid About TZME entry");
            exactKeys((ObjectNode) entry, Set.of("value", "suffix", "label"));
            translated(entry.path("value"), 60, true, false);
            translated(entry.path("suffix"), 20, false, false);
            translated(entry.path("label"), 100, true, false);
        }
    }

    private static void exactKeys(ObjectNode value, Set<String> fields) {
        if (value.size() != fields.size()) invalid("Configuration fields are incomplete");
        value.fieldNames().forEachRemaining(key -> { if (!fields.contains(key)) invalid("Unknown configuration field"); });
    }

    private static void translated(JsonNode value, int max, boolean required, boolean multiline) {
        if (!value.isObject() || value.size() > 30 || !value.path("en").isTextual() || !value.path("zh").isTextual()) invalid("Complete English and Chinese text");
        value.fields().forEachRemaining(entry -> {
            if (!entry.getKey().matches("[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*") || !entry.getValue().isTextual()) invalid("Invalid translated text");
            String text = entry.getValue().asText().trim();
            if (text.length() > max || (!multiline && (text.contains("\n") || text.contains("\r")))
                    || (required && Set.of("en", "zh").contains(entry.getKey()) && text.isBlank())) invalid("Invalid or missing translated text");
            ((ObjectNode) value).put(entry.getKey(), text);
        });
    }

    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
