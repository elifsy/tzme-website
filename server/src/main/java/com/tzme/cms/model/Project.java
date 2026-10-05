package com.tzme.cms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false)
    private String titleEn;

    @Column(nullable = false)
    private String titleZh;

    private String industryEn;

    private String industryZh;

    private String locationEn;

    private String locationZh;

    private String imageAltEn;

    private String imageAltZh;

    @Column(length = 3000)
    private String summaryEn;

    @Column(length = 3000)
    private String summaryZh;

    @Column(columnDefinition = "LONGTEXT")
    private String contentEn;

    @Column(columnDefinition = "LONGTEXT")
    private String contentZh;

    private String capacityLabelEn;

    private String capacityLabelZh;

    private String capacityEn;

    private String capacityZh;

    private String technologyLabelEn;

    private String technologyLabelZh;

    private String technologyEn;

    private String technologyZh;

    private String scopeLabelEn;

    private String scopeLabelZh;

    private String scopeEn;

    private String scopeZh;

    @Column(length = 500)
    private String image;
    @Column(nullable = false)
    private String status = "draft";
    @Column(nullable = false)
    private int sortOrder;
    @Column(nullable = false)
    private boolean showOnHome;
    @Column(nullable = false)
    private int homeOrder;

    public Project() {}

    public String getTitleEn() { return titleEn; }
    public void setTitleEn(String value) { titleEn = value; }
    public String getTitleZh() { return titleZh; }
    public void setTitleZh(String value) { titleZh = value; }
    public String getIndustryEn() { return industryEn; }
    public void setIndustryEn(String value) { industryEn = value; }
    public String getIndustryZh() { return industryZh; }
    public void setIndustryZh(String value) { industryZh = value; }
    public String getLocationEn() { return locationEn; }
    public void setLocationEn(String value) { locationEn = value; }
    public String getLocationZh() { return locationZh; }
    public void setLocationZh(String value) { locationZh = value; }
    public String getImageAltEn() { return imageAltEn; }
    public void setImageAltEn(String value) { imageAltEn = value; }
    public String getImageAltZh() { return imageAltZh; }
    public void setImageAltZh(String value) { imageAltZh = value; }
    public String getSummaryEn() { return summaryEn; }
    public void setSummaryEn(String value) { summaryEn = value; }
    public String getSummaryZh() { return summaryZh; }
    public void setSummaryZh(String value) { summaryZh = value; }
    public String getContentEn() { return contentEn; }
    public void setContentEn(String value) { contentEn = value; }
    public String getContentZh() { return contentZh; }
    public void setContentZh(String value) { contentZh = value; }
    public String getCapacityLabelEn() { return capacityLabelEn; }
    public void setCapacityLabelEn(String value) { capacityLabelEn = value; }
    public String getCapacityLabelZh() { return capacityLabelZh; }
    public void setCapacityLabelZh(String value) { capacityLabelZh = value; }
    public String getCapacityEn() { return capacityEn; }
    public void setCapacityEn(String value) { capacityEn = value; }
    public String getCapacityZh() { return capacityZh; }
    public void setCapacityZh(String value) { capacityZh = value; }
    public String getTechnologyLabelEn() { return technologyLabelEn; }
    public void setTechnologyLabelEn(String value) { technologyLabelEn = value; }
    public String getTechnologyLabelZh() { return technologyLabelZh; }
    public void setTechnologyLabelZh(String value) { technologyLabelZh = value; }
    public String getTechnologyEn() { return technologyEn; }
    public void setTechnologyEn(String value) { technologyEn = value; }
    public String getTechnologyZh() { return technologyZh; }
    public void setTechnologyZh(String value) { technologyZh = value; }
    public String getScopeLabelEn() { return scopeLabelEn; }
    public void setScopeLabelEn(String value) { scopeLabelEn = value; }
    public String getScopeLabelZh() { return scopeLabelZh; }
    public void setScopeLabelZh(String value) { scopeLabelZh = value; }
    public String getScopeEn() { return scopeEn; }
    public void setScopeEn(String value) { scopeEn = value; }
    public String getScopeZh() { return scopeZh; }
    public void setScopeZh(String value) { scopeZh = value; }
    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getImage() { return image; }
    public void setImage(String value) { image = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int value) { sortOrder = value; }
    public boolean isShowOnHome() { return showOnHome; }
    public void setShowOnHome(boolean value) { showOnHome = value; }
    public int getHomeOrder() { return homeOrder; }
    public void setHomeOrder(int value) { homeOrder = value; }

    public String[] cardTextValues() {
        return new String[] { titleEn, titleZh, industryEn, industryZh, locationEn, locationZh, imageAltEn, imageAltZh, capacityLabelEn, capacityLabelZh, capacityEn, capacityZh, technologyLabelEn, technologyLabelZh, technologyEn, technologyZh, scopeLabelEn, scopeLabelZh, scopeEn, scopeZh };
    }
}
