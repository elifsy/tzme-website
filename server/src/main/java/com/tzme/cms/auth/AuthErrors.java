package com.tzme.cms.auth;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = {AuthController.class, AdminAccountController.class})
public class AuthErrors {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason() == null ? "操作失败，请重试。" : error.getReason()));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> duplicate(DataIntegrityViolationException error) { return ResponseEntity.status(409).body(Map.of("message", "登录账号已存在，请使用其他账号。")); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<?> conflict(ObjectOptimisticLockingFailureException error) { return ResponseEntity.status(409).body(Map.of("message", "账号刚被修改，请刷新后重试。")); }
}
