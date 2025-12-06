package com.classlink.server.init;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.classlink.server.model.Admin;
import com.classlink.server.repository.AdminRepository;

@Component
public class AdminStatusInitializer {

    private static final Logger log = LoggerFactory.getLogger(AdminStatusInitializer.class);

    private final AdminRepository adminRepository;

    public AdminStatusInitializer(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureActiveFlags() {
        List<Admin> toActivate = new ArrayList<>();
        for (Admin admin : adminRepository.findAll()) {
            if (admin.isActive()) {
                continue;
            }
            if (admin.getRemovedBy() != null && !admin.getRemovedBy().isBlank()) {
                continue;
            }
            admin.setActive(true);
            toActivate.add(admin);
        }
        if (toActivate.isEmpty()) {
            return;
        }
        adminRepository.saveAll(toActivate);
        log.info("Marked {} legacy admin accounts as active", toActivate.size());
    }
}
