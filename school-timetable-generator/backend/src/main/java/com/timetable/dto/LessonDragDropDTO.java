package com.timetable.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LessonDragDropDTO {

    @NotNull
    private Long targetTimeslotId;

    private Long targetLessonId;
}
