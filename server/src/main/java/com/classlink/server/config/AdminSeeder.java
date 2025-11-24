package com.classlink.server.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.classlink.server.model.Admin;
import com.classlink.server.repository.AdminRepository;

/**
 * Seeds a default admin account (email: admin, password: admin) if none exists.
 * This is for development only; remove or secure before production.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private final AdminRepository adminRepository;

    public AdminSeeder(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // If any admin exists, skip seeding
        if (adminRepository.count() > 0) return;

        // Create default admin
        Admin admin = new Admin();
        admin.setName("System Administrator");
        admin.setEmail("admin"); // Using simple username style
        admin.setPassword("admin"); // Plain text for dev convenience
        admin.setRole("ADMIN");
        adminRepository.save(admin);
    }
}