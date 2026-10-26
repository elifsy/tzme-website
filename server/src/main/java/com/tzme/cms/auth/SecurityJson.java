package com.tzme.cms.auth;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

final class SecurityJson {
    private static final ObjectMapper JSON = new ObjectMapper();
    static void write(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status); response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");
        JSON.writeValue(response.getOutputStream(), Map.of("code", code, "message", message));
    }
}
