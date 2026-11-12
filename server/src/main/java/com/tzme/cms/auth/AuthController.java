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
    private final AdminTutorialService tutorials;

    public AuthController(AdminAccountService service, AdminTutorialService tutorials) {
        this.service = service;
        this.tutorials = tutorials;
    }

    public record LoginInput(String username, String password) {
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @PostMapping("/login")
    public AdminAccount.AccountView login(@RequestBody LoginInput input, HttpServletRequest request,
            HttpServletResponse response) {
        var account = service.login(input.username(), input.password(), request.getRemoteAddr());
        var authentication = UsernamePasswordAuthenticationToken.authenticated(AdminPrincipal.from(account), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + account.role)));
        new ChangeSessionIdAuthenticationStrategy().onAuthentication(authentication, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context, request, response);
        new HttpSessionCsrfTokenRepository().saveToken(null, request, response);
        return tutorials.view(account);
    }

    @GetMapping("/me")
    public AdminAccount.AccountView me(@AuthenticationPrincipal AdminPrincipal principal) {
        return tutorials.view(service.get(principal.id()));
    }

    @PostMapping("/tutorial/start")
    public AdminTutorialService.TutorialStart startTutorial(@AuthenticationPrincipal AdminPrincipal principal, @RequestBody TutorialInput input) {
        return tutorials.start(principal.id(), input.module());
    }

    public record TutorialInput(String module) {}

    public record AvatarInput(String avatarKey) {}

    @PostMapping("/avatar")
    public AdminAccount.AccountView avatar(@AuthenticationPrincipal AdminPrincipal principal, @RequestBody AvatarInput input) {
        return tutorials.view(service.updateOwnAvatar(principal.id(), input.avatarKey()));
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal AdminPrincipal principal,
            @RequestBody AdminAccountService.PasswordInput input, HttpServletRequest request) {
        service.changePassword(principal.id(), input);
        clear(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        clear(request);
    }

    private void clear(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null)
            session.invalidate();
    }
}
