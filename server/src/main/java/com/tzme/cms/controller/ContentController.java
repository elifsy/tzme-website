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
        content.setType(type);
        if ("products".equals(type)) content.setIndustries(content.getIndustries());
        enforceHomeLimit(type, content);
        content.setTitleEn(content.getTitleEn());
        content.setCategoryEn(content.getCategoryEn());
        content.setSummaryEn(content.getSummaryEn());
        content.setContentEn(content.getContentEn());
        return repository.save(content);
    }

    @PutMapping("/{type:products|articles}/{id}")
    public Content update(@PathVariable String type, @PathVariable String id, @RequestBody Content input) {
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
        return repository.save(existing);
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
