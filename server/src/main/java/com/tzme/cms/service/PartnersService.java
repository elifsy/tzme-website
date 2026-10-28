package com.tzme.cms.service;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.model.SiteSettings;
import com.tzme.cms.repository.SiteSettingsRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.util.*;

@Service
public class PartnersService {
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;
    private final ObjectNode defaults;
    public PartnersService(SiteSettingsRepository repository, ObjectMapper mapper) throws IOException {
        this.repository = repository; this.mapper = mapper;
        try (var stream = new ClassPathResource("partners-defaults.json").getInputStream()) {
            defaults = (ObjectNode) mapper.readTree(stream);
        }
    }
    @Transactional(readOnly = true)
    public ObjectNode get() {
        return repository.findById("partners").map(row -> {
            try { return (ObjectNode) mapper.readTree(row.getConfiguration()); }
            catch (IOException error) { throw new IllegalStateException("Invalid partner settings", error); }
        }).orElseGet(defaults::deepCopy);
    }
    @Transactional
    public ObjectNode save(ObjectNode input) throws IOException {
        var value = validate(input);
        var row = repository.findForUpdate("partners").orElseGet(SiteSettings::new);
        row.setId("partners"); row.setConfiguration(mapper.writeValueAsString(value)); repository.saveAndFlush(row);
        return value;
    }
    public static ObjectNode validate(ObjectNode input) {
        if (input == null) throw invalid();
        var value = input.deepCopy();
        keys(value, Set.of("enabled", "showOnHome", "showOnAbout", "kicker", "title", "description", "items"));
        for (String key : List.of("enabled", "showOnHome", "showOnAbout")) if (!value.path(key).isBoolean()) throw invalid();
        text(value, "kicker", 100); text(value, "title", 160); text(value, "description", 800);
        var items = value.path("items");
        if (!items.isArray() || items.size() > 80) throw invalid();
        var ids = new HashSet<String>();
        for (var item : items) {
            keys(item, Set.of("id", "name", "image", "enabled"));
            String id = text((ObjectNode) item, "id", 80);
            if (!id.matches("[a-zA-Z0-9_-]+") || !ids.add(id) || !item.path("enabled").isBoolean()) throw invalid();
            text((ObjectNode) item, "name", 160);
            String image = text((ObjectNode) item, "image", 500);
            if (!image.matches("/(?:assets/[a-zA-Z0-9_./-]+|api/uploads/images/[a-zA-Z0-9_.-]+)") || image.contains("..")) throw invalid();
        }
        return value;
    }
    private static String text(ObjectNode node, String key, int max) {
        var field = node.path(key);
        if (!field.isTextual()) throw invalid();
        String text = field.asText().trim();
        if (text.isBlank() || text.length() > max || text.chars().anyMatch(c -> c < 32 && c != '\n')) throw invalid();
        node.put(key, text); return text;
    }
    private static void keys(JsonNode node, Set<String> keys) {
        if (!node.isObject() || node.size() != keys.size()) throw invalid();
        node.fieldNames().forEachRemaining(key -> { if (!keys.contains(key)) throw invalid(); });
    }
    private static ResponseStatusException invalid() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete partner names, local logo images and display settings"); }
}
