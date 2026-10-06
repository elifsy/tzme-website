package com.tzme.cms.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "home_global_settings")
public class HomeGlobal {
    @Id
    private Long id;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String configuration;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getConfiguration() { return configuration; }
    public void setConfiguration(String configuration) { this.configuration = configuration; }
}
