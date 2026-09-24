package com.tzme.cms.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "site_inquiries")
public class Inquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String company;
    private String country;
    private String email;
    private String phone;
    private String industry;
    @Column(length = 6000)
    private String requirements;
    private String status = "new";
    private Instant createdAt = Instant.now();

    protected Inquiry() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String v) {
        name = v;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String v) {
        company = v;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String v) {
        country = v;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String v) {
        email = v;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String v) {
        phone = v;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String v) {
        industry = v;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String v) {
        requirements = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
