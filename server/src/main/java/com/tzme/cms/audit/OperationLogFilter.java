package com.tzme.cms.audit;

import com.tzme.cms.auth.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.slf4j.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public final class OperationLogFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(OperationLogFilter.class);
    private final OperationLogService service;
    public OperationLogFilter(OperationLogService service) { this.service = service; }
    private AdminPrincipal principal() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof AdminPrincipal actor ? actor : null;
    }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) { return OperationContext.describe(request.getMethod(), ApiAccess.path(request)) == null; }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        var context = OperationContext.describe(request.getMethod(), ApiAccess.path(request));
        if (context == null) { chain.doFilter(request, response); return; }
        request.setAttribute(OperationContext.ATTRIBUTE, context);
        try { service.actor(context, principal()); if (context.actorId != null) service.target(context); } catch (RuntimeException error) { log.warn("Operation metadata unavailable for request {}", context.requestId); }
        boolean failed = false;
        try { chain.doFilter(request, response); }
        catch (IOException | ServletException | RuntimeException error) { failed = true; throw error; }
        finally {
            try {
                if (context.actorId == null) service.actor(context, principal());
                if (context.actorId != null || (context.module.equals("auth") && context.action.equals("login"))) service.append(context, request, failed ? 500 : response.getStatus());
            } catch (RuntimeException error) { log.error("Operation log write failed for request {}", context.requestId, error); }
        }
    }
}
