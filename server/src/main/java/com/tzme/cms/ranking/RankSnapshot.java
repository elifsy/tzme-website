package com.tzme.cms.ranking;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="seo_rank_snapshots", indexes=@Index(name="idx_rank_history",columnList="keyword_id,observed_at,id"),uniqueConstraints=@UniqueConstraint(name="uk_rank_observation",columnNames={"keyword_id","observed_at"}))
public class RankSnapshot {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(name="keyword_id",nullable=false,length=36) public String keywordId;
    @Column(name="observed_at",nullable=false) public Instant observedAt;
    @Column(nullable=false) public Instant recordedAt=Instant.now();
    @Column(nullable=false,length=20) public String status;
    public Integer position;
    @Column(nullable=false) public int checkedDepth;
    @Column(nullable=false,length=2000) public String matchedUrl="";
    @Column(nullable=false,length=20) public String source;
    @Column(nullable=false,length=1000) public String notes="";
    @Column(nullable=false,length=200) public String error="";
}
