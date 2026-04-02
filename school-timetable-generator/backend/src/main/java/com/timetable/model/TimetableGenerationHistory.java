package com.timetable.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "timetable_generation_history", indexes = {
        @Index(name = "idx_timetable_history_school", columnList = "school_id"),
        @Index(name = "idx_timetable_history_generated_at", columnList = "generated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableGenerationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    @JsonIgnore
    private School school;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "total_lessons", nullable = false)
    private int totalLessons;

    @Column(name = "hard_score")
    private Integer hardScore;

    @Column(name = "soft_score")
    private Integer softScore;

    @Column(name = "score_label", length = 128)
    private String scoreLabel;

    @Lob
    @Column(name = "snapshot_json", columnDefinition = "TEXT")
    private String snapshotJson;
}
