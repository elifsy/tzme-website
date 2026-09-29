package com.tzme.cms.repository;

import com.tzme.cms.model.Industry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IndustryRepository extends JpaRepository<Industry, String> {
    List<Industry> findAllByOrderBySortOrderAscTitleEnAsc();
}
