package com.timetable.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LessonDTO {
    private Long id;
    private Long subjectId;
    private String subjectName;
    private Long teacherId;
    private String teacherName;
    private Long classGroupId;
    private String classGroupName;
    private Long roomId;
    private String roomName;
    private Long timeslotId;
    private String dayOfWeek;
    private String startTime;
    private String endTime;
    private Integer sessionDurationMinutes;
    private Integer timeslotDurationMinutes;
}
