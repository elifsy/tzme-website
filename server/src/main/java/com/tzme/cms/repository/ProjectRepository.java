package com.tzme.cms.repository;

import com.tzme.cms.model.Project;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findAllByOrderBySortOrderAscIdAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Project p order by p.id")
    List<Project> lockForHomepageSelection();
}
