package com.classlink.server.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.classlink.server.dto.AdminAccountDto;

@Service
public class AdminAccountsFileService {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountsFileService.class);

    private final String adminAccountsFile;

    public AdminAccountsFileService(@Value("${app.admin.accounts-file:src/main/resources/admin-accounts.csv}") String adminAccountsFile) {
        this.adminAccountsFile = adminAccountsFile;
    }

    /**
     * Reads admin-accounts.csv style file (email,password,name) skipping comments/blank lines.
     */
    public List<AdminAccountDto> readAccounts() {
        Path path = resolvePath();
        if (path == null || !Files.exists(path)) {
            return Collections.emptyList();
        }
        List<AdminAccountDto> accounts = new ArrayList<>();
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                String[] parts = line.split(",");
                if (parts.length < 3) {
                    log.warn("Skipping malformed admin entry: {}", line);
                    continue;
                }
                AdminAccountDto dto = new AdminAccountDto();
                dto.setEmail(parts[0].trim());
                dto.setPassword(parts[1].trim());
                dto.setName(parts[2].trim());
                accounts.add(dto);
            }
        } catch (IOException e) {
            log.warn("Unable to read admin accounts file", e);
        }
        return accounts;
    }

    /**
     * Appends a new admin record to the underlying csv file.
     */
    public void appendAccount(AdminAccountDto dto) {
        Path path = resolvePath();
        if (path == null) {
            log.warn("Admin accounts path is not configured; skipping append");
            return;
        }
        try {
            Path parent = path.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            String line = String.format("%s,%s,%s%s", dto.getEmail().trim(), dto.getPassword().trim(), dto.getName().trim(), System.lineSeparator());
            Files.write(path, line.getBytes(StandardCharsets.UTF_8), StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (IOException e) {
            log.warn("Failed to append admin account to file {}", path, e);
        }
    }

    private Path resolvePath() {
        Path configured = Paths.get(adminAccountsFile).normalize();
        if (!configured.isAbsolute()) {
            Path userDir = Paths.get(System.getProperty("user.dir", ""));
            Path candidate = userDir.resolve(configured).normalize();
            if (Files.exists(candidate) || hasExistingParent(candidate)) {
                return candidate;
            }
            // try server/ prefix when launched from monorepo root
            candidate = userDir.resolve("server").resolve(configured).normalize();
            if (Files.exists(candidate) || hasExistingParent(candidate)) {
                return candidate;
            }
            return candidate; // fall back to server-relative even if it doesn't exist yet
        }
        return configured;
    }

    private boolean hasExistingParent(Path candidate) {
        Path parent = candidate.getParent();
        return parent != null && Files.exists(parent);
    }
}
