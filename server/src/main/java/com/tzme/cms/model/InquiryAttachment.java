package com.tzme.cms.model;

import jakarta.persistence.*;
import java.time.Instant;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "inquiry_attachments")
public class InquiryAttachment {
    @Id @Column(length = 36) private String id;
    private Long inquiryId;
    @Column(length = 255) private String originalName;
    @Column(length = 20) private String extension;
    private long size;
    private Instant createdAt = Instant.now();
    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public Long getInquiryId() { return inquiryId; }
    public void setInquiryId(Long value) { inquiryId = value; }
    public String getOriginalName() { return originalName; }
    public void setOriginalName(String value) { originalName = value; }
    public String getExtension() { return extension; }
    public void setExtension(String value) { extension = value; }
    public long getSize() { return size; }
    public void setSize(long value) { size = value; }
    public Instant getCreatedAt() { return createdAt; }
    public String getUrl() { return "/api/inquiry-attachments/" + id; }
    @JsonIgnore public String storageName() { return id + "." + extension; }
}
