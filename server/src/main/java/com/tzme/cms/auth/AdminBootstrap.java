package com.tzme.cms.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.LoggerFactory;

@Component
public class AdminBootstrap implements ApplicationRunner {
    private final AdminAccountRepository accounts;
    private final PasswordEncoder passwords;
    private final String username, password, displayName;
    private final boolean resetPassword;
    public AdminBootstrap(AdminAccountRepository accounts, PasswordEncoder passwords,
            @Value("${tzme.admin.username:}") String username, @Value("${tzme.admin.password:}") String password,
            @Value("${tzme.admin.display-name:超级管理员}") String displayName,
            @Value("${tzme.admin.reset-password:false}") boolean resetPassword) {
        this.accounts = accounts; this.passwords = passwords; this.username = username; this.password = password; this.displayName = displayName; this.resetPassword = resetPassword;
    }
    @Override public void run(ApplicationArguments args) {
        if (accounts.existsByRole("SUPER_ADMIN")) {
            if (resetPassword) {
                var account = accounts.findByUsername(AdminAccountService.username(username)).filter(item -> "SUPER_ADMIN".equals(item.role))
                    .orElseThrow(() -> new IllegalArgumentException("The recovery username must match the existing super administrator."));
                AdminAccountService.validatePassword(password); account.passwordHash = passwords.encode(password);
                account.mustChangePassword = true; account.status = "active"; account.authVersion++; account.updatedAt = java.time.Instant.now(); accounts.saveAndFlush(account);
                LoggerFactory.getLogger(getClass()).warn("Super administrator password recovered by server operator. Remove TZME_ADMIN_RESET_PASSWORD after this startup.");
            }
            return;
        }
        if (username.isBlank() || password.isBlank()) {
            LoggerFactory.getLogger(getClass()).warn("No super administrator exists. Set TZME_ADMIN_USERNAME and TZME_ADMIN_PASSWORD, then restart. Administrative access remains locked."); return;
        }
        var account = new AdminAccount(); account.username = AdminAccountService.username(username);
        AdminAccountService.validatePassword(password); account.passwordHash = passwords.encode(password);
        account.displayName = displayName; account.role = "SUPER_ADMIN"; accounts.saveAndFlush(account);
        LoggerFactory.getLogger(getClass()).info("Initial super administrator created; password must be changed at first login.");
    }
}
