package com.tzme.cms.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "admin_tutorial_progress", uniqueConstraints = @UniqueConstraint(name = "uk_tutorial_account_module", columnNames = {"account_id", "module_key"}))
public class AdminTutorialProgress {
    @Id @Column(length = 100) public String id;
    @Column(nullable = false, length = 36) public String accountId;
    @Column(nullable = false, length = 40) public String moduleKey;
    @Column(nullable = false) public Instant seenAt;
}
