package com.classlink.server.security;

import org.springframework.security.authentication.DisabledException;
import org.springframework.util.StringUtils;

public class RemovedAdminException extends DisabledException {

    private final String removedBy;

    public RemovedAdminException(String removedBy) {
        super("Admin account removed");
        this.removedBy = StringUtils.hasText(removedBy) ? removedBy : "Administrator";
    }

    public String getRemovedBy() {
        return removedBy;
    }
}
