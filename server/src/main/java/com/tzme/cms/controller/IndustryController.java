package com.tzme.cms.controller;

import com.tzme.cms.model.Content;
import com.tzme.cms.model.Industry;
import com.tzme.cms.repository.ContentRepository;
import com.tzme.cms.repository.IndustryRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/industries")
public class IndustryController {
    private static final Set<String> INITIAL_IDS = Set.of(
            "mining", "ports", "metallurgy", "energy", "construction");
    private final IndustryRepository repository;
    private final ContentRepository contentRepository;

    public IndustryController(IndustryRepository repository, ContentRepository contentRepository) {
        this.repository = repository;
        this.contentRepository = contentRepository;
    }

    @GetMapping
    public List<Industry> list() {
        return repository.findAllByOrderBySortOrderAscTitleEnAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Industry create(@RequestBody Industry input) {
        if (input.getIcon() == null) input.setIcon("");
        validate(input);
        if (input.getId() == null || input.getId().isBlank()) {
            input.setId("industry-" + UUID.randomUUID());
        }
        if (repository.existsById(input.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Industry already exists");
        }
        return repository.save(input);
    }

    @PutMapping("/{id}")
    public Industry update(@PathVariable String id, @RequestBody Industry input) {
        validate(input);
        Industry existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setTitleEn(input.getTitleEn());
        existing.setTitleZh(input.getTitleZh());
        existing.setSubtitleEn(input.getSubtitleEn());
        existing.setSubtitleZh(input.getSubtitleZh());
        // An omitted icon from an older client preserves the saved image.
        if (input.getIcon() != null) existing.setIcon(input.getIcon());
        existing.setSortOrder(input.getSortOrder());
        existing.setStatus(input.getStatus());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (INITIAL_IDS.contains(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Default industries can be unpublished but not deleted");
        }
        for (Content product : contentRepository.findAllByTypeOrderByDateDesc("products")) {
            if (!"deleted".equals(product.getStatus()) && product.getIndustries().contains(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Industry is in use by products");
            }
        }
        Industry existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setStatus("deleted");
        repository.save(existing);
    }

    private void validate(Industry input) {
        if (input.getTitleEn() == null || input.getTitleEn().isBlank()
                || input.getTitleZh() == null || input.getTitleZh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "English and Chinese names are required");
        }
        input.setTitleEn(input.getTitleEn().trim());
        input.setTitleZh(input.getTitleZh().trim());
        if (input.getIcon() != null) {
            String icon = input.getIcon().trim();
            boolean uploaded = icon.matches("/api/uploads/images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|webp)");
            boolean preset = INITIAL_IDS.stream().anyMatch(id -> icon.equals("/assets/industry-icons/" + id + ".svg"));
            if (!icon.isEmpty() && !uploaded && !preset) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select an uploaded industry icon");
            }
            input.setIcon(icon);
        }
        if (input.getStatus() == null || input.getStatus().isBlank()) input.setStatus("published");
        if (!Set.of("published", "draft").contains(input.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid publication status");
        }
    }
}
