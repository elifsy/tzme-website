package com.tzme.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.slf4j.LoggerFactory;

@Service
public class AnalyticsService {
    public static final Set<String> CLIENT_EVENTS = Set.of("page_view", "page_engagement", "navigation_click", "cta_click", "industry_filter", "news_filter", "social_click", "contact_click", "inquiry_start", "inquiry_submit", "inquiry_error", "language_change", "pagination", "content_click");
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final TransactionTemplate independentTransaction;
    public AnalyticsService(JdbcTemplate jdbc, ObjectMapper mapper, PlatformTransactionManager transactions) {
        this.jdbc = jdbc; this.mapper = mapper;
        independentTransaction = new TransactionTemplate(transactions);
        independentTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }
    public boolean enabled() {
        var values = jdbc.queryForList("SELECT configuration FROM site_settings WHERE id='analytics'", String.class);
        if (values.isEmpty()) return false;
        try { return mapper.readTree(values.get(0)).path("enabled").asBoolean(false); }
        catch (Exception e) { return false; }
    }
    public void configure(boolean enabled) {
        jdbc.update("INSERT INTO site_settings (id,configuration) VALUES ('analytics',?) ON DUPLICATE KEY UPDATE configuration=?",
            "{\"enabled\":" + enabled + "}", "{\"enabled\":" + enabled + "}");
    }
    public static boolean uuid(String value) { return value != null && value.matches("[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}"); }
    public static String pageKey(String path) {
        if (path.equals("/")) return "home";
        if (Set.of("/about", "/contact", "/solutions", "/projects", "/insights").contains(path)) return path.substring(1);
        if (path.matches("/solutions/[a-zA-Z0-9._%~-]+(/[a-zA-Z0-9._%~-]+)?")) return "product_detail";
        if (path.matches("/projects/[a-zA-Z0-9._%~-]+")) return "project_detail";
        if (path.matches("/insights/[a-zA-Z0-9._%~-]+")) return "news_detail";
        return "";
    }
    public void insert(JsonNode e, String name, String id, String target) {
        var timestamp = Timestamp.valueOf(LocalDateTime.now(ZoneOffset.UTC));
        jdbc.update("""
            INSERT INTO site_analytics_events
            (id,visitor_id,session_id,event_name,page_path,page_key,locale,device,referrer_host,target,duration_seconds,scroll_depth,occurred_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
              duration_seconds=IF(event_name='page_engagement' AND VALUES(event_name)='page_engagement' AND visitor_id=VALUES(visitor_id) AND session_id=VALUES(session_id) AND page_path=VALUES(page_path),GREATEST(duration_seconds,VALUES(duration_seconds)),duration_seconds),
              scroll_depth=IF(event_name='page_engagement' AND VALUES(event_name)='page_engagement' AND visitor_id=VALUES(visitor_id) AND session_id=VALUES(session_id) AND page_path=VALUES(page_path),GREATEST(scroll_depth,VALUES(scroll_depth)),scroll_depth)
            """, id, e.path("visitorId").asText(), e.path("sessionId").asText(), name,
            e.path("path").asText(), pageKey(e.path("path").asText()), e.path("locale").asText("en"),
            e.path("device").asText("desktop"), e.path("referrerHost").asText("direct"), target,
            e.path("duration").asInt(0), e.path("scrollDepth").asInt(0), timestamp);
    }
    // A successful inquiry is recorded only after the customer data transaction commits.
    public void inquirySaved(JsonNode context, String locale, Long inquiryId) {
        if (context == null || !context.isObject() || !uuid(context.path("visitorId").asText()) || !uuid(context.path("sessionId").asText())) return;
        String path = context.path("path").asText();
        if (!Set.of("/", "/contact").contains(path) || !Set.of("desktop", "tablet", "mobile").contains(context.path("device").asText())) return;
        String source = context.path("referrerHost").asText("direct");
        if (source.length() > 255 || !source.matches("[a-zA-Z0-9.-]+")) return;
        var event = context.deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode) event).put("locale", locale).put("duration", 0).put("scrollDepth", 0);
        Runnable write = () -> {
            try { independentTransaction.executeWithoutResult(status -> { if (enabled()) insert(event, "inquiry_success", UUID.randomUUID().toString(), "inquiry-" + inquiryId); }); }
            catch (Exception ex) { LoggerFactory.getLogger(AnalyticsService.class).warn("Inquiry analytics could not be recorded", ex); }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { write.run(); }
        });
        else write.run();
    }
}
