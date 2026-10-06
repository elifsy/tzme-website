package com.tzme.cms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "site_settings")
public class SiteSettings {
    @Id
    @Column(length = 100)
    private String id;
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String configuration;
    public String getId() { return id; }
    public void setId(String value) { id = value; }
    public String getConfiguration() { return configuration; }
    public void setConfiguration(String value) { configuration = value; }
}
