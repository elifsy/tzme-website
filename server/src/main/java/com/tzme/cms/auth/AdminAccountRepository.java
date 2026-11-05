package com.tzme.cms.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface AdminAccountRepository extends JpaRepository<AdminAccount, String> {
    Optional<AdminAccount> findByUsername(String username);
    boolean existsByRole(String role);
    List<AdminAccount> findAllByOrderByCreatedAtAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AdminAccount a where a.id = :id")
    Optional<AdminAccount> findForUpdate(@Param("id") String id);
}
