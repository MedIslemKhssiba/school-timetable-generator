package com.timetable.repository;

import com.timetable.model.DayOfWeek;
import com.timetable.model.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeslotRepository extends JpaRepository<Timeslot, Long> {
    List<Timeslot> findAllByOrderByDayOfWeekAscOrderInDayAsc();
    boolean existsByDayOfWeek(DayOfWeek dayOfWeek);
}
