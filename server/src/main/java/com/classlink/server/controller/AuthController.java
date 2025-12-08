package com.classlink.server.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.classlink.server.model.Admin;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;
import com.classlink.server.repository.AdminRepository;
import com.classlink.server.repository.StudentRepository;
import com.classlink.server.security.ClasslinkUserDetails;
import com.classlink.server.security.ClasslinkUserDetailsService;
import com.classlink.server.security.RemovedAdminException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_EMAIL_LOGIN_KEY = "allowEmailLoginForEmail";

    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;
    private final AuthenticationManager authenticationManager;
    private final ClasslinkUserDetailsService userDetailsService;

    public AuthController(AdminRepository adminRepository,
            StudentRepository studentRepository,
            AuthenticationManager authenticationManager,
            ClasslinkUserDetailsService userDetailsService) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    public record LoginRequest(String identifier, String password) {
    }

    public record RegisterRequest(String firstName, String lastName, String email, String password) {
    }

    public record ChangePasswordRequest(String oldPassword, String newPassword) {
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body, HttpServletRequest request) {
        if (body == null || body.identifier() == null || body.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email/account ID and password are required"));
        }

        String identifier = body.identifier().trim();
        if (identifier.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email/account ID and password are required"));
        }
        HttpSession session = request.getSession(true);
        boolean emailAllowed = isEmailLoginAllowed(session, identifier);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, body.password()));
            ClasslinkUserDetails principal = (ClasslinkUserDetails) authentication.getPrincipal();
            Map<String, Object> payload = new HashMap<>();

            if (principal.isStudent()) {
                Student student = studentRepository.findById(principal.getUserId()).orElse(null);
                if (student == null) {
                    return ResponseEntity.status(404).body(Map.of("error", "Student record not found"));
                }
                boolean usingEmail = student.getEmail() != null && student.getEmail().equalsIgnoreCase(identifier);
                boolean graceActive = student.isEmailLoginGraceActive();
                if (student.getStatus() == StudentStatus.APPROVED && usingEmail && !emailAllowed) {
                    if (graceActive) {
                        student.setEmailLoginGraceActive(false);
                        studentRepository.save(student);
                    } else {
                        return ResponseEntity.status(400)
                                .body(Map.of("error",
                                        "Your application is approved. Please use your Student ID (e.g., 25-0001-123) to sign in."));
                    }
                }
                if (student.getStatus() == StudentStatus.INACTIVE) {
                    return ResponseEntity.status(403).body(Map.of("error", "Account is inactive"));
                }
                if (usingEmail && emailAllowed) {
                    clearEmailLoginAllowance(session);
                }
                payload.put("userType", "student");
                payload.put("userId", student.getId());
                payload.put("role", "STUDENT");
                payload.put("firstName", student.getFirstName());
                payload.put("lastName", student.getLastName());
            } else {
                Admin admin = adminRepository.findById(principal.getUserId()).orElse(null);
                if (admin == null) {
                    return ResponseEntity.status(404).body(Map.of("error", "Admin record not found"));
                }
                payload.put("userType", "admin");
                payload.put("userId", admin.getAdminId());
                payload.put("role", "ADMIN");
                payload.put("name", admin.getName());
            }

            storeAuthentication(authentication, request);
            return ResponseEntity.ok(payload);
        } catch (RemovedAdminException ex) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Admin account has been removed",
                    "removedBy", ex.getRemovedBy()
            ));
        } catch (DisabledException ex) {
            return ResponseEntity.status(403).body(Map.of("error", "Account is inactive"));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }

    @PostMapping("/forgot-id")
    public ResponseEntity<?> forgotStudentId(@RequestBody Map<String, String> body, HttpServletRequest request) {
        if (body == null || body.get("email") == null || body.get("email").isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        String email = body.get("email").trim();
        Student student = studentRepository.findByEmail(email);
        if (student == null) {
            return ResponseEntity.status(404).body(Map.of("error", "No account found for that email"));
        }
        if (student.getStatus() != StudentStatus.APPROVED) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Forgot ID is only available once your application is approved"));
        }
        allowEmailLogin(request.getSession(true), email);
        return ResponseEntity.ok(Map.of("message",
                "Email login is temporarily enabled. Use your email and password once, then continue signing in with your Student ID."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("authenticated", true);
        payload.put("userType", principal.getUserType());
        payload.put("userId", principal.getUserId());
        payload.put("role", principal.getRole());
        if (principal.isStudent()) {
            studentRepository.findById(principal.getUserId()).ifPresent(student -> {
                payload.put("firstName", student.getFirstName());
                payload.put("lastName", student.getLastName());
            });
        } else {
            adminRepository.findById(principal.getUserId()).ifPresent(admin -> payload.put("name", admin.getName()));
        }
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest body, HttpServletRequest request) {
        if (body == null || body.email() == null || body.password() == null || body.firstName() == null
                || body.lastName() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "firstName, lastName, email and password are required"));
        }
        if (studentRepository.findByEmail(body.email()) != null) {
            return ResponseEntity.status(409).body(Map.of("error", "Email already in use"));
        }
        Student s = new Student();
        s.setFirstName(body.firstName());
        s.setLastName(body.lastName());
        s.setEmail(body.email());
        s.setPassword(body.password());

        // ✅ CHANGED: Set status to REGISTERED (invisible to admin) initially
        s.setStatus(StudentStatus.REGISTERED);

        Student saved = studentRepository.save(s);

        ClasslinkUserDetails details = (ClasslinkUserDetails) userDetailsService.loadUserByUsername(saved.getEmail());
        Authentication authentication = new UsernamePasswordAuthenticationToken(details, details.getPassword(), details.getAuthorities());
        storeAuthentication(authentication, request);

        return ResponseEntity.status(201).body(Map.of(
                "userType", "student",
                "userId", saved.getId(),
                "role", "STUDENT",
                "firstName", saved.getFirstName(),
                "lastName", saved.getLastName()));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest body,
            @AuthenticationPrincipal ClasslinkUserDetails principal) {
        if (body == null || body.oldPassword() == null || body.newPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Old and new passwords are required"));
        }

        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        Long userId = principal.getUserId();

        if (body.oldPassword().equals(body.newPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be different"));
        }

        if ("ADMIN".equals(principal.getRole())) {
            Admin admin = adminRepository.findById(userId).orElse(null);
            if (admin == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Account not found"));
            }
            if (!body.oldPassword().equals(admin.getPassword())) {
                return ResponseEntity.status(400).body(Map.of("error", "Old password is incorrect"));
            }
            admin.setPassword(body.newPassword());
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("ok", true));
        }

        Student student = studentRepository.findById(userId).orElse(null);
        if (student == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Account not found"));
        }
        String tempPassword = student.getTempPassword();
        boolean matchesTemp = tempPassword != null && body.oldPassword().equals(tempPassword);
        if (!matchesTemp) {
            return ResponseEntity.status(400).body(Map.of("error", "Old password is incorrect"));
        }
        student.setPassword(body.newPassword());
        student.setTempPassword(null);
        student.setTempPasswordActive(false);
        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private boolean isEmailLoginAllowed(HttpSession session, String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return false;
        }
        Object stored = session.getAttribute(SESSION_EMAIL_LOGIN_KEY);
        if (!(stored instanceof String)) {
            return false;
        }
        return ((String) stored).equalsIgnoreCase(identifier.trim());
    }

    private void allowEmailLogin(HttpSession session, String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        session.setAttribute(SESSION_EMAIL_LOGIN_KEY, email.trim().toLowerCase());
    }

    private void clearEmailLoginAllowance(HttpSession session) {
        session.removeAttribute(SESSION_EMAIL_LOGIN_KEY);
    }

    private void storeAuthentication(Authentication authentication, HttpServletRequest request) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }
}