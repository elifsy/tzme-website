package com.tzme.cms.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

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
    @Column(length = 20) private String locale = "en";
    @Column(columnDefinition = "TEXT") private String notes = "";
    @Column(length = 32) private String mailStatus = "disabled";
    @Column(columnDefinition = "TEXT") private String mailRecipients = "";
    private int mailAttempts = 0;
    @Column(length = 2000) private String mailError = "";
    private Instant mailSentAt;
    @JsonIgnore private Instant mailNextAttemptAt;
    @Transient private List<InquiryAttachment> attachments = List.of();

    public Inquiry() {
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
    public String getLocale() { return locale; }
    public void setLocale(String value) { locale = value; }
    public String getNotes() { return notes; }
    public void setNotes(String value) { notes = value; }
    public String getMailStatus() { return mailStatus; }
    public void setMailStatus(String value) { mailStatus = value; }
    public String getMailRecipients() { return mailRecipients; }
    public void setMailRecipients(String value) { mailRecipients = value; }
    public int getMailAttempts() { return mailAttempts; }
    public void setMailAttempts(int value) { mailAttempts = value; }
    public String getMailError() { return mailError; }
    public void setMailError(String value) { mailError = value; }
    public Instant getMailSentAt() { return mailSentAt; }
    public void setMailSentAt(Instant value) { mailSentAt = value; }
    public Instant getMailNextAttemptAt() { return mailNextAttemptAt; }
    public void setMailNextAttemptAt(Instant value) { mailNextAttemptAt = value; }
    public List<InquiryAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<InquiryAttachment> value) { attachments = value; }
}
