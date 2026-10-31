package com.tzme.cms.audit;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/operation-logs")
public class OperationLogController {
    private final OperationLogRepository logs;
    public OperationLogController(OperationLogRepository logs) { this.logs = logs; }
    @GetMapping("/options") public Map<String, Object> options() {
        return Map.of("modules", options(OperationLogService.MODULES), "actions", options(OperationLogService.ACTIONS));
    }
    private List<Map<String, String>> options(Map<String, String> values) { return values.entrySet().stream().map(entry -> Map.of("value", entry.getKey(), "label", entry.getValue())).toList(); }
    @GetMapping public Map<String, Object> list(
            @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "") String actor,
            @RequestParam(defaultValue = "") String module, @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String result, @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        if (page < 1 || page > 100000 || pageSize < 1 || pageSize > 100 || keyword.length() > 128 || actor.length() > 64 || module.length() > 40 || action.length() > 32 || !Set.of("", "success", "failure").contains(result) || (from != null && to != null && !from.isBefore(to))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid operation log filters");
        var rows = logs.findAll((root, query, cb) -> {
            var conditions = new ArrayList<Predicate>();
            if (!keyword.isBlank()) { String pattern = like(keyword); conditions.add(cb.or(cb.like(cb.lower(root.get("summary")), pattern, '\\'), cb.like(cb.lower(root.get("targetId")), pattern, '\\'), cb.like(cb.lower(root.get("username")), pattern, '\\'), cb.like(cb.lower(root.get("displayName")), pattern, '\\'))); }
            if (!actor.isBlank()) { String pattern = like(actor); conditions.add(cb.or(cb.like(cb.lower(root.get("username")), pattern, '\\'), cb.like(cb.lower(root.get("displayName")), pattern, '\\'))); }
            if (!module.isBlank()) conditions.add(cb.equal(root.get("module"), module));
            if (!action.isBlank()) conditions.add(cb.equal(root.get("action"), action));
            if (!result.isBlank()) conditions.add(cb.equal(root.get("success"), result.equals("success")));
            if (from != null) conditions.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null) conditions.add(cb.lessThan(root.get("createdAt"), to));
            return cb.and(conditions.toArray(Predicate[]::new));
        }, PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        return Map.of("items", rows.getContent(), "total", rows.getTotalElements(), "page", page, "pageSize", pageSize);
    }
    private String like(String value) { return "%" + value.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"; }
    @GetMapping("/{id}") public OperationLog detail(@PathVariable Long id) { return logs.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); }
}
