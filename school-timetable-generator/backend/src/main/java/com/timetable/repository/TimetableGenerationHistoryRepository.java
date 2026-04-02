package com.timetable.repository;

import com.timetable.model.TimetableGenerationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimetableGenerationHistoryRepository extends JpaRepository<TimetableGenerationHistory, Long> {
    List<TimetableGenerationHistory> findBySchoolIdOrderByGeneratedAtDesc(Long schoolId);
}
