package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.service.ContactSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact-settings")
public class ContactSettingsController {
    private final ContactSettingsService service;
    public ContactSettingsController(ContactSettingsService service) { this.service = service; }
    @GetMapping public ObjectNode get() { return service.publicConfiguration(); }
    @GetMapping("/admin") public ObjectNode admin() { return service.adminConfiguration(); }
    @PutMapping("/admin") public ObjectNode save(@RequestBody ObjectNode value) { return service.save(value); }
}
