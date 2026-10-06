package com.tzme.cms.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.model.HomeGlobal;
import com.tzme.cms.model.HomeGlobalSettings;
import com.tzme.cms.repository.HomeGlobalRepository;
import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.HashSet;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/home-global")
public class HomeGlobalController {
    private final HomeGlobalRepository repository;
    private final ObjectMapper mapper;
    private final HomeGlobalSettings defaults;

    public HomeGlobalController(HomeGlobalRepository repository, ObjectMapper mapper) throws IOException {
        this.repository = repository;
        this.mapper = mapper;
        try (var input = new ClassPathResource("home-global-defaults.json").getInputStream()) {
            this.defaults = mapper.readValue(input, HomeGlobalSettings.class);
        }
    }

    @GetMapping
    public HomeGlobalSettings get() throws JsonProcessingException {
        var existing = repository.findById(1L);
        return (existing.isPresent()
                ? mapper.readValue(existing.get().getConfiguration(), HomeGlobalSettings.class) : defaults).withMapDefaults();
    }

    @PutMapping
    @Transactional
    public HomeGlobalSettings save(@Valid @RequestBody HomeGlobalSettings input) throws JsonProcessingException {
        input = input.withMapDefaults();
        for (var text : List.of(input.kicker(), input.titleLine1(), input.description(), input.imageAlt())) {
            requireText(text);
        }
        for (var statistic : input.statistics()) requireText(statistic.label());
        if (input.showButton()) requireText(input.buttonText());
        if (("image".equals(input.mapMode()) && !safeUrl(input.image())) || !safeUrl(input.buttonLink())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an absolute site path or an HTTP(S) URL");
        }
        var pointIds = new HashSet<String>();
        for (var point : input.mapPoints()) {
            requireText(point.label());
            if (!pointIds.add(point.id()) || !Double.isFinite(point.x()) || !Double.isFinite(point.y())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Map points must have unique IDs and finite coordinates");
            }
            if (point.label().en().length() > 120 || point.label().zh().length() > 120) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Map point names must be at most 120 characters");
            }
        }
        var record = new HomeGlobal();
        record.setId(1L);
        record.setConfiguration(mapper.writeValueAsString(input));
        repository.save(record);
        return input;
    }

    private static void requireText(HomeGlobalSettings.Text text) {
        if (text.en().isBlank() || text.zh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "English and Chinese content are required");
        }
    }

    private static boolean safeUrl(String value) {
        if (!value.equals(value.trim()) || value.chars().anyMatch(c -> c <= 32 || c == 127)
                || value.contains("\\")) return false;
        try {
            URI uri = URI.create(value);
            if (value.startsWith("/") && !value.startsWith("//")) return uri.getRawAuthority() == null;
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (IllegalArgumentException error) { return false; }
    }
}
