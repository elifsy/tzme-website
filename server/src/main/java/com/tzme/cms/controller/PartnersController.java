package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.service.PartnersService;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;

@RestController
@RequestMapping("/api/partners")
public class PartnersController {
    private final PartnersService service;
    public PartnersController(PartnersService service) { this.service = service; }
    @GetMapping public ObjectNode get() { return service.get(); }
    @PutMapping public ObjectNode save(@RequestBody ObjectNode input) throws IOException { return service.save(input); }
}
