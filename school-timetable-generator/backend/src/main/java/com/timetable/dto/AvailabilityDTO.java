package com.timetable.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AvailabilityDTO {
    private Long id;
    private Long teacherId;
    private Long timeslotId;
    private boolean available;
}
