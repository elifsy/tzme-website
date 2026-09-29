package com.tzme.cms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "industries")
public class Industry {
    @Id
    @Column(length = 100)
    private String id;
    @Column(nullable = false)
    private String titleEn;
    @Column(nullable = false)
    private String titleZh;
    @Column(length = 1000)
    private String subtitleEn;
    @Column(length = 1000)
    private String subtitleZh;
    private int sortOrder;
    @Column(nullable = false)
    private String status = "published";

    protected Industry() {
    }

    public static Industry deletedMarker(String id) {
        Industry marker = new Industry();
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
    public String getSubtitleEn() { return subtitleEn; }
    public void setSubtitleEn(String value) { subtitleEn = value; }
    public String getSubtitleZh() { return subtitleZh; }
    public void setSubtitleZh(String value) { subtitleZh = value; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int value) { sortOrder = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
}
