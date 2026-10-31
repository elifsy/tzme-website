package com.tzme.cms.ranking;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;

public interface RankKeywordRepository extends JpaRepository<RankKeyword,String> {
    boolean existsByMonitorKey(String key);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select k from RankKeyword k where k.id=:id") Optional<RankKeyword> lock(@Param("id") String id);
    List<RankKeyword> findAllByOrderByCreatedAtDesc();
}
