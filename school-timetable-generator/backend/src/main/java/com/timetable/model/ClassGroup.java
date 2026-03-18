package com.timetable.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "class_groups")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClassGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String level;

    @Column(nullable = false)
    @Builder.Default
    private int studentCount = 0;

    @Column(name = "max_hours_per_week")
    @Builder.Default
    private Integer totalHoursPerWeek = 30;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonIgnore
    private School school;
}
