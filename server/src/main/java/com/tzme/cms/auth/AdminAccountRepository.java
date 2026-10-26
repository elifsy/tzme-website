package com.tzme.cms.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAccountRepository extends JpaRepository<AdminAccount, String> {
    Optional<AdminAccount> findByUsername(String username);
    boolean existsByRole(String role);
    List<AdminAccount> findAllByOrderByCreatedAtAsc();
}
