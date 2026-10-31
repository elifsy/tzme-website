package com.tzme.cms.audit;

import com.tzme.cms.auth.*;
import com.tzme.cms.model.*;
import com.tzme.cms.ranking.RankKeyword;
import com.tzme.cms.repository.ContentRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class OperationLogService {
    static final Map<String, String> MODULES = new LinkedHashMap<>(), ACTIONS = new LinkedHashMap<>();
    static {
        String[][] modules = {{"auth","登录与会话"},{"accounts","账号管理"},{"products","产品资料"},{"articles","新闻资讯"},{"industries","行业分类"},{"projects","项目资料"},{"certifications","资质与质量体系"},{"website","网站文案"},{"about","企业介绍"},{"capabilities","制造与质量流程"},{"global","全球业务"},{"solutions","首页方案文案"},{"product-showcase","产品中心展示"},{"partners","合作伙伴"},{"contact","企业与咨询配置"},{"mail","邮件通知"},{"inquiries","客户咨询"},{"analytics","访问统计配置"},{"seo","搜索与 AI 展示"},{"uploads","素材上传"},{"other","其他操作"}};
        for (var entry : modules) MODULES.put(entry[0], entry[1]);
        MODULES.put("rankings", "SEO关键词排名");
        String[][] actions = {{"login","登录"},{"logout","退出登录"},{"create","新增"},{"update","修改"},{"delete","删除"},{"publish","发布"},{"unpublish","下架"},{"enable","启用账号"},{"disable","停用账号"},{"configure","保存配置"},{"upload","上传文件"},{"change_password","修改本人密码"},{"reset_password","重置账号密码"},{"update_status","更新跟进状态"},{"notify","重新提交邮件通知"}};
        for (var entry : actions) ACTIONS.put(entry[0], entry[1]);
        ACTIONS.put("record_rank", "录入实际排名"); ACTIONS.put("check_rank", "采集关键词排名"); ACTIONS.put("import_rank", "导入排名历史"); ACTIONS.put("archive", "归档关键词监测");
    }
    private final OperationLogRepository logs;
    private final AdminAccountRepository accounts;
    private final ContentRepository content;
    private final EntityManager entities;
    public OperationLogService(OperationLogRepository logs, AdminAccountRepository accounts, ContentRepository content, EntityManager entities) {
        this.logs = logs; this.accounts = accounts; this.content = content; this.entities = entities;
    }
    static String clean(Object value, int limit) {
        String text = value == null ? "" : value.toString().replaceAll("[\\p{Cntrl}]", " ").trim();
        return text.length() > limit ? text.substring(0, limit) : text;
    }
    void actor(OperationContext context, AdminPrincipal principal) {
        if (principal == null) return;
        context.actorId = principal.id(); context.username = principal.username(); context.role = principal.role();
        context.displayName = accounts.findById(principal.id()).map(account -> account.displayName).orElse(principal.username());
    }
    void target(OperationContext context) {
        context.targetName = MODULES.getOrDefault(context.module, "后台操作");
        if (context.targetId.isBlank()) return;
        Object existing = switch (context.module) {
            case "products", "articles" -> content.findByIdAndType(context.targetId, context.module).orElse(null);
            case "industries" -> entities.find(Industry.class, context.targetId);
            case "projects" -> entities.find(Project.class, context.targetId);
            case "certifications" -> entities.find(Certification.class, context.targetId);
            case "rankings" -> entities.find(RankKeyword.class, context.targetId);
            case "accounts" -> accounts.findById(context.targetId).map(AdminAccount::view).orElse(null);
            default -> null;
        };
        if (context.module.equals("inquiries")) { context.targetName = "询单 #" + clean(context.targetId, 180); return; }
        if (existing != null) {
            context.beforeStatus = OperationMetadataAdvice.text(existing, "status");
            OperationMetadataAdvice.capture(context, existing);
        }
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void append(OperationContext context, HttpServletRequest request, int status) {
        var row = new OperationLog(); row.requestId = context.requestId; row.createdAt = Instant.now();
        row.actorId = context.actorId;
        row.username = clean(context.username.isEmpty() ? context.attemptedUsername : context.username, 64);
        row.displayName = clean(context.displayName.isEmpty() ? "未认证的登录尝试" : context.displayName, 64); row.role = clean(context.role, 24);
        row.module = context.module; row.action = context.action; row.targetId = clean(context.targetId, 180); row.targetName = clean(context.targetName, 255);
        row.success = status >= 200 && status < 400; row.statusCode = status;
        row.resultMessage = row.success ? "操作成功" : switch (status) { case 400 -> "请求校验未通过"; case 401 -> "账号验证失败或会话已过期"; case 403 -> "权限或登录校验未通过"; case 404 -> "操作目标不存在"; case 409 -> "资料冲突，请刷新后重试"; case 429 -> "操作过于频繁"; default -> status >= 500 ? "服务器未完成操作" : "请求未完成"; };
        row.summary = clean(ACTIONS.getOrDefault(context.action, "操作") + " · " + MODULES.getOrDefault(context.module, "其他操作") + (row.targetName.isBlank() ? "" : "：" + row.targetName), 500);
        row.method = clean(request.getMethod(), 10); row.path = clean(request.getRequestURI(), 500); row.address = clean(request.getRemoteAddr(), 64);
        row.durationMs = Math.max(0, (System.nanoTime() - context.started) / 1_000_000);
        logs.saveAndFlush(row);
    }
}
