package com.tzme.cms.repository;

import com.tzme.cms.model.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.Comparator;

public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findAllByTypeOrderByDateDesc(String type);

    // Articles share the existing optional order field; products keep their original catalog order.
    default List<Content> findAllForDisplay(String type) {
        var records = findAllByTypeOrderByDateDesc(type);
        if (!"articles".equals(type)) return records;
        return records.stream().sorted(Comparator
            .comparingInt((Content item) -> item.getHomeOrder() != null && item.getHomeOrder() > 0 ? item.getHomeOrder() : Integer.MAX_VALUE)
            .thenComparing(Content::getDate, Comparator.nullsLast(Comparator.reverseOrder()))
            .thenComparing(Content::getId)).toList();
    }

    Optional<Content> findByIdAndType(String id, String type);
    long countByTypeAndShowOnHomeTrueAndIdNot(String type, String id);
}
