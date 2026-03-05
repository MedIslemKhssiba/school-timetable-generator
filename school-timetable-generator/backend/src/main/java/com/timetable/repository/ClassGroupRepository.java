package com.timetable.repository;

import com.timetable.model.ClassGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    List<ClassGroup> findBySchoolId(Long schoolId);
}
