package com.tzme.cms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "article_attachments")
public class ArticleAttachment {
    @Id @Column(length = 36) private String id;
    @JsonIgnore private String articleId;
    @Column(nullable = false) private String name;
    @Column(nullable = false, length = 8) private String extension;
    @Column(nullable = false) private long size;
    @JsonIgnore @Column(nullable = false) private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getArticleId() { return articleId; }
    public void setArticleId(String value) { articleId = value; }
    public String getName() { return name; }
    public void setName(String value) { name = value; }
    public String getExtension() { return extension; }
    public void setExtension(String value) { extension = value; }
    public long getSize() { return size; }
    public void setSize(long value) { size = value; }
    public Instant getCreatedAt() { return createdAt; }
    public String getUrl() { return "/api/article-attachments/" + id; }
}
