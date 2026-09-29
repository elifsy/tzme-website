package com.tzme.cms.controller;

import com.tzme.cms.model.Certification;
import com.tzme.cms.repository.CertificationRepository;
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
@RequestMapping("/api/certifications")
public class CertificationController {
    private static final Set<String> INITIAL_CERTIFICATION_IDS = Set.of(
            "en-1090-2", "iso-3834-2", "cwb", "iso-9001");
    private final CertificationRepository repository;

    public CertificationController(CertificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Certification> list() {
        return repository.findAllByOrderBySortOrderAscTitleEnAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Certification create(@RequestBody Certification input) {
        validate(input);
        if (input.getId() == null || input.getId().isBlank()) {
            input.setId("cert-" + UUID.randomUUID());
        }
        if (repository.existsById(input.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Certification already exists");
        }
        return repository.save(input);
    }

    @PutMapping("/{id}")
    public Certification update(@PathVariable String id, @RequestBody Certification input) {
        validate(input);
        Certification existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setTitleEn(input.getTitleEn());
        existing.setTitleZh(input.getTitleZh());
        existing.setIssuerEn(input.getIssuerEn());
        existing.setIssuerZh(input.getIssuerZh());
        existing.setSummaryEn(input.getSummaryEn());
        existing.setSummaryZh(input.getSummaryZh());
        existing.setCertificateNo(input.getCertificateNo());
        existing.setIssuedAt(input.getIssuedAt());
        existing.setExpiresAt(input.getExpiresAt());
        existing.setImage(input.getImage());
        existing.setStatus(input.getStatus());
        existing.setSortOrder(input.getSortOrder());
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        Certification existing = repository.findById(id).orElseGet(() -> {
            if (!INITIAL_CERTIFICATION_IDS.contains(id)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            }
            return Certification.deletedMarker(id);
        });
        existing.setStatus("deleted");
        repository.save(existing);
    }

    private void validate(Certification input) {
        if (input.getTitleEn() == null || input.getTitleEn().isBlank()
                || input.getTitleZh() == null || input.getTitleZh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "English and Chinese titles are required");
        }
        input.setTitleEn(input.getTitleEn().trim());
        input.setTitleZh(input.getTitleZh().trim());
        if (input.getStatus() == null || input.getStatus().isBlank()) {
            input.setStatus("published");
        }
        if (!"published".equals(input.getStatus()) && !"draft".equals(input.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid publication status");
        }
        if (input.getIssuedAt() != null && input.getExpiresAt() != null
                && input.getExpiresAt().isBefore(input.getIssuedAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expiry date must follow issue date");
        }
    }
}
