package com.timetable.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TimeslotDTO {
    @NotNull
    private String dayOfWeek;
    @NotNull
    private String startTime;
    @NotNull
    private String endTime;
    private Integer orderInDay;
}
