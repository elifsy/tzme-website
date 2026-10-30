package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tzme.cms.auth.AdminAccount;
import com.tzme.cms.auth.AdminPrincipal;
import com.tzme.cms.auth.AdminAccountRepository;
import com.tzme.cms.repository.CertificationRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:certificate-files;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=", "tzme.admin.password=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class CertificateUploadIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AdminAccountRepository accounts;
    @Autowired CertificationRepository certificates;
    private AdminAccount editor;
    static final Path UPLOADS;
    static final byte[] PDF = "%PDF-1.7\ncertificate-test\n%%EOF".getBytes(StandardCharsets.US_ASCII);
    static final byte[] PNG = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
    static { try { UPLOADS = Files.createTempDirectory("tzme-certificate-files-test-"); } catch (Exception error) { throw new ExceptionInInitializerError(error); } }
    @DynamicPropertySource static void uploads(DynamicPropertyRegistry properties) { properties.add("tzme.upload-dir", UPLOADS::toString); }
    @BeforeEach void setup() {
        certificates.deleteAll(); accounts.deleteAll();
        editor = new AdminAccount(); editor.username = "certificate-editor"; editor.displayName = "资质编辑";
        editor.passwordHash = "unused-test-password"; editor.mustChangePassword = false; editor.role = "ADMIN";
        editor = accounts.saveAndFlush(editor);
    }
    @AfterAll static void cleanup() throws Exception {
        try (var paths = Files.walk(UPLOADS)) { for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path); }
    }
    private UsernamePasswordAuthenticationToken auth() { return new UsernamePasswordAuthenticationToken(AdminPrincipal.from(editor), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))); }
    private String upload(String name, byte[] bytes) throws Exception {
        var response = mvc.perform(multipart("/api/uploads/certificates").file(new MockMultipartFile("file", name, "application/octet-stream", bytes))
            .with(authentication(auth())).with(csrf())).andExpect(status().isCreated()).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).path("url").asText();
    }
    @Test void uploadRequiresLoginAndCsrf() throws Exception {
        var file = new MockMultipartFile("file", "certificate.pdf", "application/pdf", PDF);
        mvc.perform(multipart("/api/uploads/certificates").file(file).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/uploads/certificates").file(file).with(authentication(auth()))).andExpect(status().isForbidden());
    }
    @Test void pdfAndImagesHavePublicInlinePreviewsAndAccurateMimeTypes() throws Exception {
        for (var source : Map.of("application/pdf", PDF, "image/png", PNG).entrySet()) {
            String url = upload("证书文件", source.getValue());
            assertThat(url).matches("/api/uploads/certificates/[0-9a-f-]{36}\\.(pdf|png)");
            mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType(source.getKey()))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("inline;")))
                .andExpect(content().bytes(source.getValue()));
        }
    }
    @Test void replacingAnImageWithPdfPreservesCertificateMetadata() throws Exception {
        String image = upload("certificate.png", PNG), pdf = upload("certificate.pdf", PDF);
        var record = new LinkedHashMap<String, Object>(Map.of("id", "file-test", "titleZh", "质量认证", "issuerZh", "认证机构", "certificateNo", "CERT-001", "sortOrder", 20, "status", "published", "image", image));
        mvc.perform(post("/api/certifications").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(record)))
            .andExpect(status().isCreated()).andExpect(jsonPath("image").value(image));
        record.put("image", pdf);
        mvc.perform(put("/api/certifications/file-test").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(record)))
            .andExpect(status().isOk()).andExpect(jsonPath("image").value(pdf)).andExpect(jsonPath("certificateNo").value("CERT-001"));
        mvc.perform(get("/api/certifications")).andExpect(status().isOk()).andExpect(jsonPath("$[0].image").value(pdf)).andExpect(jsonPath("$[0].issuerZh").value("认证机构"));
    }
    @Test void invalidEmptyAndOversizedFilesNeverReachStorage() throws Exception {
        long before;
        Files.createDirectories(UPLOADS.resolve("certificates"));
        try (var paths = Files.list(UPLOADS.resolve("certificates"))) { before = paths.count(); }
        byte[] largeImage = Arrays.copyOf(PNG, 5 * 1024 * 1024 + 1), largePdf = Arrays.copyOf(PDF, 20 * 1024 * 1024 + 1);
        for (byte[] bytes : List.of(new byte[0], "<html>not a PDF</html>".getBytes(), "%PDF-bad".getBytes(), largePdf, largeImage)) {
            mvc.perform(multipart("/api/uploads/certificates").file(new MockMultipartFile("file", "certificate.pdf", "application/pdf", bytes))
                .with(authentication(auth())).with(csrf())).andExpect(status().isBadRequest());
        }
        try (var paths = Files.list(UPLOADS.resolve("certificates"))) { assertThat(paths.count()).isEqualTo(before); }
        mvc.perform(get("/api/uploads/certificates/arbitrary.pdf")).andExpect(status().isNotFound());
    }
    @Test void generalImageUploadsStillRejectPdf() throws Exception {
        mvc.perform(multipart("/api/uploads/images").file(new MockMultipartFile("file", "certificate.pdf", "application/pdf", PDF))
            .with(authentication(auth())).with(csrf())).andExpect(status().isBadRequest());
    }
}
