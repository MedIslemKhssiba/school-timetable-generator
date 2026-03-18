package com.timetable.repository;

import com.timetable.model.Subject;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findBySchoolId(Long schoolId);
    long countBySchoolId(Long schoolId);

    @Modifying
    @Query(value = "DELETE FROM teacher_subjects WHERE subject_id = :subjectId", nativeQuery = true)
    void detachFromTeachers(@Param("subjectId") Long subjectId);
}
