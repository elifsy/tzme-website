package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.auth.*;
import com.tzme.cms.model.SiteSettings;
import com.tzme.cms.repository.SiteSettingsRepository;
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
    "spring.datasource.url=jdbc:h2:mem:about-video;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never", "tzme.admin.username=", "tzme.admin.password=",
    "debug=false", "logging.level.root=WARN", "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
class AboutVideoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AdminAccountRepository accounts;
    @Autowired SiteSettingsRepository settings;
    private AdminAccount editor;
    private ObjectNode configuration;
    static final Path UPLOADS;
    static { try { UPLOADS = Files.createTempDirectory("tzme-about-video-test-"); } catch (Exception error) { throw new ExceptionInInitializerError(error); } }
    @DynamicPropertySource static void uploads(DynamicPropertyRegistry properties) { properties.add("tzme.upload-dir", UPLOADS::toString); }
    @BeforeEach void setup() throws Exception {
        settings.deleteAll(); accounts.deleteAll();
        editor = new AdminAccount(); editor.username = "video-editor"; editor.displayName = "企业资料编辑";
        editor.passwordHash = "unused-test-password"; editor.mustChangePassword = false; editor = accounts.saveAndFlush(editor);
        configuration = json.createObjectNode();
        for (String page : List.of("home", "about")) {
            ObjectNode section = configuration.putObject(page);
            for (String field : List.of("kicker", "titleLine1", "titleLine2", "description", "description2", "imageAlt"))
                section.putObject(field).put("zh", "原有中文资料");
            section.put("image", "/assets/factory.jpg");
            var entries = section.putArray("entries");
            for (int i = 0; i < 4; i++) { var entry = entries.addObject(); for (String field : List.of("value", "suffix", "label")) entry.putObject(field).put("zh", "原有词条"); }
        }
        var row = new SiteSettings(); row.setId("about-tzme"); row.setConfiguration(json.writeValueAsString(configuration)); settings.saveAndFlush(row);
    }
    @AfterAll static void cleanup() throws Exception { try (var paths = Files.walk(UPLOADS)) { for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path); } }
    private UsernamePasswordAuthenticationToken auth() { return new UsernamePasswordAuthenticationToken(AdminPrincipal.from(editor), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))); }
    private byte[] mp4() {
        byte[] data = new byte[1024]; data[3] = 32;
        System.arraycopy("ftypisom".getBytes(StandardCharsets.US_ASCII), 0, data, 4, 8);
        return data;
    }
    private String upload(byte[] data) throws Exception {
        var result = mvc.perform(multipart("/api/uploads/videos").file(new MockMultipartFile("file", "基地.mp4", "video/mp4", data))
                .with(authentication(auth())).with(csrf())).andExpect(status().isCreated()).andReturn().getResponse();
        return json.readTree(result.getContentAsString()).path("url").asText();
    }
    @Test void videoUploadRequiresLoginAndCsrf() throws Exception {
        var file = new MockMultipartFile("file", "factory.mp4", "video/mp4", mp4());
        mvc.perform(multipart("/api/uploads/videos").file(file).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/uploads/videos").file(file).with(authentication(auth()))).andExpect(status().isForbidden());
    }
    @Test void videoIsPubliclyPlayableWithRangeRequestsAndHead() throws Exception {
        byte[] data = mp4(); String url = upload(data);
        assertThat(url).matches("/api/uploads/videos/[0-9a-f-]{36}\\.mp4");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType("video/mp4"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff")).andExpect(content().bytes(data));
        mvc.perform(get(url).header("Range", "bytes=0-31")).andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Range", "bytes 0-31/1024")).andExpect(content().bytes(Arrays.copyOf(data, 32)));
        mvc.perform(head(url)).andExpect(status().isOk()).andExpect(header().string("Content-Length", "1024"));
        mvc.perform(get("/api/uploads/videos/arbitrary.mp4")).andExpect(status().isNotFound());
    }
    @Test void invalidAndOversizedFilesAreRejectedBeforeStorage() throws Exception {
        for (byte[] data : List.of(new byte[0], "<html>renamed video</html>".getBytes(StandardCharsets.UTF_8)))
            mvc.perform(multipart("/api/uploads/videos").file(new MockMultipartFile("file", "factory.mp4", "video/mp4", data))
                    .with(authentication(auth())).with(csrf())).andExpect(status().isBadRequest());
        var oversized = new MockMultipartFile("file", "large.mp4", "video/mp4", mp4()) {
            @Override public long getSize() { return 100L * 1024 * 1024 + 1; }
        };
        mvc.perform(multipart("/api/uploads/videos").file(oversized).with(authentication(auth())).with(csrf())).andExpect(status().isBadRequest());
    }
    @Test void webmContentReceivesTheCorrectExtensionAndMimeType() throws Exception {
        byte[] data = new byte[64]; data[0] = 0x1a; data[1] = 0x45; data[2] = (byte) 0xdf; data[3] = (byte) 0xa3;
        System.arraycopy("webm".getBytes(StandardCharsets.US_ASCII), 0, data, 10, 4);
        String url = upload(data);
        assertThat(url).endsWith(".webm");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType("video/webm")).andExpect(content().bytes(data));
    }
    @Test void videoCanBeReplacedAndRemovedWithoutLosingExistingTextOrImage() throws Exception {
        String url = upload(mp4()); ((ObjectNode) configuration.path("about")).put("video", url);
        mvc.perform(put("/api/about-tzme").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(configuration)))
                .andExpect(status().isOk()).andExpect(jsonPath("about.video").value(url)).andExpect(jsonPath("home.video").value(""))
                .andExpect(jsonPath("about.image").value("/assets/factory.jpg")).andExpect(jsonPath("about.description.zh").value("原有中文资料"));
        mvc.perform(get("/api/about-tzme")).andExpect(jsonPath("about.video").value(url));
        ((ObjectNode) configuration.path("about")).put("video", "");
        mvc.perform(put("/api/about-tzme").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(configuration)))
                .andExpect(status().isOk()).andExpect(jsonPath("about.video").value(""))
                .andExpect(jsonPath("about.image").value("/assets/factory.jpg")).andExpect(jsonPath("about.description.zh").value("原有中文资料"));
    }
    @Test void oldImageOnlyConfigurationStillSavesAndUnsafeVideoPathsAreRejected() throws Exception {
        mvc.perform(put("/api/about-tzme").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(configuration)))
                .andExpect(status().isOk()).andExpect(jsonPath("about.video").value(""));
        for (String path : List.of("javascript:alert(1)", "https://other.invalid/video.mp4", "/api/uploads/videos/../file.mp4", "/assets/image.jpg")) {
            ((ObjectNode) configuration.path("about")).put("video", path);
            mvc.perform(put("/api/about-tzme").with(authentication(auth())).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(configuration)))
                    .andExpect(status().isBadRequest());
        }
    }
}
