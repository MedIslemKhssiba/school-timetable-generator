package com.timetable.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ClassGroupDTO {
    private Long id;
    @NotBlank
    private String name;
    private String level;
    private int studentCount;
    private Integer totalHoursPerWeek;
    @NotNull
    private Long schoolId;
}
