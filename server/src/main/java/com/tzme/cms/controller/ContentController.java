package com.tzme.cms.controller;

import com.tzme.cms.model.Content;
import com.tzme.cms.repository.ContentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ContentController {
    private static final int MAX_HOME_PRODUCTS = 5;
    private final ContentRepository repository;

    public ContentController(ContentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{type:products|articles}")
    public List<Content> list(@PathVariable String type) {
        return repository.findAllByTypeOrderByDateDesc(type);
    }

    @PostMapping("/{type:products|articles}")
    @ResponseStatus(HttpStatus.CREATED)
    public Content create(@PathVariable String type, @RequestBody Content content) {
        if ("products".equals(type)) content.setDetailLayout(normalizeDetailLayout(content.getDetailLayout()));
        content.setType(type);
        if ("products".equals(type)) content.setIndustries(content.getIndustries());
        enforceHomeLimit(type, content);
        content.setTitleEn(orEmpty(content.getTitleEn()));
        content.setCategoryEn(orEmpty(content.getCategoryEn()));
        content.setSummaryEn(orEmpty(content.getSummaryEn()));
        content.setContentEn(orEmpty(content.getContentEn()));
        normalizeLegacyFields(content);
        return repository.save(content);
    }

    @PutMapping("/{type:products|articles}/{id}")
    public Content update(@PathVariable String type, @PathVariable String id, @RequestBody Content input) {
        String detailLayout = input.getDetailLayout() == null ? null : normalizeDetailLayout(input.getDetailLayout());
        Content existing = repository.findByIdAndType(id, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setTitle(input.getTitle());
        existing.setTitleEn(input.getTitleEn());
        existing.setTitleZh(input.getTitleZh());
        existing.setCategory(input.getCategory());
        existing.setCategoryEn(input.getCategoryEn());
        existing.setCategoryZh(input.getCategoryZh());
        if ("products".equals(type)) {
            existing.setIndustry(input.getIndustry());
            existing.setIndustries(input.getIndustries());
        }
        existing.setSummary(input.getSummary());
        existing.setSummaryEn(input.getSummaryEn());
        existing.setSummaryZh(input.getSummaryZh());
        existing.setImage(input.getImage());
        // Omission from an older editor preserves the stage image; an empty string explicitly clears it.
        if (input.getPresentationImage() != null) existing.setPresentationImage(input.getPresentationImage());
        // Older clients preserve the selection; "auto" or an explicit empty value resets it.
        if ("products".equals(type) && detailLayout != null) existing.setDetailLayout(detailLayout);
        existing.setStatus(input.getStatus());
        existing.setDate(input.getDate());
        existing.setContent(input.getContent());
        existing.setContentEn(input.getContentEn());
        existing.setContentZh(input.getContentZh());
        existing.setFeaturesEn(input.getFeaturesEn());
        existing.setFeaturesZh(input.getFeaturesZh());
        existing.setSpecificationsEn(input.getSpecificationsEn());
        existing.setSpecificationsZh(input.getSpecificationsZh());
        existing.setShowOnHome(input.getShowOnHome());
        existing.setHomeOrder(input.getHomeOrder());
        enforceHomeLimit(type, existing);
        normalizeLegacyFields(existing);
        return repository.save(existing);
    }

    private static String orEmpty(String value) { return value == null ? "" : value; }
    private static String normalizeDetailLayout(String value) {
        String layout = value == null || value.isBlank() ? "auto" : value;
        if (!List.of("auto", "vertical", "panorama", "exhibit", "platform").contains(layout)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown product detail layout");
        }
        return layout;
    }

    // Chinese-only records still populate the original fields used by catalog filters and older clients.
    private static void normalizeLegacyFields(Content content) {
        content.setTitle(content.getTitleEn() == null || content.getTitleEn().isBlank() ? content.getTitleZh() : content.getTitleEn());
        content.setCategory(content.getCategoryEn() == null || content.getCategoryEn().isBlank() ? content.getCategoryZh() : content.getCategoryEn());
        content.setSummary(content.getSummaryEn() == null || content.getSummaryEn().isBlank() ? content.getSummaryZh() : content.getSummaryEn());
        content.setContent(content.getContentEn() == null || content.getContentEn().isBlank() ? content.getContentZh() : content.getContentEn());
    }

    @DeleteMapping("/{type:products|articles}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String type, @PathVariable String id) {
        Content existing = repository.findByIdAndType(id, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setStatus("deleted");
        existing.setShowOnHome(false);
        repository.save(existing);
    }

    private void enforceHomeLimit(String type, Content content) {
        if ("products".equals(type) && Boolean.TRUE.equals(content.getShowOnHome())
                && repository.countByTypeAndShowOnHomeTrueAndIdNot(type, content.getId()) >= MAX_HOME_PRODUCTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The homepage can feature at most five products");
        }
    }
}
