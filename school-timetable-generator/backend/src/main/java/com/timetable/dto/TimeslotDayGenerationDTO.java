package com.timetable.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TimeslotDayGenerationDTO {
    @NotNull
    private String dayOfWeek;

    @NotNull
    private String startTime;

    @NotNull
    private String endTime;

    private String breakStartTime;
    private String breakEndTime;

    private Long schoolId;
}