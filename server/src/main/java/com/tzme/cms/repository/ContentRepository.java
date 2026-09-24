package com.tzme.cms.repository;

import com.tzme.cms.model.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findAllByTypeOrderByDateDesc(String type);

    Optional<Content> findByIdAndType(String id, String type);
}
