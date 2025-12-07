package com.classlink.server.security;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.classlink.server.model.Admin;
import com.classlink.server.model.Student;
import com.classlink.server.repository.AdminRepository;
import com.classlink.server.repository.StudentRepository;

@Service
public class ClasslinkUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;

    public ClasslinkUserDetailsService(AdminRepository adminRepository, StudentRepository studentRepository) {
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.isBlank()) {
            throw new UsernameNotFoundException("Username is required");
        }
        String trimmed = username.trim();
        Admin admin = adminRepository.findByEmail(trimmed);
        if (admin != null) {
            if (!admin.isActive()) {
                throw new RemovedAdminException(admin.getRemovedBy());
            }
            return ClasslinkUserDetails.forAdmin(admin);
        }
        Student student = studentRepository.findByEmail(trimmed);
        if (student == null) {
            student = studentRepository.findByAccountId(trimmed);
        }
        if (student != null) {
            ClasslinkUserDetails details = ClasslinkUserDetails.forStudent(student, trimmed);
            if (!details.isEnabled()) {
                throw new DisabledException("Student account inactive");
            }
            return details;
        }
        throw new UsernameNotFoundException("User not found");
    }
}
