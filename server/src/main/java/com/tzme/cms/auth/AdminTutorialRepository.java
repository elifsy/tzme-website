package com.tzme.cms.auth;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminTutorialRepository extends JpaRepository<AdminTutorialProgress, String> {
    List<AdminTutorialProgress> findAllByAccountId(String accountId);
}
