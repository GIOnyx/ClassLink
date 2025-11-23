package com.classlink.server.repository;

import com.classlink.server.model.Calendar;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Calendar, Long> {
}
