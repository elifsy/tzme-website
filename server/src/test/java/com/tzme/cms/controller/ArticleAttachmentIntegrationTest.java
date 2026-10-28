package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.*;
import com.tzme.cms.auth.*;
import com.tzme.cms.repository.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:article-files;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=", "tzme.admin.password=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class ArticleAttachmentIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ArticleAttachmentRepository files;
    @Autowired ContentRepository content;
    @Autowired AdminAccountRepository accounts;
    private AdminAccount editor;
    static final Path UPLOADS;
    static { try { UPLOADS = Files.createTempDirectory("tzme-article-files-test"); } catch (Exception error) { throw new ExceptionInInitializerError(error); } }
    @DynamicPropertySource static void uploads(DynamicPropertyRegistry properties) { properties.add("tzme.upload-dir", UPLOADS::toString); }
    @BeforeEach void setup() {
        files.deleteAll(); content.deleteAll(); accounts.deleteAll();
        editor = new AdminAccount(); editor.username = "article-editor"; editor.displayName = "资料编辑";
        editor.passwordHash = "unused-test-password"; editor.mustChangePassword = false; editor.role = "ADMIN";
        editor = accounts.saveAndFlush(editor);
    }
    private UsernamePasswordAuthenticationToken auth() { return new UsernamePasswordAuthenticationToken(AdminPrincipal.from(editor), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))); }
    private JsonNode upload(String name, byte[] bytes) throws Exception {
        var response = mvc.perform(multipart("/api/article-attachments").file(new MockMultipartFile("file", name, "application/octet-stream", bytes))
            .with(authentication(auth())).with(csrf())).andExpect(status().isCreated()).andExpect(jsonPath("articleId").doesNotExist())
            .andExpect(jsonPath("createdAt").doesNotExist()).andReturn().getResponse();
        return json.readTree(response.getContentAsString());
    }
    private JsonNode pdf() throws Exception { return upload("产品手册.pdf", "%PDF-1.4\narticle-download-test\n%%EOF".getBytes(StandardCharsets.UTF_8)); }
    private Map<String, Object> article(String id, String status, Object attachments) {
        var result = new LinkedHashMap<String,Object>();
        result.put("id", id); result.put("titleZh", "产品手册"); result.put("categoryZh", "下载中心");
        result.put("image", "/assets/cover.jpg"); result.put("date", "2026-10-28"); result.put("status", status); result.put("contentZh", "<p>资料介绍</p>");
        if (attachments != null) result.put("attachments", attachments);
        return result;
    }
    private ResultActions save(String id, Map<String,Object> body) throws Exception {
        return mvc.perform((id == null ? post("/api/articles") : put("/api/articles/" + id)).with(authentication(auth())).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }
    private List<Map<String,String>> selection(JsonNode file) { return List.of(Map.of("id", file.path("id").asText())); }

    @Test void uploadRequiresAnAuthenticatedAdminAndCsrf() throws Exception {
        var file = new MockMultipartFile("file", "test.pdf", "application/pdf", "%PDF-1.4".getBytes());
        mvc.perform(multipart("/api/article-attachments").file(file).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/article-attachments").file(file).with(authentication(auth()))).andExpect(status().isForbidden());
        assertThat(files.count()).isZero();
    }
    @Test void publishedAttachmentRoundTripsAndDownloadsWithOriginalName() throws Exception {
        var file = pdf();
        save(null, article("manual", "published", selection(file))).andExpect(status().isCreated()).andExpect(jsonPath("attachments[0].name").value("产品手册.pdf"));
        mvc.perform(get("/api/articles")).andExpect(jsonPath("$[0].attachments[0].url").value(file.path("url").asText()));
        mvc.perform(get(file.path("url").asText())).andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "application/octet-stream"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment;")))
            .andExpect(content().bytes("%PDF-1.4\narticle-download-test\n%%EOF".getBytes(StandardCharsets.UTF_8)));
    }
    @Test void unlinkedAndDraftFilesArePrivateAndUnpublishingRevokesPublicAccess() throws Exception {
        var file = pdf(); String url = file.path("url").asText();
        mvc.perform(get(url)).andExpect(status().isNotFound());
        mvc.perform(get(url).with(authentication(auth()))).andExpect(status().isOk());
        save(null, article("draft", "draft", selection(file))).andExpect(status().isCreated());
        mvc.perform(get(url)).andExpect(status().isNotFound());
        save("draft", article("draft", "published", null)).andExpect(status().isOk());
        mvc.perform(get(url)).andExpect(status().isOk());
        save("draft", article("draft", "draft", null)).andExpect(status().isOk());
        mvc.perform(get(url)).andExpect(status().isNotFound());
    }
    @Test void omittedSelectionPreservesFilesWhileExplicitEmptySelectionRemovesThem() throws Exception {
        var file = pdf();
        save(null, article("manual", "published", selection(file))).andExpect(status().isCreated());
        save("manual", article("manual", "published", null)).andExpect(status().isOk()).andExpect(jsonPath("attachments.length()").value(1));
        save("manual", article("manual", "published", List.of())).andExpect(status().isOk()).andExpect(jsonPath("attachments.length()").value(0));
        mvc.perform(get(file.path("url").asText())).andExpect(status().isNotFound());
    }
    @Test void forgedMetadataCannotReplaceStoredNamesSizesOrUrls() throws Exception {
        var file = pdf();
        save(null, article("manual", "published", List.of(Map.of("id", file.path("id").asText(), "name", "evil.html", "size", 1, "url", "javascript:alert(1)"))))
            .andExpect(status().isCreated()).andExpect(jsonPath("attachments[0].name").value("产品手册.pdf"))
            .andExpect(jsonPath("attachments[0].url").value(file.path("url").asText()))
            .andExpect(jsonPath("attachments[0].size").value(file.path("size").asInt()));
    }
    @Test void attachmentsCannotBeStolenFromAnotherArticleAndFailedSaveRollsBack() throws Exception {
        var file = pdf();
        save(null, article("original", "published", selection(file))).andExpect(status().isCreated());
        save(null, article("other", "published", List.of())).andExpect(status().isCreated());
        var changed = article("other", "published", selection(file)); changed.put("titleZh", "不应保存的名称");
        save("other", changed).andExpect(status().isBadRequest());
        assertThat(content.findByIdAndType("other", "articles").orElseThrow().getTitleZh()).isEqualTo("产品手册");
        mvc.perform(get(file.path("url").asText())).andExpect(status().isOk());
    }
    @Test void duplicateUnknownAndExcessiveSelectionsAreRejected() throws Exception {
        var file = pdf(); var item = Map.of("id", file.path("id").asText());
        for (Object selection : List.of(List.of(item,item), List.of(Map.of("id", UUID.randomUUID().toString())), Collections.nCopies(11,item))) {
            save(null, article("invalid", "draft", selection)).andExpect(status().isBadRequest());
            assertThat(content.findByIdAndType("invalid", "articles")).isEmpty();
        }
    }
    @Test void invalidOrOversizedFilesAreRejectedBeforeTheyAreStored() throws Exception {
        for (var file : List.of(
            new MockMultipartFile("file", "bad.pdf", "application/pdf", "<html>not pdf</html>".getBytes()),
            new MockMultipartFile("file", "bad.exe", "application/octet-stream", "%PDF-1.4".getBytes()),
            new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]),
            new MockMultipartFile("file", "large.pdf", "application/pdf", new byte[20 * 1024 * 1024 + 1]))) {
            mvc.perform(multipart("/api/article-attachments").file(file).with(authentication(auth())).with(csrf())).andExpect(status().isBadRequest());
        }
        assertThat(files.count()).isZero();
    }
    @Test void deletingAnArticleRemovesItsPublicDownloads() throws Exception {
        var file = pdf();
        save(null, article("manual", "published", selection(file))).andExpect(status().isCreated());
        mvc.perform(delete("/api/articles/manual").with(authentication(auth())).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get(file.path("url").asText())).andExpect(status().isNotFound());
    }
}
