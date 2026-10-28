package com.tzme.cms.auth;

import java.io.Serializable;
import java.security.Principal;

public record AdminPrincipal(String id, String username, String role, long authVersion, boolean mustChangePassword)
        implements Principal, Serializable {
    @Override
    public String getName() {
        return username;
    }

    public static AdminPrincipal from(AdminAccount account) {
        return new AdminPrincipal(account.id, account.username, account.role, account.authVersion,
                account.mustChangePassword);
    }
}
