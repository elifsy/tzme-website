package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.model.SiteSettings;
import com.tzme.cms.repository.ContentRepository;
import com.tzme.cms.repository.IndustryRepository;
import com.tzme.cms.repository.SiteSettingsRepository;
import java.io.IOException;
import java.util.Set;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/product-showcase")
public class ProductShowcaseController {
    private static final String ID = "product-showcase";
    private final SiteSettingsRepository settings;
    private final IndustryRepository industries;
    private final ContentRepository products;
    private final ObjectMapper mapper;
    private final ObjectNode defaults;

    public ProductShowcaseController(SiteSettingsRepository settings, IndustryRepository industries,
            ContentRepository products, ObjectMapper mapper) throws IOException {
        this.settings = settings;
        this.industries = industries;
        this.products = products;
        this.mapper = mapper;
        try (var stream = new ClassPathResource("product-showcase-defaults.json").getInputStream()) {
            this.defaults = (ObjectNode) mapper.readTree(stream);
        }
    }

    @GetMapping
    public JsonNode get() throws IOException {
        var row = settings.findById(ID);
        ObjectNode value = row.isPresent() ? (ObjectNode) mapper.readTree(row.get().getConfiguration()) : defaults.deepCopy();
        if (!value.path("overview").has("threeD")) ((ObjectNode) value.path("overview")).set("threeD", defaults.path("overview").path("threeD").deepCopy());
        return value;
    }

    @PutMapping
    @Transactional
    public ObjectNode save(@RequestBody ObjectNode input) throws IOException {
        exact(input, Set.of("overview", "industries"));
        ObjectNode value = input.deepCopy();
        var existing = settings.findForUpdate(ID);
        if (value.path("overview").isObject() && !value.path("overview").has("threeD")) {
            JsonNode saved = existing.isPresent() ? mapper.readTree(existing.get().getConfiguration()).path("overview").path("threeD") : null;
            ((ObjectNode) value.path("overview")).set("threeD", saved != null && saved.isObject() ? saved : defaults.path("overview").path("threeD").deepCopy());
        }
        scene(value.path("overview"), true, "");
        JsonNode entries = value.path("industries");
        if (!entries.isObject() || entries.size() > 300) invalid("Invalid industry scenes");
        entries.fields().forEachRemaining(entry -> {
            if (!validId(entry.getKey()) || !industries.existsById(entry.getKey())) invalid("Unknown industry");
            scene(entry.getValue(), false, entry.getKey());
        });
        SiteSettings row = existing.orElseGet(() -> {
            SiteSettings created = new SiteSettings();
            created.setId(ID);
            return created;
        });
        row.setConfiguration(mapper.writeValueAsString(value));
        settings.save(row);
        return value;
    }

    private void scene(JsonNode value, boolean overview, String sceneIndustry) {
        exact(value, overview
                ? Set.of("kicker", "title", "description", "primaryText", "secondaryText", "image", "imageAlt", "presentation", "featuredProducts", "hotspots", "threeD")
                : Set.of("title", "description", "image", "imageAlt", "presentation", "hotspots"));
        text(value, "title", 240, overview);
        text(value, "description", 1500, overview);
        text(value, "imageAlt", 240, false);
        if (overview) {
            JsonNode viewer = value.path("threeD");
            // Accept the previous tourDuration field so existing saved settings
            // and older clients remain valid; the current viewer does not use it.
            exact(viewer, viewer.has("tourDuration") ? Set.of("enabled", "tourDuration", "models") : Set.of("enabled", "models"));
            if (!viewer.path("enabled").isBoolean()) invalid("Invalid 3D viewer settings");
            if (viewer.has("tourDuration") && (!viewer.path("tourDuration").isNumber()
                    || !Double.isFinite(viewer.path("tourDuration").asDouble()) || viewer.path("tourDuration").asDouble() < 15 || viewer.path("tourDuration").asDouble() > 120)) invalid("Invalid legacy viewer settings");
            if (!viewer.path("models").isObject() || viewer.path("models").size() > 300) invalid("Invalid industry models");
            var slots = viewer.path("models").fieldNames();
            while (slots.hasNext()) {
                String slot = slots.next();
                if (!validId(slot) || !industries.existsById(slot)) invalid("Unknown model industry");
                text(viewer.path("models"), slot, 500, false);
                String model = viewer.path("models").path(slot).asText();
                if (!model.isEmpty() && !model.matches("/assets/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\\.glb")
                        && !model.matches("/api/uploads/models/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.glb")) invalid("Use an uploaded or project GLB model");
            }
            text(value, "kicker", 100, true);
            text(value, "primaryText", 60, true);
            text(value, "secondaryText", 60, true);
            JsonNode featured = value.path("featuredProducts");
            if (!featured.isArray() || featured.size() > 12) invalid("Select up to 12 priority products");
            var seen = new java.util.HashSet<String>();
            for (JsonNode product : featured) {
                if (!product.isTextual() || !validId(product.asText()) || !seen.add(product.asText())
                        || products.findByIdAndType(product.asText(), "products").isEmpty()) invalid("Unknown or repeated priority product");
            }
        }
        text(value, "image", 500, overview);
        String image = value.path("image").asText();
        boolean uploaded = image.matches("/api/uploads/images/[0-9a-f-]{36}\\.(jpg|png|gif|webp)");
        boolean asset = image.matches("/assets/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\\.(jpg|jpeg|png|gif|webp)");
        if (!image.isEmpty() && !uploaded && !asset) invalid("Use a project or uploaded scene image");
        if (!Set.of("scene", "photo").contains(value.path("presentation").asText())) invalid("Invalid scene presentation");
        JsonNode hotspots = value.path("hotspots");
        if (!hotspots.isArray() || hotspots.size() > 12) invalid("A scene supports up to 12 hotspots");
        for (JsonNode hotspot : hotspots) {
            exact(hotspot, Set.of("label", "industryId", "productId", "x", "y"));
            text(hotspot, "label", 80, true);
            text(hotspot, "industryId", 100, false);
            text(hotspot, "productId", 100, false);
            for (String coordinate : Set.of("x", "y")) {
                JsonNode number = hotspot.path(coordinate);
                if (!number.isNumber() || !Double.isFinite(number.asDouble()) || number.asDouble() < 0 || number.asDouble() > 100) invalid("Hotspot position must be between 0 and 100");
            }
            String industry = hotspot.path("industryId").asText();
            String product = hotspot.path("productId").asText();
            if (industry.isEmpty() && product.isEmpty()) invalid("Link the hotspot to an industry or product");
            if (!industry.isEmpty() && (!validId(industry) || !industries.existsById(industry))) invalid("Unknown hotspot industry");
            if (!sceneIndustry.isEmpty() && !industry.isEmpty() && !sceneIndustry.equals(industry)) invalid("Hotspot must belong to this industry");
            if (!product.isEmpty()) {
                if (!validId(product)) invalid("Invalid hotspot product");
                var record = products.findByIdAndType(product, "products").orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown hotspot product"));
                if (!"products".equals(record.getType()) || "deleted".equals(record.getStatus())) invalid("Unknown hotspot product");
                String requiredIndustry = sceneIndustry.isEmpty() ? industry : sceneIndustry;
                if (!requiredIndustry.isEmpty() && !record.getIndustries().contains(requiredIndustry)) invalid("Product is not associated with this industry");
            }
        }
    }

    private static void text(JsonNode value, String key, int max, boolean required) {
        JsonNode node = value.path(key);
        if (!node.isTextual() || node.asText().length() > max || (required && node.asText().isBlank())) invalid("Invalid " + key);
        ((ObjectNode) value).put(key, node.asText().trim());
    }

    private static boolean validId(String value) {
        return value.matches("[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}") && !Set.of("__proto__", "constructor", "prototype").contains(value);
    }

    private static void exact(JsonNode value, Set<String> keys) {
        if (value == null || !value.isObject() || value.size() != keys.size()) invalid("Incomplete scene configuration");
        value.fieldNames().forEachRemaining(key -> { if (!keys.contains(key)) invalid("Unknown scene field"); });
    }

    private static void invalid(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
