package com.timetable.repository;

import com.timetable.model.Teacher;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    List<Teacher> findBySchoolId(Long schoolId);
    
    @Query("SELECT DISTINCT t FROM Teacher t LEFT JOIN FETCH t.subjects WHERE t.school.id = :schoolId")
    List<Teacher> findWithSubjectsBySchoolId(@Param("schoolId") Long schoolId);
    
    long countBySchoolId(Long schoolId);
    Optional<Teacher> findByUserId(Long userId);
    Optional<Teacher> findByEmail(String email);
}
