package com.tzme.cms.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.security.core.context.SecurityContextHolder;

public final class ApiAccess {
    private ApiAccess() {
    }

    public static String path(HttpServletRequest request) {
        return request.getRequestURI().substring(request.getContextPath().length());
    }

    private static final Set<String> PUBLIC_READS = Set.of("/api/products", "/api/articles", "/api/industries",
            "/api/projects", "/api/certifications",
            "/api/site-settings", "/api/about-tzme", "/api/contact-settings", "/api/home-capabilities",
            "/api/home-global", "/api/home-solutions", "/api/product-showcase", "/api/analytics/config",
            "/api/seo/settings", "/api/seo/page", "/api/seo/document", "/api/partners");

    public static boolean publicRequest(HttpServletRequest request) {
        String path = path(request), method = request.getMethod();
        if (Set.of("GET", "HEAD").contains(method))
            return PUBLIC_READS.contains(path)
                    || path.matches("/api/uploads/(images|models)/[^/]+") || path.matches("/api/article-attachments/[^/]+") || path.equals("/api/auth/csrf");
        return method.equals("POST")
                && Set.of("/api/inquiries", "/api/inquiry-attachments", "/api/analytics/events").contains(path);
    }

    public static boolean authenticated() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof AdminPrincipal principal
                && !principal.mustChangePassword();
    }
}
