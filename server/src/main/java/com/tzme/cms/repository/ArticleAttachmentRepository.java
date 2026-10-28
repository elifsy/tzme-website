package com.tzme.cms.repository;

import com.tzme.cms.model.ArticleAttachment;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ArticleAttachmentRepository extends JpaRepository<ArticleAttachment, String> {
    List<ArticleAttachment> findByArticleIdOrderByCreatedAtAsc(String articleId);
    List<ArticleAttachment> findByArticleIdInOrderByCreatedAtAsc(List<String> articleIds);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select file from ArticleAttachment file where file.id in :ids")
    List<ArticleAttachment> findForBinding(@Param("ids") List<String> ids);
}
