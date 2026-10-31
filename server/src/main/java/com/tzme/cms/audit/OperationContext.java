package com.tzme.cms.audit;

import java.util.*;
import org.springframework.web.util.UriUtils;
import java.nio.charset.StandardCharsets;

final class OperationContext {
    static final String ATTRIBUTE = OperationContext.class.getName();
    final String requestId = UUID.randomUUID().toString();
    final long started = System.nanoTime();
    String module, action, targetId = "", targetName = "", beforeStatus = "", attemptedUsername = "";
    String actorId, username = "", displayName = "", role = "ANONYMOUS";

    OperationContext(String module, String action) { this.module = module; this.action = action; }

    static OperationContext describe(String method, String path) {
        if (!Set.of("POST", "PUT", "PATCH", "DELETE").contains(method) || !path.startsWith("/api/")) return null;
        if (Set.of("/api/inquiries", "/api/inquiry-attachments", "/api/analytics/events").contains(path)) return null;
        if (path.equals("/api/auth/login")) return new OperationContext("auth", "login");
        if (path.equals("/api/auth/logout")) return new OperationContext("auth", "logout");
        if (path.equals("/api/auth/password")) return new OperationContext("accounts", "change_password");
        var operation = new OperationContext("other", switch (method) { case "POST" -> "create"; case "DELETE" -> "delete"; default -> "update"; });
        if(path.startsWith("/api/seo/rankings/")) {
            operation.module="rankings";
            if(path.endsWith("/observations"))operation.action="record_rank";
            else if(path.endsWith("/check"))operation.action="check_rank";
            else if(path.endsWith("/import"))operation.action="import_rank";
            else if(method.equals("DELETE"))operation.action="archive";
            String marker="/keywords/";int start=path.indexOf(marker);if(start>=0)operation.targetId=path.substring(start+marker.length()).split("/",2)[0];
            return operation;
        }
        var bases = new LinkedHashMap<String, String>();
        bases.put("/api/admin/accounts", "accounts"); bases.put("/api/products", "products"); bases.put("/api/articles", "articles");
        bases.put("/api/industries", "industries"); bases.put("/api/projects", "projects"); bases.put("/api/certifications", "certifications");
        bases.put("/api/inquiries", "inquiries");
        for (var entry : bases.entrySet()) if (path.equals(entry.getKey()) || path.startsWith(entry.getKey() + "/")) {
            operation.module = entry.getValue();
            if (path.length() > entry.getKey().length()) {
                String suffix = path.substring(entry.getKey().length() + 1);
                try { operation.targetId = UriUtils.decode(suffix.split("/", 2)[0], StandardCharsets.UTF_8); } catch (IllegalArgumentException ignored) { }
                if (operation.module.equals("accounts") && suffix.endsWith("/password")) operation.action = "reset_password";
                if (operation.module.equals("inquiries")) operation.action = suffix.endsWith("/notify") ? "notify" : "update_status";
            }
            return operation;
        }
        var settings = Map.ofEntries(
            Map.entry("/api/site-settings", "website"), Map.entry("/api/about-tzme", "about"),
            Map.entry("/api/home-capabilities", "capabilities"), Map.entry("/api/home-global", "global"),
            Map.entry("/api/home-solutions", "solutions"), Map.entry("/api/product-showcase", "product-showcase"),
            Map.entry("/api/partners", "partners"), Map.entry("/api/contact-settings/admin", "contact"),
            Map.entry("/api/mail-settings", "mail"), Map.entry("/api/seo/settings/admin", "seo"),
            Map.entry("/api/analytics/config", "analytics"));
        if (settings.containsKey(path)) return new OperationContext(settings.get(path), "configure");
        if (path.equals("/api/uploads/certificates")) return new OperationContext("certifications", "upload");
        if (path.equals("/api/article-attachments")) return new OperationContext("articles", "upload");
        if (path.startsWith("/api/uploads/")) return new OperationContext("uploads", "upload");
        return operation;
    }
}
