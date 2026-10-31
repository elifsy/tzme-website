package com.tzme.cms.ranking;

import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RankSnapshotRepository extends JpaRepository<RankSnapshot,Long> {
    boolean existsByKeywordIdAndObservedAt(String id,Instant observedAt);
    long countByKeywordId(String id);
    @Query("select s from RankSnapshot s where s.keywordId=:id and s.status<>'error' order by s.observedAt desc,s.id desc") List<RankSnapshot> valid(@Param("id") String id,Pageable page);
    @Query("select min(s.position) from RankSnapshot s where s.keywordId=:id and s.status='ranked'") Integer best(@Param("id") String id);
    List<RankSnapshot> findTop200ByKeywordIdOrderByObservedAtDescIdDesc(String id);
    Page<RankSnapshot> findByKeywordIdOrderByObservedAtDescIdDesc(String id,Pageable page);
}
