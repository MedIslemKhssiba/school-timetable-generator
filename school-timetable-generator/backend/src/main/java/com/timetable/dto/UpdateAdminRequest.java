package com.timetable.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateAdminRequest {
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    @NotBlank @Email
    private String email;
    private Long schoolId;
}
