package com.timetable.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SubjectDTO {
    private Long id;
    @NotBlank
    private String name;
    private String level;
    private String color;
    private int hoursPerWeek = 1;
    private int sessionDuration = 1;
    @NotNull
    private Long schoolId;
}
