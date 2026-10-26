package com.tzme.cms.auth;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_accounts")
public class AdminAccount {
    @Id @Column(length = 36) public String id = UUID.randomUUID().toString();
    @Column(nullable = false, unique = true, length = 64) public String username;
    @Column(nullable = false, length = 64) public String displayName;
    @Column(nullable = false) public String passwordHash;
    @Column(nullable = false, length = 24) public String role = "ADMIN";
    @Column(nullable = false, length = 16) public String status = "active";
    @Column(nullable = false) public boolean mustChangePassword = true;
    @Column(nullable = false) public long authVersion;
    @Version public long revision;
    @Column(nullable = false) public Instant createdAt = Instant.now();
    @Column(nullable = false) public Instant updatedAt = Instant.now();
    public Instant lastLoginAt;

    public AccountView view() { return new AccountView(id, username, displayName, role, status, mustChangePassword, createdAt, updatedAt, lastLoginAt); }
    public record AccountView(String id, String username, String displayName, String role, String status,
        boolean mustChangePassword, Instant createdAt, Instant updatedAt, Instant lastLoginAt) {}
}
