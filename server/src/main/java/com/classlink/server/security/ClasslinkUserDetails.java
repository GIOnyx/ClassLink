package com.classlink.server.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.classlink.server.model.Admin;
import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;

public class ClasslinkUserDetails implements UserDetails {

    private final Long userId;
    private final String username;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final String userType;
    private final StudentStatus studentStatus;
    private final String email;
    private final String accountId;
    private final boolean enabled;

    private ClasslinkUserDetails(Long userId, String username, String password,
                                 Collection<? extends GrantedAuthority> authorities,
                                 String userType, StudentStatus studentStatus,
                                 String email, String accountId, boolean enabled) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.authorities = authorities;
        this.userType = userType;
        this.studentStatus = studentStatus;
        this.email = email;
        this.accountId = accountId;
        this.enabled = enabled;
    }

    public static ClasslinkUserDetails forAdmin(Admin admin) {
        boolean active = admin.isActive();
        return new ClasslinkUserDetails(
            admin.getAdminId(),
            admin.getEmail(),
            admin.getPassword(),
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN")),
            "admin",
            null,
            admin.getEmail(),
            null,
            active
        );
    }

    public static ClasslinkUserDetails forStudent(Student student, String usernameUsed) {
        boolean active = student.getStatus() != StudentStatus.INACTIVE;
        String resolvedUsername = usernameUsed != null ? usernameUsed.trim() : "";
        String credential = student.getPassword();

        return new ClasslinkUserDetails(
            student.getId(),
            resolvedUsername,
            credential,
            List.of(new SimpleGrantedAuthority("ROLE_STUDENT")),
            "student",
            student.getStatus(),
            student.getEmail(),
            student.getAccountId(),
            active
        );
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserType() {
        return userType;
    }

    public StudentStatus getStudentStatus() {
        return studentStatus;
    }

    public String getEmail() {
        return email;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getRole() {
        return authorities.stream()
            .findFirst()
            .map(GrantedAuthority::getAuthority)
            .map(value -> value.replace("ROLE_", ""))
            .orElse("STUDENT");
    }

    public boolean isStudent() {
        return "student".equalsIgnoreCase(userType);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return enabled;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
