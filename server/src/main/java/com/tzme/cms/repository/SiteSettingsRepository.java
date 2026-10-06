package com.tzme.cms.repository;

import com.tzme.cms.model.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface SiteSettingsRepository extends JpaRepository<SiteSettings, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SiteSettings s where s.id=:id")
    Optional<SiteSettings> findForUpdate(String id);
}
