package com.tzme.cms.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminTutorialService {
    private static final Set<String> MODULES = Set.of("overview", "analytics", "rankings", "products", "industries", "articles",
            "home", "product-showcase", "solutions", "capabilities", "global", "seo", "about", "certifications", "partners", "contact",
            "inquiries", "forms", "mail", "projects", "logs", "accounts");
    private final AdminAccountRepository accounts;
    private final AdminTutorialRepository progress;
    public AdminTutorialService(AdminAccountRepository accounts, AdminTutorialRepository progress) { this.accounts = accounts; this.progress = progress; }
    public record TutorialStart(String module, boolean shouldStart, Instant seenAt) {}
    public Map<String, Instant> seen(String accountId) {
        return progress.findAllByAccountId(accountId).stream().collect(Collectors.toMap(item -> item.moduleKey, item -> item.seenAt));
    }
    public AdminAccount.AccountView view(AdminAccount account) { return account.view(seen(account.id)); }
    @Transactional
    public TutorialStart start(String accountId, String module) {
        if (module == null || !MODULES.contains(module)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请选择有效的功能教程。");
        var account = accounts.findForUpdate(accountId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "账号不存在。"));
        if (module.equals("accounts") && !account.role.equals("SUPER_ADMIN")) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "当前账号没有此功能权限。");
        String id = accountId + ":" + module;
        var existing = progress.findById(id);
        if (existing.isPresent()) return new TutorialStart(module, false, existing.get().seenAt);
        var item = new AdminTutorialProgress(); item.id = id; item.accountId = accountId; item.moduleKey = module;
        item.seenAt = Instant.now().truncatedTo(ChronoUnit.MICROS); progress.saveAndFlush(item);
        return new TutorialStart(module, true, item.seenAt);
    }
}
