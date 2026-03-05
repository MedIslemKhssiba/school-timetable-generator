package com.timetable.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "timeslots", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"day_of_week", "start_time", "end_time"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Timeslot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "order_in_day")
    private Integer orderInDay;
}
