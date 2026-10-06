package com.tzme.cms.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.repository.SiteSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/site-settings")
public class SiteSettingsController {
    private final SiteSettingsRepository repository;
    private final ObjectMapper mapper;
    public SiteSettingsController(SiteSettingsRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }
    @GetMapping
    public JsonNode get() throws JsonProcessingException {
        var record = repository.findById("website").orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Import the database initialization SQL first"));
        return mapper.readTree(record.getConfiguration());
    }
}
