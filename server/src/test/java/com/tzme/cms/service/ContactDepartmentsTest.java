package com.tzme.cms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tzme.cms.model.SiteSettings;
import com.tzme.cms.repository.SiteSettingsRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContactDepartmentsTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private SiteSettingsRepository repository;
    private ContactSettingsService service;
    private SiteSettings row;
    @BeforeEach void setup() throws Exception {
        repository = mock(SiteSettingsRepository.class); service = new ContactSettingsService(repository, mapper);
        var baseline = mapper.createObjectNode(); var contact = baseline.putObject("contact");
        contact.putObject("headquarters").put("zh", "天津总部"); contact.putObject("address").put("zh", "天津测试地址");
        contact.putObject("port").put("zh", "天津港"); contact.put("phone", "022-12345678 / 87654321");
        contact.put("fax", ""); contact.put("website", "www.tzme.net"); contact.putArray("emails").add("general@example.invalid");
        baseline.putArray("subsidiaries"); var form = baseline.putObject("form");
        for (String key : List.of("title", "buttonText", "successText", "closedText", "privacyText")) form.putObject(key).put("zh", "测试文案");
        form.putArray("requiredFields"); var upload = baseline.putObject("upload"); upload.put("enabled", true); upload.put("maxFileSizeMb", 20); upload.put("maxFiles", 5); upload.putArray("allowedExtensions").add("pdf");
        baseline.putObject("notification").putObject("smtp").put("password", "PRIVATE-SMTP-SENTINEL");
        row = new SiteSettings(); row.setId("contact"); row.setConfiguration(mapper.writeValueAsString(baseline));
        when(repository.findById("contact")).thenReturn(Optional.of(row)); when(repository.findForUpdate("contact")).thenReturn(Optional.of(row));
    }
    private ObjectNode department(ObjectNode input, String id) {
        for (var item : input.path("contact").path("departments")) if (item.path("id").asText().equals(id)) return (ObjectNode) item;
        throw new AssertionError(id);
    }
    @Test void existingConfigurationsReceiveFiveEntriesWithoutChangingStoredDataOrExposingSmtp() throws Exception {
        var result = service.publicConfiguration();
        assertThat(result.path("contact").path("departments")).hasSize(5);
        assertThat(result.toString()).doesNotContain("PRIVATE-SMTP-SENTINEL");
        assertThat(mapper.readTree(row.getConfiguration()).path("contact").has("departments")).isFalse();
        for (var item : result.path("contact").path("departments")) {
            assertThat(ContactDepartments.phone(item, result.path("contact"))).isEqualTo("022-12345678 / 87654321");
            assertThat(ContactDepartments.emails(item, result.path("contact"))).containsExactly("general@example.invalid");
        }
        verify(repository, never()).save(any());
    }
    @Test void independentChannelsPersistWithoutChangingGeneralContactsOrPrivateMailSettings() throws Exception {
        var input = service.adminConfiguration(); department(input, "hr").put("email", "hr@example.invalid").put("phone", "022-11112222");
        service.save(input); var loaded = service.publicConfiguration();
        assertThat(department(loaded, "hr").path("email").asText()).isEqualTo("hr@example.invalid");
        assertThat(loaded.path("contact").path("phone").asText()).isEqualTo("022-12345678 / 87654321");
        assertThat(mapper.readTree(row.getConfiguration()).path("notification").path("smtp").path("password").asText()).isEqualTo("PRIVATE-SMTP-SENTINEL");
        assertThat(loaded.has("notification")).isFalse();
    }
    @Test void anOlderEditorCannotEraseExistingDepartmentContacts() {
        var input = service.adminConfiguration(); department(input, "sales").put("email", "sales@example.invalid");
        ((ArrayNode) input.path("contact").path("departments")).addObject().put("id", "custom-support").put("title", "客户服务").put("description", "售后支持").put("phone", "").put("email", "service@example.invalid").put("enabled", true);
        service.save(input);
        var older = service.adminConfiguration(); ((ObjectNode) older.path("contact")).remove("departments");
        service.save(older);
        assertThat(department(service.adminConfiguration(), "sales").path("email").asText()).isEqualTo("sales@example.invalid");
        assertThat(department(service.adminConfiguration(), "custom-support").path("email").asText()).isEqualTo("service@example.invalid");
    }
    @Test void disabledChannelsAreRetainedForAdminsAndRemovedFromThePublicResponse() {
        var input = service.adminConfiguration(); department(input, "hr").put("email", "hidden-hr@example.invalid").put("phone", "022-99998888").put("enabled", false); service.save(input);
        assertThat(department(service.adminConfiguration(), "hr").path("email").asText()).isEqualTo("hidden-hr@example.invalid");
        assertThat(service.publicConfiguration().toString()).doesNotContain("hidden-hr@example.invalid", "022-99998888");
        assertThat(department(service.publicConfiguration(), "hr").path("enabled").asBoolean()).isFalse();
    }
    @Test void invalidDepartmentEmailAndDuplicateOrUnsafeIdsCannotBeSaved() {
        var input = service.adminConfiguration(); department(input, "hr").put("email", "invalid");
        assertThatThrownBy(() -> service.save(input)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("邮箱");
        var duplicate = service.adminConfiguration(); department(duplicate, "sales").put("id", "hr");
        assertThatThrownBy(() -> service.save(duplicate)).isInstanceOf(ResponseStatusException.class);
        var unsafe = service.adminConfiguration(); department(unsafe, "hr").put("id", "bad\"id");
        assertThatThrownBy(() -> service.save(unsafe)).isInstanceOf(ResponseStatusException.class);
    }
    @Test void customCategoriesPersistInOrderAndInheritGeneralChannels() {
        var input = service.adminConfiguration(); var rows = (ArrayNode) input.path("contact").path("departments");
        rows.addObject().put("id", "department-1234-5678").put("title", "客户服务").put("description", "售后与维护支持").put("phone", "").put("email", "").put("enabled", true);
        service.save(input);
        var contact = service.publicConfiguration().path("contact");
        assertThat(contact.path("departments")).hasSize(6);
        var added = contact.path("departments").get(5);
        assertThat(added.path("title").asText()).isEqualTo("客户服务");
        assertThat(ContactDepartments.phone(added, contact)).isEqualTo("022-12345678 / 87654321");
        assertThat(ContactDepartments.emails(added, contact)).containsExactly("general@example.invalid");
    }
    @Test void removedCategoriesStayRemovedIncludingAnExplicitlyEmptyList() {
        var input = service.adminConfiguration(); ((ArrayNode) input.path("contact").path("departments")).remove(0); service.save(input);
        assertThat(service.publicConfiguration().path("contact").path("departments")).hasSize(4);
        ((ObjectNode) input.path("contact")).putArray("departments"); service.save(input);
        assertThat(service.publicConfiguration().path("contact").path("departments")).isEmpty();
        assertThat(service.adminConfiguration().path("contact").path("departments")).isEmpty();
    }
    @Test void categoryCountIsBoundedAndNewCategoriesRequireNames() {
        var input = service.adminConfiguration(); var rows = ((ObjectNode) input.path("contact")).putArray("departments");
        for (int i = 0; i < ContactDepartments.MAX_COUNT; i++) rows.addObject().put("id", "category-" + i).put("title", "分类" + i).put("description", "").put("phone", "").put("email", "").put("enabled", true);
        service.save(input); assertThat(service.adminConfiguration().path("contact").path("departments")).hasSize(ContactDepartments.MAX_COUNT);
        rows.addObject().put("id", "extra").put("title", "额外").put("description", "").put("phone", "").put("email", "").put("enabled", true);
        assertThatThrownBy(() -> service.save(input)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("最多");
        rows.remove(rows.size() - 1); ((ObjectNode) rows.get(0)).put("title", "");
        assertThatThrownBy(() -> service.save(input)).isInstanceOf(ResponseStatusException.class).hasMessageContaining("名称");
    }
    @Test void oversizedTextUnknownFieldsAndHeaderNewlinesAreRejected() {
        var longTitle = service.adminConfiguration(); department(longTitle, "hr").put("title", "字".repeat(41));
        assertThatThrownBy(() -> service.save(longTitle)).isInstanceOf(ResponseStatusException.class);
        var unknown = service.adminConfiguration(); department(unknown, "hr").put("privateToken", "invalid");
        assertThatThrownBy(() -> service.save(unknown)).isInstanceOf(ResponseStatusException.class);
        var newline = service.adminConfiguration(); department(newline, "hr").put("phone", "022-1234\r\nInjected: value");
        assertThatThrownBy(() -> service.save(newline)).isInstanceOf(ResponseStatusException.class);
    }
}
