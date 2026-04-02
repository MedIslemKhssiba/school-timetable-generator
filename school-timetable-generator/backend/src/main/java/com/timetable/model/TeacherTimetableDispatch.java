package com.timetable.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "teacher_timetable_dispatch", indexes = {
        @Index(name = "idx_teacher_dispatch_history", columnList = "history_id"),
        @Index(name = "idx_teacher_dispatch_teacher", columnList = "teacher_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherTimetableDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id", nullable = false)
    @JsonIgnore
    private TimetableGenerationHistory history;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnore
    private Teacher teacher;

    @Column(name = "dispatched_at", nullable = false)
    private Instant dispatchedAt;

    @Column(name = "lesson_count", nullable = false)
    private int lessonCount;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Lob
    @Column(name = "snapshot_json", columnDefinition = "TEXT")
    private String snapshotJson;
}
