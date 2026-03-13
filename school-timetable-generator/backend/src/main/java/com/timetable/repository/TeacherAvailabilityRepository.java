package com.timetable.repository;

import com.timetable.model.TeacherAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherAvailabilityRepository extends JpaRepository<TeacherAvailability, Long> {
    List<TeacherAvailability> findByTeacherId(Long teacherId);
    List<TeacherAvailability> findByTimeslotIdIn(List<Long> timeslotIds);
    boolean existsByTeacherIdAndTimeslotId(Long teacherId, Long timeslotId);
    void deleteByTeacherId(Long teacherId);
    void deleteByTimeslotId(Long timeslotId);
    void deleteByTimeslotIdIn(List<Long> timeslotIds);
}
