package com.classlink.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import com.classlink.server.model.Admin;
import com.classlink.server.repository.AdminRepository;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

	// Seed a default admin user (email: admin, password: admin) if missing
	@Bean
	CommandLineRunner seedDefaultAdmin(AdminRepository adminRepository) {
		return args -> {
			try {
				Admin existing = adminRepository.findByEmail("admin");
				if (existing == null) {
					Admin admin = new Admin();
					admin.setName("Default Admin");
					admin.setEmail("admin");
					admin.setPassword("admin");
					admin.setRole("ADMIN");
					adminRepository.save(admin);
					System.out.println("[Seed] Created default admin (admin/admin)");
				}
			} catch (Exception e) {
				System.err.println("[Seed] Failed to ensure default admin: " + e.getMessage());
			}
		};
	}
}
