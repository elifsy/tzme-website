package com.tzme.cms.controller;

import com.tzme.cms.model.Inquiry;
import com.tzme.cms.repository.InquiryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {
    private final InquiryRepository repository;

    public InquiryController(InquiryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Inquiry> list() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Inquiry create(@RequestBody Inquiry inquiry) {
        return repository.save(inquiry);
    }

    @PutMapping("/{id}")
    public Inquiry update(@PathVariable Long id, @RequestBody Inquiry input) {
        Inquiry item = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        item.setStatus(input.getStatus());
        return repository.save(item);
    }
}
