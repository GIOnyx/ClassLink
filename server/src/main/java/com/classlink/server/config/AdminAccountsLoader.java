package com.classlink.server.config;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.classlink.server.model.Admin;
import com.classlink.server.repository.AdminRepository;

/**
 * Loads admin accounts from classpath file 'admin-accounts.csv' at startup.
 * File format (CSV, no quotes): email,password,name
 * Lines beginning with '#' or blank lines are ignored.
 * If an admin with given email does not exist it is created.
 * Intentionally keeps plain text password for dev only; hash before production.
 */
@Component
public class AdminAccountsLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountsLoader.class);
    private final AdminRepository adminRepository;

    public AdminAccountsLoader(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        ClassPathResource resource = new ClassPathResource("admin-accounts.csv");
        if (!resource.exists()) {
            log.info("admin-accounts.csv not found; skipping admin file load");
            return;
        }
        List<Admin> loaded = new ArrayList<>();
        try (InputStream is = resource.getInputStream();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split(",");
                if (parts.length < 3) {
                    log.warn("Skipping malformed admin line: {}", line);
                    continue;
                }
                String email = parts[0].trim();
                String password = parts[1].trim();
                String name = parts[2].trim();
                if (email.isEmpty() || password.isEmpty()) {
                    log.warn("Skipping admin with blank email/password: {}", line);
                    continue;
                }
                Admin existing = adminRepository.findByEmail(email);
                if (existing == null) {
                    Admin admin = new Admin();
                    admin.setEmail(email);
                    admin.setPassword(password); // Plain text for dev
                    admin.setName(name.isEmpty() ? email : name);
                    admin.setRole("ADMIN");
                    adminRepository.save(admin);
                    loaded.add(admin);
                }
            }
        } catch (IOException e) {
            log.error("Failed reading admin-accounts.csv", e);
        }
        if (!loaded.isEmpty()) {
            log.info("Loaded {} admin account(s) from file", loaded.size());
        }
    }
}