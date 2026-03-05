package com.timetable.repository;

import com.timetable.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findBySchoolId(Long schoolId);
    List<Lesson> findByTeacherId(Long teacherId);
    List<Lesson> findByClassGroupId(Long classGroupId);
}
