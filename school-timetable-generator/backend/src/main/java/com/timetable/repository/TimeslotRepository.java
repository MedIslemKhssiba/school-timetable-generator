package com.timetable.repository;

import com.timetable.model.DayOfWeek;
import com.timetable.model.Timeslot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeslotRepository extends JpaRepository<Timeslot, Long> {
    List<Timeslot> findAllByOrderByDayOfWeekAscOrderInDayAsc();
    boolean existsByDayOfWeek(DayOfWeek dayOfWeek);
    List<Timeslot> findByDayOfWeekOrderByStartTimeAsc(DayOfWeek dayOfWeek);
    boolean existsByDayOfWeekAndStartTimeAndEndTime(DayOfWeek dayOfWeek, java.time.LocalTime startTime, java.time.LocalTime endTime);
    Timeslot findTopByDayOfWeekOrderByOrderInDayDesc(DayOfWeek dayOfWeek);
}
