package com.timetable.repository;

import com.timetable.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    @Query("SELECT l FROM Lesson l JOIN FETCH l.subject JOIN FETCH l.teacher JOIN FETCH l.classGroup JOIN FETCH l.room JOIN FETCH l.timeslot WHERE l.school.id = :schoolId")
    List<Lesson> findBySchoolIdWithDetails(@Param("schoolId") Long schoolId);

    List<Lesson> findBySchoolId(Long schoolId);
    long countBySchoolId(Long schoolId);
    void deleteBySchoolId(Long schoolId);

    @Query("SELECT l FROM Lesson l JOIN FETCH l.subject JOIN FETCH l.teacher JOIN FETCH l.classGroup JOIN FETCH l.room JOIN FETCH l.timeslot WHERE l.teacher.id = :teacherId")
    List<Lesson> findByTeacherIdWithDetails(@Param("teacherId") Long teacherId);

    List<Lesson> findByTeacherId(Long teacherId);
    List<Lesson> findByClassGroupId(Long classGroupId);
}
