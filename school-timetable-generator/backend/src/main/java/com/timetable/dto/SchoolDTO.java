package com.timetable.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SchoolDTO {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private boolean active;
}
