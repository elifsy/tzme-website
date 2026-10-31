package com.tzme.cms.auth;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.csrf.InvalidCsrfTokenException;
import org.springframework.security.web.csrf.MissingCsrfTokenException;
import org.springframework.security.web.csrf.CsrfFilter;
import com.tzme.cms.audit.OperationLogFilter;
import com.tzme.cms.audit.OperationLogService;

@Configuration
public class AdminSecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, AdminAccountRepository accounts, OperationLogService operationLogs) throws Exception {
        http.formLogin(form -> form.disable()).httpBasic(basic -> basic.disable()).logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(fixation -> fixation.changeSessionId()))
                .csrf(csrf -> csrf.ignoringRequestMatchers(request -> "POST".equals(request.getMethod())
                        && java.util.Set.of("/api/inquiries", "/api/inquiry-attachments", "/api/analytics/events")
                                .contains(ApiAccess.path(request))))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(ApiAccess::publicRequest).permitAll()
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/admin/accounts", "/api/admin/accounts/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, error) -> SecurityJson.write(response, 401,
                                "AUTH_REQUIRED", "请登录管理后台。"))
                        .accessDeniedHandler((request, response, error) -> {
                            boolean csrf = error instanceof MissingCsrfTokenException
                                    || error instanceof InvalidCsrfTokenException;
                            SecurityJson.write(response, 403, csrf ? "CSRF_INVALID" : "FORBIDDEN",
                                    csrf ? "登录校验已过期，请重新登录后再试。" : "当前账号没有此操作权限。");
                        }))
                .addFilterBefore(new OperationLogFilter(operationLogs), CsrfFilter.class)
                .addFilterBefore(new AccountSessionFilter(accounts), AuthorizationFilter.class);
        return http.build();
    }
}
