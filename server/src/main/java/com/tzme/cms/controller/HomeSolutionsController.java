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
@RequestMapping("/api/home-solutions")
public class HomeSolutionsController {
    private static final String SETTINGS_ID = "home-solutions";
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;

    public HomeSolutionsController(SiteSettingsRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @GetMapping
    public JsonNode get() throws JsonProcessingException {
        var row = repository.findById(SETTINGS_ID).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize homepage solution settings first"));
        return mapper.readTree(row.getConfiguration());
    }

    @PutMapping
    @Transactional
    public ObjectNode save(@RequestBody ObjectNode input) throws JsonProcessingException {
        if (input == null) invalid("Invalid homepage solution configuration");
        var value = input.deepCopy();
        exactKeys(value, Set.of("section", "products", "industries"));
        exactKeys(value.path("section"), Set.of("kicker", "title", "buttonText"));
        translated(value.path("section").path("kicker"), 100, true, false);
        translated(value.path("section").path("title"), 240, true, true);
        translated(value.path("section").path("buttonText"), 100, true, false);
        stories(value.path("products"));
        stories(value.path("industries"));
        var row = repository.findForUpdate(SETTINGS_ID).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize homepage solution settings first"));
        row.setConfiguration(mapper.writeValueAsString(value));
        repository.save(row);
        return value;
    }

    private static void stories(JsonNode node) {
        if (!node.isObject() || node.size() > 500) invalid("Too many solution copy entries");
        node.fields().forEachRemaining(entry -> {
            if (!validId(entry.getKey())) invalid("Invalid solution ID");
            var story = entry.getValue();
            exactKeys(story, Set.of("industry", "kicker", "title", "description"));
            if (!story.path("industry").isTextual()) invalid("Invalid solution industry");
            String industry = story.path("industry").asText().trim();
            if (!industry.isEmpty() && !validId(industry)) invalid("Invalid solution industry");
            ((ObjectNode) story).put("industry", industry);
            translated(story.path("kicker"), 100, false, false);
            translated(story.path("title"), 240, false, true);
            translated(story.path("description"), 2000, false, true);
        });
    }

    private static boolean validId(String value) {
        return value.matches("[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}")
                && !Set.of("__proto__", "constructor", "prototype").contains(value);
    }

    private static void exactKeys(JsonNode value, Set<String> fields) {
        if (!value.isObject() || value.size() != fields.size()) invalid("Configuration fields are incomplete");
        value.fieldNames().forEachRemaining(key -> { if (!fields.contains(key)) invalid("Unknown configuration field"); });
    }

    private static void translated(JsonNode value, int max, boolean required, boolean multiline) {
        if (!value.isObject() || value.size() > 30 || !value.path("zh").isTextual() || (value.has("en") && !value.path("en").isTextual())) invalid("Complete Chinese text");
        value.fields().forEachRemaining(entry -> {
            if (!entry.getKey().matches("[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*") || !entry.getValue().isTextual()) invalid("Invalid translated text");
            String text = entry.getValue().asText().trim();
            if (text.length() > max || (!multiline && (text.contains("\n") || text.contains("\r")))
                    || (required && entry.getKey().equals("zh") && text.isBlank())) invalid("Invalid or missing translated text");
            ((ObjectNode) value).put(entry.getKey(), text);
        });
    }

    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
