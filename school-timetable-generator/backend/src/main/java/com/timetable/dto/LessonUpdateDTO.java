package com.timetable.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonUpdateDTO {

    @NotNull
    private Long teacherId;

    @NotNull
    private Long roomId;

    @NotNull
    private Long timeslotId;
}
