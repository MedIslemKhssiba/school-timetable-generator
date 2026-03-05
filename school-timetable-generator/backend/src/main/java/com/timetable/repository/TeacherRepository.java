package com.timetable.repository;

import com.timetable.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    List<Teacher> findBySchoolId(Long schoolId);
    long countBySchoolId(Long schoolId);
    Optional<Teacher> findByUserId(Long userId);
    Optional<Teacher> findByEmail(String email);
}
