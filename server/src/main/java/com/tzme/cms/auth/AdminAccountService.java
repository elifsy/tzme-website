package com.tzme.cms.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminAccountService {
    private final AdminAccountRepository accounts;
    private final PasswordEncoder passwords;
    private final LoginThrottle throttle;
    private final String dummyHash;

    public AdminAccountService(AdminAccountRepository accounts, PasswordEncoder passwords, LoginThrottle throttle) {
        this.accounts = accounts;
        this.passwords = passwords;
        this.throttle = throttle;
        dummyHash = passwords.encode(java.util.UUID.randomUUID().toString());
    }

    public record AccountInput(String username, String displayName, String password, String status) {
    }

    public record PasswordInput(String currentPassword, String newPassword) {
    }

    public static String username(String value) {
        String name = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (!name.matches("[a-z0-9][a-z0-9_.-]{3,63}"))
            invalid("账号需为 4–64 位字母、数字、点、横线或下划线，并以字母或数字开头。");
        return name;
    }

    private static String displayName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.isEmpty() || name.length() > 64)
            invalid("请填写姓名，最多 64 个字符。");
        return name;
    }

    private static String status(String value) {
        if (!List.of("active", "disabled").contains(value == null ? "" : value))
            invalid("请选择有效的账号状态。");
        return value;
    }

    public static void validatePassword(String value) {
        if (value == null || value.codePointCount(0, value.length()) < 12
                || value.getBytes(StandardCharsets.UTF_8).length > 72 || value.isBlank())
            invalid("密码至少 12 个字符，且不能超过 72 个 UTF-8 字节。");
    }

    private static void invalid(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public AdminAccount get(String id) {
        return accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "账号不存在。"));
    }

    public List<AdminAccount.AccountView> list() {
        return accounts.findAllByOrderByCreatedAtAsc().stream().map(AdminAccount::view).toList();
    }

    @Transactional
    public AdminAccount login(String input, String password, String address) {
        // Bound invalid input too, without disclosing whether the account exists.
        String name = input == null ? "" : input.trim().toLowerCase(Locale.ROOT);
        if (name.length() > 64 || password == null || password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误。");
        throttle.check(name, address);
        var account = accounts.findByUsername(name).orElse(null);
        boolean matches = passwords.matches(password, account == null ? dummyHash : account.passwordHash);
        if (account == null || !matches || !"active".equals(account.status)) {
            throttle.failed(name, address);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误，或账号已停用。");
        }
        throttle.succeeded(name);
        account.lastLoginAt = Instant.now();
        return accounts.saveAndFlush(account);
    }

    @Transactional
    public AdminAccount.AccountView create(AccountInput input) {
        var account = new AdminAccount();
        account.username = username(input.username());
        account.displayName = displayName(input.displayName());
        validatePassword(input.password());
        account.passwordHash = passwords.encode(input.password());
        account.status = status(input.status());
        return accounts.saveAndFlush(account).view();
    }

    @Transactional
    public AdminAccount.AccountView update(String id, AccountInput input) {
        var account = get(id);
        String name = username(input.username()), nextStatus = status(input.status());
        if ("SUPER_ADMIN".equals(account.role) && !"active".equals(nextStatus))
            invalid("超级管理员账号不能停用。");
        if (!name.equals(account.username) || !nextStatus.equals(account.status))
            account.authVersion++;
        account.username = name;
        account.displayName = displayName(input.displayName());
        account.status = nextStatus;
        account.updatedAt = Instant.now();
        return accounts.saveAndFlush(account).view();
    }

    @Transactional
    public void delete(String id) {
        var account = get(id);
        if ("SUPER_ADMIN".equals(account.role))
            invalid("超级管理员账号不能删除。");
        accounts.delete(account);
        accounts.flush();
    }

    @Transactional
    public void resetPassword(String id, String password, String actorId) {
        if (id.equals(actorId))
            invalid("请通过“修改我的密码”修改本人密码。");
        var account = get(id);
        validatePassword(password);
        account.passwordHash = passwords.encode(password);
        account.mustChangePassword = true;
        account.authVersion++;
        account.updatedAt = Instant.now();
        accounts.saveAndFlush(account);
    }

    @Transactional
    public void changePassword(String id, PasswordInput input) {
        var account = get(id);
        if (input.currentPassword() == null || !passwords.matches(input.currentPassword(), account.passwordHash))
            invalid("原密码不正确。");
        validatePassword(input.newPassword());
        if (passwords.matches(input.newPassword(), account.passwordHash))
            invalid("新密码不能与原密码相同。");
        account.passwordHash = passwords.encode(input.newPassword());
        account.mustChangePassword = false;
        account.authVersion++;
        account.updatedAt = Instant.now();
        accounts.saveAndFlush(account);
    }
}
