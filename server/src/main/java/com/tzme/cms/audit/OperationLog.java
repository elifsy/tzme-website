package com.tzme.cms.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "admin_operation_logs", indexes = {
    @Index(name = "idx_operation_time", columnList = "created_at,id"),
    @Index(name = "idx_operation_actor_time", columnList = "actor_id,created_at"),
    @Index(name = "idx_operation_module_time", columnList = "module,created_at")
})
public class OperationLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Column(nullable = false, length = 36) public String requestId;
    @Column(name = "created_at", nullable = false) public Instant createdAt;
    @Column(name = "actor_id", length = 36) public String actorId;
    @Column(nullable = false, length = 64) public String username;
    @Column(nullable = false, length = 64) public String displayName;
    @Column(nullable = false, length = 24) public String role;
    @Column(nullable = false, length = 40) public String module;
    @Column(nullable = false, length = 32) public String action;
    @Column(nullable = false, length = 180) public String targetId;
    @Column(nullable = false, length = 255) public String targetName;
    @Column(nullable = false, length = 500) public String summary;
    @Column(nullable = false) public boolean success;
    @Column(nullable = false) public int statusCode;
    @Column(nullable = false, length = 80) public String resultMessage;
    @Column(nullable = false, length = 10) public String method;
    @Column(nullable = false, length = 500) public String path;
    @Column(nullable = false, length = 64) public String address;
    @Column(nullable = false) public long durationMs;
}
