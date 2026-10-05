package com.tzme.cms.controller;

import com.tzme.cms.model.Project;
import com.tzme.cms.repository.ProjectRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private static final int MAX_HOME_PROJECTS = 3;
    private final ProjectRepository repository;

    public ProjectController(ProjectRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Project> list() { return repository.findAllByOrderBySortOrderAscIdAsc(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Project create(@RequestBody Project input) {
        if (input.getId() == null || input.getId().isBlank()) input.setId("project-" + UUID.randomUUID());
        validate(input);
        if (repository.existsById(input.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Project already exists");
        }
        enforceHomeLimit(input);
        return repository.save(input);
    }

    @PutMapping("/{id}")
    @Transactional
    public Project update(@PathVariable String id, @RequestBody Project input) {
        if (!repository.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        input.setId(id);
        validate(input);
        enforceHomeLimit(input);
        return repository.save(input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable String id) {
        Project existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Retain a marker so initial records stay deleted after a service restart.
        existing.setStatus("deleted");
        existing.setShowOnHome(false);
        repository.save(existing);
    }

    private void enforceHomeLimit(Project input) {
        if (!input.isShowOnHome()) return;
        // Lock the current records until commit so concurrent saves share the same limit.
        long selected = repository.lockForHomepageSelection().stream()
                .filter(project -> project.isShowOnHome() && !"deleted".equals(project.getStatus())
                        && !project.getId().equals(input.getId()))
                .count();
        if (selected >= MAX_HOME_PROJECTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The homepage can feature at most three projects");
        }
    }

    private void validate(Project input) {
        if (input.getId().length() > 100 || !input.getId().matches("[a-zA-Z0-9_-]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid project ID");
        }
        if (input.getTitleEn() == null || input.getTitleEn().isBlank()
                || input.getTitleZh() == null || input.getTitleZh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "English and Chinese titles are required");
        }
        input.setTitleEn(input.getTitleEn().trim());
        input.setTitleZh(input.getTitleZh().trim());
        if (!"published".equals(input.getStatus()) && !"draft".equals(input.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid publication status");
        }
        if (input.getSortOrder() < 0 || input.getHomeOrder() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display orders cannot be negative");
        }
        for (String value : input.cardTextValues()) {
            if (value != null && value.length() > 255) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card text must be at most 255 characters");
            }
        }
        if (input.getImage() != null && input.getImage().length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image path is too long");
        }
        if ((input.getSummaryEn() != null && input.getSummaryEn().length() > 3000)
                || (input.getSummaryZh() != null && input.getSummaryZh().length() > 3000)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Summary must be at most 3000 characters");
        }
    }
}
