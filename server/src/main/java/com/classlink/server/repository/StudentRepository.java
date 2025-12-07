package com.classlink.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.classlink.server.model.Student;
import com.classlink.server.model.StudentStatus;

public interface StudentRepository extends JpaRepository<Student, Long> {
	Student findByEmailAndPassword(String email, String password);
	Student findByAccountIdAndPassword(String accountId, String password);
	Student findByEmail(String email);
	Student findByAccountId(String accountId);
	Student findTopByAccountIdStartingWithOrderByAccountIdDesc(String prefix);
	boolean existsByAccountId(String accountId);
	List<Student> findAllByStatus(StudentStatus status);

	@Query("""
		SELECT s FROM Student s
		WHERE s.status = :status
		AND s.tempPasswordActive = true
		AND (s.tempPassword IS NULL OR s.tempPassword = '' OR s.tempPassword = s.password)
	""")
	List<Student> findAllWithMissingTempPassword(@Param("status") StudentStatus status);
}