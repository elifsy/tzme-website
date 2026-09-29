package com.tzme.cms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "certifications")
public class Certification {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false)
    private String titleEn;

    @Column(nullable = false)
    private String titleZh;

    private String issuerEn;
    private String issuerZh;

    @Column(length = 3000)
    private String summaryEn;

    @Column(length = 3000)
    private String summaryZh;

    private String certificateNo;
    private LocalDate issuedAt;
    private LocalDate expiresAt;

    @Column(length = 500)
    private String image;

    @Column(nullable = false)
    private String status = "published";

    @Column(nullable = false)
    private int sortOrder;

    protected Certification() {
    }

    public static Certification deletedMarker(String id) {
        Certification marker = new Certification();
        marker.id = id;
        marker.titleEn = "Deleted";
        marker.titleZh = "已删除";
        marker.status = "deleted";
        return marker;
    }

    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getTitleEn() { return titleEn; }
    public void setTitleEn(String value) { titleEn = value; }
    public String getTitleZh() { return titleZh; }
    public void setTitleZh(String value) { titleZh = value; }
    public String getIssuerEn() { return issuerEn; }
    public void setIssuerEn(String value) { issuerEn = value; }
    public String getIssuerZh() { return issuerZh; }
    public void setIssuerZh(String value) { issuerZh = value; }
    public String getSummaryEn() { return summaryEn; }
    public void setSummaryEn(String value) { summaryEn = value; }
    public String getSummaryZh() { return summaryZh; }
    public void setSummaryZh(String value) { summaryZh = value; }
    public String getCertificateNo() { return certificateNo; }
    public void setCertificateNo(String value) { certificateNo = value; }
    public LocalDate getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDate value) { issuedAt = value; }
    public LocalDate getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDate value) { expiresAt = value; }
    public String getImage() { return image; }
    public void setImage(String value) { image = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int value) { sortOrder = value; }
}
