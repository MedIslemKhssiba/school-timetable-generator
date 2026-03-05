package com.timetable.repository;

import com.timetable.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findBySchoolId(Long schoolId);
}
