package com.timetable.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TeacherDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Long schoolId;
    private List<Long> subjectIds;
    private int maxHoursPerWeek;
    private List<SubjectInfo> subjects;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SubjectInfo {
        private Long id;
        private String name;
        private String color;
    }
}
