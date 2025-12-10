package com.classlink.server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.classlink.server.model.Calendar;

public interface CalendarEventRepository extends JpaRepository<Calendar, Long> {
    List<Calendar> findAllByOrderByStartDateAsc();
}