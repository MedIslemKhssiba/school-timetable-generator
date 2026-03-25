package com.timetable.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schools")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    private String phone;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;

    @Column(name = "timetable_saved_at")
    private LocalDateTime timetableSavedAt;

    @Builder.Default
    @Column(name = "timetable_sent")
    private Boolean timetableSent = false;

    @Column(name = "timetable_sent_at")
    private LocalDateTime timetableSentAt;

    @JsonIgnore
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> users = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Teacher> teachers = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ClassGroup> classGroups = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Subject> subjects = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "school", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
