package com.tzme.cms.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.repository.ContentRepository;
import java.util.Map;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:admin-auth;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=", "tzme.admin.password=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class AdminAuthIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AdminAccountRepository accounts;
    @Autowired ContentRepository content;
    @Autowired PasswordEncoder passwords;
    @Autowired ObjectMapper json;
    private static final String PASSWORD = "Integration-Password-2026";
    private AdminAccount root, editor;

    @BeforeEach void setup() {
        accounts.deleteAll(); content.deleteAll();
        root = account("root", "SUPER_ADMIN", false); editor = account("editor", "ADMIN", false);
    }
    private AdminAccount account(String name, String role, boolean mustChange) {
        var account = new AdminAccount(); account.username = name; account.displayName = "测试账号";
        account.role = role; account.passwordHash = passwords.encode(PASSWORD); account.mustChangePassword = mustChange;
        return accounts.saveAndFlush(account);
    }
    private String csrf(MockHttpSession session) throws Exception {
        var response = mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).path("token").asText();
    }
    private MockHttpSession login(String username) throws Exception {
        var session = new MockHttpSession(); String before = session.getId();
        mvc.perform(post("/api/auth/login").session(session).header("X-CSRF-TOKEN", csrf(session)).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("username", username, "password", PASSWORD))))
            .andExpect(status().isOk()).andExpect(jsonPath("passwordHash").doesNotExist());
        assertThat(session.getId()).isNotEqualTo(before);
        return session;
    }
    private ResultActions write(String method, String path, MockHttpSession session, Object body) throws Exception {
        return mvc.perform(request(org.springframework.http.HttpMethod.valueOf(method), path).session(session)
            .header("X-CSRF-TOKEN", csrf(session)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }
    @Test void anonymousPrivateReadsAndWritesAreBlockedEvenWithPreviewFlag() throws Exception {
        for (String path : new String[]{"/api/inquiries", "/api/mail-settings", "/api/contact-settings/admin", "/api/analytics/report", "/api/analytics/events", "/api/inquiry-attachments/not-a-file", "/api/admin/accounts"})
            mvc.perform(get(path + "?admin-preview=1")).andExpect(status().isUnauthorized());
        write("POST", "/api/products", new MockHttpSession(), Map.of("id", "unauthorized")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/uploads/images")).andExpect(status().isForbidden());
    }
    @Test void csrfRequiredForLoginAndAdminChanges() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden()).andExpect(jsonPath("code").value("CSRF_INVALID"));
        mvc.perform(post("/api/products").session(login("editor")).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
    }
    @Test void ordinaryAccountsHaveContentAccessButNoAccountAdministration() throws Exception {
        var session = login("editor");
        mvc.perform(get("/api/admin/accounts").session(session)).andExpect(status().isForbidden());
        write("POST", "/api/admin/accounts", session, Map.of()).andExpect(status().isForbidden());
        write("POST", "/api/products", session, Map.of("id", "draft-check", "titleZh", "测试草稿", "status", "draft", "industries", new String[]{"ports"}))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/products")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/products").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value("draft-check"));
    }
    @Test void superAdministratorCanCreateEditAndDeleteAccountsWithoutChangingRoles() throws Exception {
        var session = login("root");
        var created = write("POST", "/api/admin/accounts", session, Map.of("username", "new-editor", "displayName", "新管理员", "password", PASSWORD, "status", "active", "role", "SUPER_ADMIN"))
            .andExpect(status().isCreated()).andExpect(jsonPath("role").value("ADMIN")).andExpect(jsonPath("mustChangePassword").value(true))
            .andExpect(jsonPath("passwordHash").doesNotExist()).andReturn();
        String id = json.readTree(created.getResponse().getContentAsString()).path("id").asText();
        assertThat(accounts.findById(id).orElseThrow().passwordHash).isNotEqualTo(PASSWORD);
        write("PUT", "/api/admin/accounts/" + id, session, Map.of("username", "renamed-editor", "displayName", "已修改", "status", "disabled", "role", "SUPER_ADMIN"))
            .andExpect(status().isOk()).andExpect(jsonPath("role").value("ADMIN"));
        write("DELETE", "/api/admin/accounts/" + id, session, Map.of()).andExpect(status().isNoContent());
        assertThat(accounts.findById(id)).isEmpty();
    }
    @Test void rootCannotBeDisabledOrDeletedAndUsernamesAreUnique() throws Exception {
        var session = login("root");
        write("DELETE", "/api/admin/accounts/" + root.id, session, Map.of()).andExpect(status().isBadRequest());
        write("PUT", "/api/admin/accounts/" + root.id, session, Map.of("username", "root", "displayName", "超级管理员", "status", "disabled"))
            .andExpect(status().isBadRequest());
        write("POST", "/api/admin/accounts", session, Map.of("username", "EDITOR", "displayName", "重复", "password", PASSWORD, "status", "active"))
            .andExpect(status().isConflict());
    }
    @Test void disableDeleteAndPasswordResetRevokeExistingSessions() throws Exception {
        var administrator = login("root"); var ordinary = login("editor");
        write("PUT", "/api/admin/accounts/" + editor.id, administrator, Map.of("username", "editor", "displayName", "测试账号", "status", "disabled")).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").session(ordinary)).andExpect(status().isUnauthorized());
        write("PUT", "/api/admin/accounts/" + editor.id, administrator, Map.of("username", "editor", "displayName", "测试账号", "status", "active")).andExpect(status().isOk());
        ordinary = login("editor");
        write("POST", "/api/admin/accounts/" + editor.id + "/password", administrator, Map.of("password", "Changed-Password-2026")).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").session(ordinary)).andExpect(status().isUnauthorized());
        var another = account("delete-editor", "ADMIN", false); var deletedSession = login(another.username);
        write("DELETE", "/api/admin/accounts/" + another.id, administrator, Map.of()).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").session(deletedSession)).andExpect(status().isUnauthorized());
    }
    @Test void initialPasswordMustBeChangedAndAllOldSessionsAreRevoked() throws Exception {
        var initial = account("first-login", "ADMIN", true); var first = login(initial.username); var second = login(initial.username);
        mvc.perform(get("/api/inquiries").session(first)).andExpect(status().isForbidden()).andExpect(jsonPath("code").value("PASSWORD_CHANGE_REQUIRED"));
        write("POST", "/api/auth/password", first, Map.of("currentPassword", PASSWORD, "newPassword", "short")).andExpect(status().isBadRequest());
        write("POST", "/api/auth/password", first, Map.of("currentPassword", PASSWORD, "newPassword", "Updated-Password-2026")).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").session(second)).andExpect(status().isUnauthorized());
        assertThat(accounts.findById(initial.id).orElseThrow().mustChangePassword).isFalse();
    }
    @Test void logoutRevokesTheSession() throws Exception {
        var session = login("editor");
        write("POST", "/api/auth/logout", session, Map.of()).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void bootstrapPreservesAccountsAndExplicitOperatorRecoveryRequiresAnExistingRoot() throws Exception {
        var session = login("root"); long version = accounts.findById(root.id).orElseThrow().authVersion;
        new AdminBootstrap(accounts, passwords, "unused", PASSWORD, "初始化", false).run(null);
        assertThat(accounts.count()).isEqualTo(2);
        assertThatThrownBy(() -> new AdminBootstrap(accounts, passwords, "editor", PASSWORD, "", true).run(null)).isInstanceOf(IllegalArgumentException.class);
        new AdminBootstrap(accounts, passwords, "root", "Recovered-Password-2026", "", true).run(null);
        var recovered = accounts.findById(root.id).orElseThrow();
        assertThat(recovered.mustChangePassword).isTrue(); assertThat(recovered.authVersion).isGreaterThan(version);
        assertThat(passwords.matches("Recovered-Password-2026", recovered.passwordHash)).isTrue();
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
    }
    @Test void repeatedLoginFailuresAreThrottled() throws Exception {
        var session = new MockHttpSession();
        for (int i = 0; i < 5; i++) write("POST", "/api/auth/login", session, Map.of("username", "unknown-user", "password", PASSWORD)).andExpect(status().isUnauthorized());
        write("POST", "/api/auth/login", session, Map.of("username", "unknown-user", "password", PASSWORD)).andExpect(status().isTooManyRequests());
    }
    @Test void publicFormWritesReachValidationWithoutAdminLoginOrCsrf() throws Exception {
        mvc.perform(post("/api/inquiries").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(result -> assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
        mvc.perform(multipart("/api/inquiry-attachments"))
            .andExpect(status().isBadRequest());
    }
}
