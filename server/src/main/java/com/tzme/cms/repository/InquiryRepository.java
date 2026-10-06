package com.tzme.cms.repository;

import com.tzme.cms.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findAllByOrderByCreatedAtDesc();
    List<Inquiry> findTop10ByMailStatusAndMailNextAttemptAtLessThanEqualOrderByCreatedAtAsc(String status, Instant now);
    @Modifying @Transactional
    @Query("update Inquiry i set i.mailStatus='sending', i.mailNextAttemptAt=:lease where i.id=:id and i.mailStatus='pending'")
    int claimMail(Long id, Instant lease);
    @Modifying @Transactional
    @Query("update Inquiry i set i.mailStatus='pending' where i.mailStatus='sending' and i.mailNextAttemptAt < :now")
    int recoverMail(Instant now);
    @Modifying @Transactional
    @Query("update Inquiry i set i.status=:status where i.id=:id")
    int updateProcessingStatus(Long id, String status);
    @Modifying @Transactional
    @Query("update Inquiry i set i.mailStatus=:status, i.mailAttempts=:attempts, i.mailError=:error, i.mailSentAt=:sentAt, i.mailNextAttemptAt=:nextAttempt where i.id=:id")
    int finishMail(Long id, String status, int attempts, String error, Instant sentAt, Instant nextAttempt);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inquiry i where i.id=:id")
    Optional<Inquiry> findForUpdate(Long id);
}
