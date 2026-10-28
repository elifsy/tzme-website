package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.tzme.cms.service.AnalyticsService;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AnalyticsControllerTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private AnalyticsService service;
    private MockMvc mvc;
    @BeforeEach void setup() {
        service = mock(AnalyticsService.class); when(service.enabled()).thenReturn(true);
        mvc = MockMvcBuilders.standaloneSetup(new AnalyticsController(service, mock(JdbcTemplate.class))).build();
    }
    private ObjectNode event(String name, String path) {
        var node = mapper.createObjectNode();
        node.put("id", UUID.randomUUID().toString()).put("visitorId", UUID.randomUUID().toString()).put("sessionId", UUID.randomUUID().toString());
        node.put("name",name).put("path",path).put("locale","zh").put("device","desktop").put("referrerHost","direct").put("target","ports").put("duration",0).put("scrollDepth",0);
        return node;
    }
    private String batch(JsonNode... events) throws Exception {
        var node = mapper.createObjectNode(); var array = node.putArray("events"); for (var event : events) array.add(event); return mapper.writeValueAsString(node);
    }
    @Test void newInteractionsAndWebsiteDirectoryAreAccepted() throws Exception {
        var names = List.of("product_type_filter","model_select","model_hover","model_control","certificate_view","download_click","language_outbound","quality_step","map_location");
        var events = names.stream().map(name -> event(name,"/solutions")).toArray(JsonNode[]::new);
        mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(events))).andExpect(status().isNoContent());
        verify(service,times(names.size())).insert(any(),anyString(),anyString(),anyString());
        mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(event("page_view","/site-map")))).andExpect(status().isNoContent());
        assertThat(AnalyticsService.pageKey("/site-map")).isEqualTo("site_map");
    }
    @Test void invalidEventRejectsTheEntireBatchWithoutPartialWrites() throws Exception {
        mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(event("model_select","/solutions"),event("unknown","/solutions")))).andExpect(status().isBadRequest());
        verify(service,never()).insert(any(),anyString(),anyString(),anyString());
    }
    @Test void adminPathsAndClientForgedConversionsAreRejected() throws Exception {
        for (var node : List.of(event("page_view","/admin/partners"),event("inquiry_success","/contact")))
            mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(node))).andExpect(status().isBadRequest());
        verify(service,never()).insert(any(),anyString(),anyString(),anyString());
    }
    @Test void invalidTargetsAndEngagementRemainRejected() throws Exception {
        var invalidTarget = event("model_control","/solutions"); invalidTarget.put("target","bad\nvalue");
        var invalidDepth = event("page_engagement","/solutions"); invalidDepth.put("scrollDepth",101);
        for (var node : List.of(invalidTarget,invalidDepth))
            mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(node))).andExpect(status().isBadRequest());
        verify(service,never()).insert(any(),anyString(),anyString(),anyString());
    }
    @Test void collectionPauseAcceptsNoNewWrites() throws Exception {
        when(service.enabled()).thenReturn(false);
        mvc.perform(post("/api/analytics/events").contentType(MediaType.APPLICATION_JSON).content(batch(event("model_select","/solutions")))).andExpect(status().isNoContent());
        verify(service,never()).insert(any(),anyString(),anyString(),anyString());
    }
}
