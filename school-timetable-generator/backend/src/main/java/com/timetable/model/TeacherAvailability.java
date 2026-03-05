package com.timetable.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teacher_availabilities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "timeslot_id", nullable = false)
    private Timeslot timeslot;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = true;
}
