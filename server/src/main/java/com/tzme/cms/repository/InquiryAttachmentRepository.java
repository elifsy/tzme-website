package com.tzme.cms.repository;
import com.tzme.cms.model.InquiryAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface InquiryAttachmentRepository extends JpaRepository<InquiryAttachment, String> {
    List<InquiryAttachment> findByInquiryIdOrderByCreatedAtAsc(Long inquiryId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from InquiryAttachment a where a.id=:id")
    Optional<InquiryAttachment> findForClaim(String id);
}
