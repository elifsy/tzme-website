package com.tzme.cms.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.auth.*;
import com.tzme.cms.repository.ContentRepository;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:operation-logs;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=", "tzme.admin.password=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class OperationLogIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired AdminAccountRepository accounts;
    @Autowired ContentRepository content;
    @Autowired OperationLogRepository logs;
    @Autowired ObjectMapper json;
    @Autowired PasswordEncoder passwords;
    static final String PASSWORD = "Audit-Test-Password-2026";
    static final Path UPLOADS;
    static { try { UPLOADS = Files.createTempDirectory("tzme-audit-test-"); } catch (Exception error) { throw new ExceptionInInitializerError(error); } }
    @DynamicPropertySource static void uploads(DynamicPropertyRegistry properties) { properties.add("tzme.upload-dir", UPLOADS::toString); }
    @AfterAll static void cleanup() throws Exception { try (var paths = Files.walk(UPLOADS)) { for (var path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path); } }
    AdminAccount root, editor;
    @BeforeEach void setup() {
        logs.deleteAll(); content.deleteAll(); accounts.deleteAll();
        root = account("audit-root", "超级管理员", "SUPER_ADMIN"); editor = account("audit-editor", "资料编辑员", "ADMIN");
    }
    AdminAccount account(String username, String name, String role) {
        var account = new AdminAccount(); account.username = username; account.displayName = name; account.role = role; account.mustChangePassword = false;
        account.passwordHash = passwords.encode(PASSWORD); return accounts.saveAndFlush(account);
    }
    String csrf(MockHttpSession session) throws Exception { return json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText(); }
    MockHttpSession login(String username) throws Exception {
        var session = new MockHttpSession();
        write("POST", "/api/auth/login", session, Map.of("username", username, "password", PASSWORD)).andExpect(status().isOk()); return session;
    }
    ResultActions write(String method, String path, MockHttpSession session, Object body) throws Exception {
        return mvc.perform(request(org.springframework.http.HttpMethod.valueOf(method), path).session(session).header("X-CSRF-TOKEN", csrf(session)).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }
    OperationLog last() { return logs.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")).get(0); }
    Map<String, Object> product(String id, String title, String status) { return Map.of("id", id, "titleZh", title, "status", status, "industries", List.of("ports")); }
    @Test void successfulFailedLoginAndLogoutHaveAccurateActorAndOutcome() throws Exception {
        var session = new MockHttpSession();
        write("POST", "/api/auth/login", session, Map.of("username", "audit-editor", "password", "wrong-secret")).andExpect(status().isUnauthorized());
        assertThat(last().username).isEqualTo("audit-editor"); assertThat(last().role).isEqualTo("ANONYMOUS"); assertThat(last().success).isFalse(); assertThat(last().statusCode).isEqualTo(401);
        session = login("audit-editor");
        assertThat(last().actorId).isEqualTo(editor.id); assertThat(last().displayName).isEqualTo("资料编辑员"); assertThat(last().action).isEqualTo("login"); assertThat(last().success).isTrue();
        write("POST", "/api/auth/logout", session, Map.of()).andExpect(status().isNoContent());
        assertThat(last().action).isEqualTo("logout"); assertThat(last().actorId).isEqualTo(editor.id); assertThat(last().success).isTrue();
        assertThat(logs.count()).isEqualTo(3);
    }
    @Test void contentCreatePublishUnpublishEditAndDeleteRetainTargetNames() throws Exception {
        var session = login("audit-editor");
        write("POST", "/api/products", session, product("audit-product", "卸船机", "draft")).andExpect(status().isCreated());
        assertThat(last().action).isEqualTo("create"); assertThat(last().targetId).isEqualTo("audit-product"); assertThat(last().targetName).isEqualTo("卸船机");
        write("PUT", "/api/products/audit-product", session, product("audit-product", "卸船机", "published")).andExpect(status().isOk()); assertThat(last().action).isEqualTo("publish");
        write("PUT", "/api/products/audit-product", session, product("audit-product", "卸船机", "draft")).andExpect(status().isOk()); assertThat(last().action).isEqualTo("unpublish");
        write("PUT", "/api/products/audit-product", session, product("audit-product", "新名称", "draft")).andExpect(status().isOk()); assertThat(last().action).isEqualTo("update"); assertThat(last().targetName).isEqualTo("新名称");
        write("DELETE", "/api/products/audit-product", session, Map.of()).andExpect(status().isNoContent()); assertThat(last().action).isEqualTo("delete"); assertThat(last().targetName).isEqualTo("新名称");
        assertThat(last().actorId).isEqualTo(editor.id); assertThat(last().requestId).hasSize(36);
    }
    @Test void failedCsrfAndForbiddenWritesAreLoggedWithoutChangingContent() throws Exception {
        var session = login("audit-editor");
        mvc.perform(post("/api/products").session(session).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        assertThat(last().statusCode).isEqualTo(403); assertThat(last().actorId).isEqualTo(editor.id); assertThat(last().success).isFalse();
        write("POST", "/api/admin/accounts", session, Map.of("username", "not-created", "password", "Never-Store-This-Secret")).andExpect(status().isForbidden());
        assertThat(last().module).isEqualTo("accounts"); assertThat(last().statusCode).isEqualTo(403); assertThat(accounts.count()).isEqualTo(2); assertThat(content.count()).isZero();
    }
    @Test void failedValidationSurvivesRollbackAndSecretsNeverEnterLogs() throws Exception {
        var session = login("audit-root");
        write("POST", "/api/admin/accounts", session, Map.of("username", "new-audit-user", "displayName", "新编辑", "password", "Account-Top-Secret-2026", "status", "active")).andExpect(status().isCreated());
        assertThat(last().targetName).isEqualTo("新编辑（new-audit-user）"); String id = last().targetId;
        write("POST", "/api/admin/accounts/" + id + "/password", session, Map.of("password", "Reset-Top-Secret-2026")).andExpect(status().isNoContent()); assertThat(last().action).isEqualTo("reset_password");
        write("POST", "/api/admin/accounts", session, Map.of("username", "invalid-audit-user", "displayName", "失败账号", "password", "weak!", "status", "active")).andExpect(status().isBadRequest());
        assertThat(last().success).isFalse(); assertThat(last().statusCode).isEqualTo(400); assertThat(accounts.findByUsername("invalid-audit-user")).isEmpty();
        write("PUT", "/api/mail-settings", session, Map.of("smtp", Map.of("password", "SMTP-Top-Secret"))).andExpect(status().isNotFound());
        String stored = json.writeValueAsString(logs.findAll());
        assertThat(stored).doesNotContain(PASSWORD, "Account-Top-Secret-2026", "Reset-Top-Secret-2026", "weak!", "SMTP-Top-Secret", "passwordHash", "currentPassword");
    }
    @Test void uploadsAreAttributedWithoutStoringFileBytes() throws Exception {
        var session = login("audit-editor");
        mvc.perform(multipart("/api/uploads/certificates").file(new MockMultipartFile("file", "certificate.pdf", "application/pdf", "%PDF-1.7\nDO-NOT-LOG-FILE-CONTENT".getBytes(StandardCharsets.US_ASCII))).session(session).header("X-CSRF-TOKEN", csrf(session))).andExpect(status().isCreated());
        assertThat(last().action).isEqualTo("upload"); assertThat(last().module).isEqualTo("certifications"); assertThat(last().targetId).endsWith(".pdf"); assertThat(last().actorId).isEqualTo(editor.id);
        assertThat(json.writeValueAsString(logs.findAll())).doesNotContain("DO-NOT-LOG-FILE-CONTENT", "%PDF");
    }
    @Test void renamingOrDeletingAccountsDoesNotRewritePastRecords() throws Exception {
        var session = login("audit-root");
        login("audit-editor"); OperationLog snapshot = last();
        write("PUT", "/api/admin/accounts/" + editor.id, session, Map.of("username", "renamed-audit-editor", "displayName", "已改名", "status", "active")).andExpect(status().isOk());
        write("DELETE", "/api/admin/accounts/" + editor.id, session, Map.of()).andExpect(status().isNoContent());
        OperationLog stored = logs.findById(snapshot.id).orElseThrow(); assertThat(stored.username).isEqualTo("audit-editor"); assertThat(stored.displayName).isEqualTo("资料编辑员");
        assertThat(last().targetName).isEqualTo("已改名（renamed-audit-editor）");
    }
    @Test void readsAndPublicAnalyticsNeverCreateOperationRows() throws Exception {
        var session = login("audit-editor"); long count = logs.count();
        mvc.perform(get("/api/products").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/operation-logs").session(session)).andExpect(status().isOk());
        mvc.perform(post("/api/analytics/events").session(session).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isNoContent());
        assertThat(logs.count()).isEqualTo(count);
    }
    @Test void logsArePrivateReadOnlyAndCanBeFilteredAndPaged() throws Exception {
        mvc.perform(get("/api/admin/operation-logs")).andExpect(status().isUnauthorized()); mvc.perform(get("/api/admin/operation-logs/options")).andExpect(status().isUnauthorized());
        var session = login("audit-editor");
        write("POST", "/api/products", session, product("filter-product", "筛选产品", "draft")).andExpect(status().isCreated());
        mvc.perform(get("/api/admin/operation-logs").session(session).param("actor", "资料编辑").param("module", "products").param("action", "create").param("result", "success").param("keyword", "筛选").param("pageSize", "1")).andExpect(status().isOk()).andExpect(jsonPath("total").value(1)).andExpect(jsonPath("items[0].targetId").value("filter-product"));
        mvc.perform(get("/api/admin/operation-logs").session(session).param("from", Instant.now().plusSeconds(60).toString())).andExpect(jsonPath("total").value(0));
        mvc.perform(get("/api/admin/operation-logs").session(session).param("pageSize", "101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/admin/operation-logs").session(session).param("keyword", "%")).andExpect(jsonPath("total").value(0));
        Long id = last().id;
        mvc.perform(get("/api/admin/operation-logs/" + id).session(session)).andExpect(status().isOk()).andExpect(jsonPath("targetId").value("filter-product"));
        write("DELETE", "/api/admin/operation-logs/" + id, session, Map.of()).andExpect(status().isMethodNotAllowed()); assertThat(logs.existsById(id)).isTrue();
    }
    @Test void sourceAddressComesFromTheServerConnectionRatherThanUntrustedHeaders() throws Exception {
        var session = login("audit-editor");
        mvc.perform(post("/api/products").session(session).header("X-CSRF-TOKEN", csrf(session)).header("X-Forwarded-For", "203.0.113.55").with(request -> { request.setRemoteAddr("192.0.2.12"); return request; }).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(product("address-product", "地址检查", "draft")))).andExpect(status().isCreated());
        assertThat(last().address).isEqualTo("192.0.2.12");
    }
}
