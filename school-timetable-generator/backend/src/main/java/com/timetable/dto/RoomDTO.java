package com.timetable.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RoomDTO {
    private Long id;
    @NotBlank
    private String name;
    @Min(1)
    private int capacity = 30;
    private String type;
    @NotNull
    private Long schoolId;
}
