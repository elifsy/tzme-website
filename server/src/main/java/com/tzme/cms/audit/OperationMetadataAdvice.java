package com.tzme.cms.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.tzme.cms.auth.*;
import com.tzme.cms.ranking.RankKeyword;
import com.tzme.cms.ranking.RankService;
import java.lang.reflect.Type;
import java.util.Map;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.core.MethodParameter;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.*;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.context.request.*;
import org.springframework.web.servlet.mvc.method.annotation.*;

@ControllerAdvice
public class OperationMetadataAdvice extends RequestBodyAdviceAdapter implements ResponseBodyAdvice<Object> {
    private static OperationContext current() {
        var attributes = RequestContextHolder.getRequestAttributes();
        return attributes instanceof ServletRequestAttributes servlet ? (OperationContext) servlet.getRequest().getAttribute(OperationContext.ATTRIBUTE) : null;
    }
    @Override public boolean supports(MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) { return current() != null; }
    @Override public Object afterBodyRead(Object body, HttpInputMessage message, MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        var context = current(); if (context != null) capture(context, body); return body;
    }
    @Override public boolean supports(MethodParameter parameter, Class<? extends HttpMessageConverter<?>> converterType) { return current() != null; }
    @Override public Object beforeBodyWrite(Object body, MethodParameter parameter, MediaType mediaType, Class<? extends HttpMessageConverter<?>> converterType, ServerHttpRequest request, ServerHttpResponse response) {
        var context = current(); if (context != null) capture(context, body); return body;
    }
    // Only allowlisted metadata is inspected. Passwords, bodies, SMTP settings,
    // customer details, tokens, headers and file contents are never serialized.
    static String text(Object body, String property) {
        if (body == null) return "";
        Object value = null;
        if (body instanceof JsonNode node) { var item = node.get(property); value = item != null && item.isValueNode() ? item.asText() : null; }
        else if (body instanceof Map<?, ?> map) value = map.get(property);
        else if (body instanceof AuthController.LoginInput input && property.equals("username")) value = input.username();
        else if (body instanceof AdminAccountService.AccountInput input) value = switch (property) { case "username" -> input.username(); case "displayName" -> input.displayName(); case "status" -> input.status(); default -> null; };
        else if (body instanceof AdminAccount.AccountView account) value = switch (property) { case "id" -> account.id(); case "username" -> account.username(); case "displayName" -> account.displayName(); case "status" -> account.status(); default -> null; };
        else if (body instanceof RankKeyword keyword) value = switch (property) { case "id" -> keyword.id; case "keyword" -> keyword.keyword; default -> null; };
        else if (body instanceof RankService.CreateInput input && property.equals("keyword")) value = input.keyword();
        else {
            try { var bean = new BeanWrapperImpl(body); if (bean.isReadableProperty(property)) value = bean.getPropertyValue(property); } catch (RuntimeException ignored) { }
        }
        return value instanceof String || value instanceof Number ? OperationLogService.clean(value, 255) : "";
    }
    static void capture(OperationContext context, Object body) {
        if (context.module.equals("auth")) {
            if (context.action.equals("login")) {
                String username = text(body, "username").replaceAll("[^a-zA-Z0-9_.-]", "");
                if (!username.isBlank()) context.attemptedUsername = username;
            }
            return;
        }
        if (context.module.equals("inquiries")) return;
        if (context.module.equals("rankings")) {
            String keyword=text(body,"keyword"),id=text(body,"id");
            if(!keyword.isBlank())context.targetName=keyword;if(!id.isBlank())context.targetId=id;
            return;
        }
        if (context.action.equals("upload")) {
            String url = text(body, "url"), id = text(body, "id");
            if (!url.isBlank()) context.targetId = url.substring(url.lastIndexOf('/') + 1);
            else if (!id.isBlank()) context.targetId = id;
            return;
        }
        if (!java.util.Set.of("products", "articles", "industries", "projects", "certifications", "accounts").contains(context.module)) return;
        String id = text(body, "id"), title = text(body, "titleZh");
        if (title.isBlank()) title = text(body, "titleEn");
        if (context.module.equals("accounts")) {
            String username = text(body, "username"), name = text(body, "displayName");
            if (!username.isBlank()) title = name.isBlank() ? username : name + "（" + username + "）";
        }
        if (!id.isBlank()) context.targetId = id;
        if (!title.isBlank()) context.targetName = title;
        String status = text(body, "status");
        if (context.action.equals("update") && !context.beforeStatus.isBlank() && !status.isBlank() && !context.beforeStatus.equals(status)) {
            if (context.module.equals("accounts")) context.action = status.equals("disabled") ? "disable" : "enable";
            else if (status.equals("published")) context.action = "publish";
            else if (status.equals("draft")) context.action = "unpublish";
        }
    }
}
