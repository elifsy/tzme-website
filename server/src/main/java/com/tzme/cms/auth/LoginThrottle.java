package com.tzme.cms.auth;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class LoginThrottle {
    private record Attempts(int count, long until) {
    }

    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    private long now() {
        return Instant.now().toEpochMilli();
    }

    public void check(String username, String address) {
        long current = now();
        attempts.entrySet().removeIf(entry -> entry.getValue().until <= current);
        if (blocked("user:" + username, 5, current) || blocked("ip:" + address, 30, current) || attempts.size() > 10000)
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "尝试次数过多，请在十分钟后重试。");
    }

    private boolean blocked(String key, int max, long current) {
        var value = attempts.get(key);
        return value != null && value.until > current && value.count >= max;
    }

    public void failed(String username, String address) {
        increment("user:" + username);
        increment("ip:" + address);
    }

    private void increment(String key) {
        long current = now();
        attempts.compute(key,
                (ignored, previous) -> previous == null || previous.until <= current ? new Attempts(1, current + 600000)
                        : new Attempts(previous.count + 1, previous.until));
    }

    public void succeeded(String username) {
        attempts.remove("user:" + username);
    }
}
