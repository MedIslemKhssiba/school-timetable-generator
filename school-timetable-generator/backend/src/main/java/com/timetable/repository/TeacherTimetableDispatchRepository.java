package com.timetable.repository;

import com.timetable.model.TeacherTimetableDispatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherTimetableDispatchRepository extends JpaRepository<TeacherTimetableDispatch, Long> {
    List<TeacherTimetableDispatch> findByHistoryIdOrderByTeacherLastNameAscTeacherFirstNameAsc(Long historyId);
}
