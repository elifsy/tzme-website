package com.tzme.cms.repository;

import com.tzme.cms.model.Certification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificationRepository extends JpaRepository<Certification, String> {
    List<Certification> findAllByOrderBySortOrderAscTitleEnAsc();
}
