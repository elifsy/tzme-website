package com.tzme.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;

/** Public department channels inherit the headquarters contact until configured. */
public final class ContactDepartments {
    private ContactDepartments() {}
    public static final int MAX_COUNT = 20;
    private static final List<String> DEFAULT_IDS = List.of("procurement", "sales", "hr", "culture", "digital-lean");
    public static ArrayNode defaults(ObjectMapper mapper) {
        var rows = mapper.createArrayNode();
        String[] titles = {"采购", "销售", "HR", "企业文化", "数字精益"};
        String[] descriptions = {"采购需求、供应商合作与物料对接。", "设备咨询、制造需求与供货沟通。", "招聘应聘、人才发展与人力资源合作。", "企业文化、品牌传播与交流合作。", "数字化建设、精益改善与协同交流。"};
        for (int i = 0; i < DEFAULT_IDS.size(); i++) {
            var item = rows.addObject(); item.put("id", DEFAULT_IDS.get(i)); item.put("title", titles[i]);
            item.put("description", descriptions[i]); item.put("phone", ""); item.put("email", ""); item.put("enabled", true);
        }
        return rows;
    }
    public static void ensure(JsonNode contact, ObjectMapper mapper) {
        if (contact instanceof ObjectNode node && !node.has("departments")) node.set("departments", defaults(mapper));
    }
    public static String phone(JsonNode item, JsonNode contact) {
        var own = item.path("phone").asText().trim(); return own.isEmpty() ? contact.path("phone").asText() : own;
    }
    public static List<String> emails(JsonNode item, JsonNode contact) {
        var own = item.path("email").asText().trim();
        if (!own.isEmpty()) return List.of(own);
        var values = new java.util.ArrayList<String>();
        for (var email : contact.path("emails")) if (!email.asText().isBlank()) values.add(email.asText());
        return values;
    }
}
