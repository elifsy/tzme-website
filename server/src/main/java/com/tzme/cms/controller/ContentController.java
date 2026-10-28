package com.tzme.cms.controller;

import com.tzme.cms.model.Content;
import com.tzme.cms.auth.ApiAccess;
import com.tzme.cms.repository.ContentRepository;
import com.tzme.cms.service.ArticleAttachmentService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ContentController {
    private static final int MAX_HOME_PRODUCTS = 5;
    private final ContentRepository repository;
    private final ArticleAttachmentService attachments;

    public ContentController(ContentRepository repository, ArticleAttachmentService attachments) {
        this.repository = repository;
        this.attachments = attachments;
    }

    @GetMapping("/{type:products|articles}")
    public List<Content> list(@PathVariable String type) {
        return attachments.populate(repository.findAllForDisplay(type).stream()
                .filter(item -> ApiAccess.authenticated() || "published".equals(item.getStatus())).toList());
    }

    @PostMapping("/{type:products|articles}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Content create(@PathVariable String type, @RequestBody Content content) {
        requireArticleCover(type, content);
        if ("products".equals(type))
            content.setDetailLayout(normalizeDetailLayout(content.getDetailLayout()));
        content.setType(type);
        if ("products".equals(type))
            content.setIndustries(content.getIndustries());
        enforceHomeLimit(type, content);
        content.setTitleEn(orEmpty(content.getTitleEn()));
        content.setCategoryEn(orEmpty(content.getCategoryEn()));
        content.setSummaryEn(orEmpty(content.getSummaryEn()));
        content.setContentEn(orEmpty(content.getContentEn()));
        normalizeLegacyFields(content);
        var saved = repository.save(content);
        if ("articles".equals(type)) attachments.bind(saved, content.getAttachments());
        return saved;
    }

    @PutMapping("/{type:products|articles}/{id}")
    @Transactional
    public Content update(@PathVariable String type, @PathVariable String id, @RequestBody Content input) {
        String detailLayout = input.getDetailLayout() == null ? null : normalizeDetailLayout(input.getDetailLayout());
        Content existing = repository.findByIdAndType(id, type)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        requireArticleCover(type, input);
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
        // Omission from an older editor preserves the stage image; an empty string
        // explicitly clears it.
        if (input.getPresentationImage() != null)
            existing.setPresentationImage(input.getPresentationImage());
        // Older clients preserve the selection; "auto" or an explicit empty value
        // resets it.
        if ("products".equals(type) && detailLayout != null)
            existing.setDetailLayout(detailLayout);
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
        var saved = repository.save(existing);
        if ("articles".equals(type)) attachments.bind(saved, input.getAttachments());
        return saved;
    }

    private static void requireArticleCover(String type, Content content) {
        if ("articles".equals(type) && (content.getImage() == null || content.getImage().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请上传新闻封面图片。");
        }
    }

    private static String orEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String normalizeDetailLayout(String value) {
        String layout = value == null || value.isBlank() ? "auto" : value;
        if (!List.of("auto", "vertical", "panorama", "exhibit", "platform").contains(layout)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown product detail layout");
        }
        return layout;
    }

    // Chinese-only records still populate the original fields used by catalog
    // filters and older clients.
    private static void normalizeLegacyFields(Content content) {
        content.setTitle(content.getTitleEn() == null || content.getTitleEn().isBlank() ? content.getTitleZh()
                : content.getTitleEn());
        content.setCategory(
                content.getCategoryEn() == null || content.getCategoryEn().isBlank() ? content.getCategoryZh()
                        : content.getCategoryEn());
        content.setSummary(content.getSummaryEn() == null || content.getSummaryEn().isBlank() ? content.getSummaryZh()
                : content.getSummaryEn());
        content.setContent(content.getContentEn() == null || content.getContentEn().isBlank() ? content.getContentZh()
                : content.getContentEn());
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
