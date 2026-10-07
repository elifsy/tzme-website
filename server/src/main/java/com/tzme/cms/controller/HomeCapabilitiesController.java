package com.tzme.cms.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.repository.SiteSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/home-capabilities")
public class HomeCapabilitiesController {
    private static final int MAX_STEPS = 8;
    private static final Set<String> ICON_NAMES = Set.of("idea", "engineering", "design", "fabrication", "assembly", "delivery", "general");
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;

    public HomeCapabilitiesController(SiteSettingsRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @GetMapping
    public JsonNode get() throws JsonProcessingException {
        var row = repository.findById("capabilities").orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize the homepage capabilities configuration first"));
        return mapper.readTree(row.getConfiguration());
    }

    @PutMapping
    @Transactional
    public ObjectNode save(@RequestBody ObjectNode input) throws JsonProcessingException {
        var value = input.deepCopy();
        validate(value);
        var row = repository.findForUpdate("capabilities").orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Initialize the homepage capabilities configuration first"));
        row.setConfiguration(mapper.writeValueAsString(value));
        repository.save(row);
        return value;
    }

    private static void validate(ObjectNode value) {
        exactKeys(value, Set.of("enabled", "kicker", "titleLine1", "titleLine2", "description", "image", "imageAlt", "steps"));
        if (!value.path("enabled").isBoolean()) invalid("Invalid section visibility");
        translated(value.path("kicker"), 100, true, false);
        translated(value.path("titleLine1"), 120, true, false);
        translated(value.path("titleLine2"), 120, false, false);
        translated(value.path("description"), 1000, true, true);
        translated(value.path("imageAlt"), 255, false, false);
        image(value, "image", true);
        var steps = value.path("steps");
        if (!steps.isArray() || steps.size() > MAX_STEPS) invalid("Maximum 8 capability steps");
        var ids = new HashSet<String>();
        int visible = 0;
        for (var step : steps) {
            if (!(step instanceof ObjectNode)) invalid("Invalid capability step");
            var item = (ObjectNode) step;
            exactKeys(item, Set.of("id", "label", "enabled", "iconMode", "iconName", "icon"));
            if (!item.path("id").isTextual() || !item.path("id").asText().matches("[a-zA-Z0-9-]{1,100}") || !ids.add(item.path("id").asText())) invalid("Invalid capability step ID");
            if (!item.path("enabled").isBoolean()) invalid("Invalid step visibility");
            boolean enabled = item.path("enabled").asBoolean();
            if (enabled) visible++;
            translated(item.path("label"), 100, enabled, false);
            if (!Set.of("preset", "image").contains(item.path("iconMode").asText()) || !ICON_NAMES.contains(item.path("iconName").asText())) invalid("Invalid capability icon");
            image(item, "icon", false);
            if (enabled && item.path("iconMode").asText().equals("image") && item.path("icon").asText().isEmpty()) invalid("Upload an icon for each visible image step");
        }
        if (value.path("enabled").asBoolean() && visible == 0) invalid("A visible section requires at least one enabled step");
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
            if (text.length() > max || (!multiline && (text.contains("\n") || text.contains("\r"))) || (required && Set.of("en", "zh").contains(entry.getKey()) && text.isBlank())) invalid("Invalid or missing translated text");
            ((ObjectNode) value).put(entry.getKey(), text);
        });
    }

    private static void image(ObjectNode value, String key, boolean background) {
        if (!value.path(key).isTextual()) invalid("Invalid image");
        String path = value.path(key).asText().trim();
        boolean uploaded = path.matches("/api/uploads/images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|webp)");
        boolean preset = background && path.matches("/assets/[a-zA-Z0-9_-]+\\.(jpg|png|gif|webp)");
        if (!path.isEmpty() && !uploaded && !preset) invalid("Select an uploaded image");
        value.put(key, path);
    }

    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
