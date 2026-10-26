package com.tzme.cms.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Set;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Re-read status/version so disabling, deleting or resetting an account revokes every session. */
final class AccountSessionFilter extends OncePerRequestFilter {
    private final AdminAccountRepository accounts;
    AccountSessionFilter(AdminAccountRepository accounts) { this.accounts = accounts; }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) { return !ApiAccess.path(request).startsWith("/api/"); }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AdminPrincipal principal) {
            var account = accounts.findById(principal.id()).orElse(null);
            if (account == null || !"active".equals(account.status) || account.authVersion != principal.authVersion()) {
                SecurityContextHolder.clearContext();
                var session = request.getSession(false); if (session != null) session.invalidate();
            } else if (account.mustChangePassword && !ApiAccess.publicRequest(request)
                    && !Set.of("/api/auth/me", "/api/auth/password", "/api/auth/logout").contains(ApiAccess.path(request))) {
                SecurityJson.write(response, 403, "PASSWORD_CHANGE_REQUIRED", "请先修改初始密码。"); return;
            }
        }
        chain.doFilter(request, response);
    }
}
