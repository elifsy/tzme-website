package com.tzme.cms.auth;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/accounts")
public class AdminAccountController {
    private final AdminAccountService service;
    public AdminAccountController(AdminAccountService service) { this.service = service; }
    @GetMapping public List<AdminAccount.AccountView> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public AdminAccount.AccountView create(@RequestBody AdminAccountService.AccountInput input) { return service.create(input); }
    @PutMapping("/{id}")
    public AdminAccount.AccountView update(@PathVariable String id, @RequestBody AdminAccountService.AccountInput input) { return service.update(id, input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
    public record ResetInput(String password) {}
    @PostMapping("/{id}/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@PathVariable String id, @RequestBody ResetInput input, @AuthenticationPrincipal AdminPrincipal principal) { service.resetPassword(id, input.password(), principal.id()); }
}
