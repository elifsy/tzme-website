package com.tzme.cms.auth;

import jakarta.servlet.http.*;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AdminAccountService service;
    public AuthController(AdminAccountService service) { this.service = service; }
    public record LoginInput(String username, String password) {}
    @GetMapping("/csrf") public Map<String, String> csrf(CsrfToken token) { return Map.of("token", token.getToken(), "headerName", token.getHeaderName()); }
    @PostMapping("/login")
    public AdminAccount.AccountView login(@RequestBody LoginInput input, HttpServletRequest request, HttpServletResponse response) {
        var account = service.login(input.username(), input.password(), request.getRemoteAddr());
        var authentication = UsernamePasswordAuthenticationToken.authenticated(AdminPrincipal.from(account), null, List.of(new SimpleGrantedAuthority("ROLE_" + account.role)));
        new ChangeSessionIdAuthenticationStrategy().onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext(); context.setAuthentication(authentication); SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);
        new HttpSessionCsrfTokenRepository().saveToken(null, request, response);
        return account.view();
    }
    @GetMapping("/me") public AdminAccount.AccountView me(@AuthenticationPrincipal AdminPrincipal principal) { return service.get(principal.id()).view(); }
    @PostMapping("/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal AdminPrincipal principal, @RequestBody AdminAccountService.PasswordInput input, HttpServletRequest request) {
        service.changePassword(principal.id(), input); clear(request);
    }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) { clear(request); }
    private void clear(HttpServletRequest request) {
        SecurityContextHolder.clearContext(); var session = request.getSession(false); if (session != null) session.invalidate();
    }
}
