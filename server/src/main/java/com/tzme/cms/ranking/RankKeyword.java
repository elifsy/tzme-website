package com.tzme.cms.ranking;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="seo_rank_keywords", uniqueConstraints=@UniqueConstraint(name="uk_rank_monitor_key",columnNames="monitor_key"))
public class RankKeyword {
    @Id @Column(length=36) public String id=UUID.randomUUID().toString();
    @Column(name="monitor_key",nullable=false,length=64) public String monitorKey;
    @Column(nullable=false,length=160) public String keyword;
    @Column(nullable=false,length=12) public String engine="baidu";
    @Column(nullable=false,length=12) public String device;
    @Column(nullable=false,length=253) public String targetHost;
    @Column(nullable=false) public int searchDepth=10;
    @Column(nullable=false,length=1000) public String notes="";
    @Column(nullable=false) public boolean enabled=true;
    @Column(nullable=false) public boolean archived;
    @Column(nullable=false) public Instant createdAt=Instant.now();
    @Column(nullable=false) public Instant updatedAt=Instant.now();
    @Column(nullable=false,length=20) public String latestStatus="";
    public Integer latestRank;
    public Instant latestObservedAt;
    @Column(nullable=false,length=20) public String latestSource="";
    @Column(nullable=false,length=20) public String previousStatus="";
    public Integer previousRank;
    public Integer bestRank;
    @Column(nullable=false,length=2000) public String matchedUrl="";
    @Column(nullable=false) public long snapshotCount;
    public Instant lastAttemptAt;
    @Column(nullable=false,length=200) public String lastError="";
    public Instant checkingUntil;
    @Version public long revision;
}
