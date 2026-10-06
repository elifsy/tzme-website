package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.service.ContactSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mail-settings")
public class MailSettingsController {
    private final ContactSettingsService settings;
    public MailSettingsController(ContactSettingsService settings) { this.settings = settings; }
    @GetMapping public ObjectNode get() { return settings.mailConfiguration(); }
    @PutMapping public ObjectNode save(@RequestBody ObjectNode value) { return settings.saveMail(value); }
}
