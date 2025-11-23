package com.classlink.server.repository;

import com.classlink.server.model.Calendar;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<Calendar, Long> {
    // Updated method name to reflect the 'startDate' field
    List<Calendar> findAllByOrderByStartDateAsc();
}