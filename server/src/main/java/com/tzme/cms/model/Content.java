package com.tzme.cms.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Entity
@Table(name = "site_content")
public class Content {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dbId;
    @Column(nullable = false, unique = true)
    private String id;
    @Column(nullable = false)
    private String type;
    @Column(nullable = false)
    private String title;
    private String titleEn;
    private String titleZh;
    private String category;
    private String categoryEn;
    private String categoryZh;
    private String industry;
    @Column(length = 2000)
    private String industryIds;
    @Column(length = 3000)
    private String summary;
    @Column(length = 3000)
    private String summaryEn;
    @Column(length = 3000)
    private String summaryZh;
    private String image;
    private String status = "published";
    private LocalDate date;
    @Column(columnDefinition = "LONGTEXT")
    private String content;
    @Column(columnDefinition = "LONGTEXT")
    private String contentEn;
    @Column(columnDefinition = "LONGTEXT")
    private String contentZh;
    @Column(columnDefinition = "TEXT")
    private String featuresEn;
    @Column(columnDefinition = "TEXT")
    private String featuresZh;
    @Column(columnDefinition = "TEXT")
    private String specificationsEn;
    @Column(columnDefinition = "TEXT")
    private String specificationsZh;
    private Boolean showOnHome;
    private Integer homeOrder;

    protected Content() {
    }

    public Long getDbId() {
        return dbId;
    }

    public String getId() {
        return id;
    }

    public void setId(String v) {
        id = v;
    }

    public String getType() {
        return type;
    }

    public void setType(String v) {
        type = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getTitleEn() { return titleEn != null ? titleEn : title; }
    public void setTitleEn(String v) { titleEn = v; title = v; }
    public String getTitleZh() { return titleZh; }
    public void setTitleZh(String v) { titleZh = v; }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }

    public String getCategoryEn() { return categoryEn != null ? categoryEn : category; }
    public void setCategoryEn(String v) { categoryEn = v; category = v; }
    public String getCategoryZh() { return categoryZh; }
    public void setCategoryZh(String v) { categoryZh = v; }
    public String getIndustry() { return industry; }
    public void setIndustry(String v) { industry = v; }
    public List<String> getIndustries() {
        if (industryIds != null) {
            return Arrays.stream(industryIds.split(","))
                    .map(String::trim).filter(value -> !value.isBlank()).distinct().toList();
        }
        return industry == null || industry.isBlank() ? List.of() : List.of(industry);
    }
    public void setIndustries(List<String> values) {
        List<String> cleaned = values == null ? List.of() : values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim).distinct().toList();
        industryIds = String.join(",", cleaned);
        industry = cleaned.isEmpty() ? null : cleaned.get(0);
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String v) {
        summary = v;
    }

    public String getSummaryEn() { return summaryEn != null ? summaryEn : summary; }
    public void setSummaryEn(String v) { summaryEn = v; summary = v; }
    public String getSummaryZh() { return summaryZh; }
    public void setSummaryZh(String v) { summaryZh = v; }

    public String getImage() {
        return image;
    }

    public void setImage(String v) {
        image = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate v) {
        date = v;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String v) {
        content = v;
    }

    public String getContentEn() { return contentEn != null ? contentEn : content; }
    public void setContentEn(String v) { contentEn = v; content = v; }
    public String getContentZh() { return contentZh; }
    public void setContentZh(String v) { contentZh = v; }
    public String getFeaturesEn() { return featuresEn; }
    public void setFeaturesEn(String v) { featuresEn = v; }
    public String getFeaturesZh() { return featuresZh; }
    public void setFeaturesZh(String v) { featuresZh = v; }
    public String getSpecificationsEn() { return specificationsEn; }
    public void setSpecificationsEn(String v) { specificationsEn = v; }
    public String getSpecificationsZh() { return specificationsZh; }
    public void setSpecificationsZh(String v) { specificationsZh = v; }
    public Boolean getShowOnHome() { return showOnHome; }
    public void setShowOnHome(Boolean v) { showOnHome = v; }
    public Integer getHomeOrder() { return homeOrder; }
    public void setHomeOrder(Integer v) { homeOrder = v; }
}
