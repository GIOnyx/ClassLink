package com.classlink.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;

public interface StudentRepository extends JpaRepository<Student, Long> {
	Student findByEmailAndPassword(String email, String password);
	Student findByAccountIdAndPassword(String accountId, String password);
	Student findByEmail(String email);
	Student findTopByAccountIdStartingWithOrderByAccountIdDesc(String prefix);
	boolean existsByAccountId(String accountId);
	List<Student> findAllByStatus(StudentStatus status);
}