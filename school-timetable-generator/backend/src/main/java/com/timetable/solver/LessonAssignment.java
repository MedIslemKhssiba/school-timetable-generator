package com.timetable.solver;

import com.timetable.model.*;
import lombok.*;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

import java.time.Duration;

@PlanningEntity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LessonAssignment {

    private Long id;

    private Subject subject;
    private Teacher teacher;
    private ClassGroup classGroup;
    private Long schoolId;

    @PlanningVariable(valueRangeProviderRefs = "timeslotRange")
    private Timeslot timeslot;

    @PlanningVariable(valueRangeProviderRefs = "roomRange")
    private Room room;

    @PlanningId
    public Long getId() {
        return id;
    }

    public Long getTeacherId() {
        return teacher != null ? teacher.getId() : null;
    }

    public Long getClassGroupId() {
        return classGroup != null ? classGroup.getId() : null;
    }

    public int getTeacherMaxHours() {
        return teacher != null ? teacher.getMaxHoursPerWeek() : 20;
    }

    public int getClassGroupStudentCount() {
        return classGroup != null ? classGroup.getStudentCount() : 0;
    }

    public int getRoomCapacity() {
        return room != null ? room.getCapacity() : Integer.MAX_VALUE;
    }

    public Long getSubjectId() {
        return subject != null ? subject.getId() : null;
    }

    public Long getTimeslotId() {
        return timeslot != null ? timeslot.getId() : null;
    }

    public Long getRoomId() {
        return room != null ? room.getId() : null;
    }

    public String getRequiredRoomType() {
        return subject != null ? subject.getRequiredRoomType() : null;
    }

    public int getSubjectHoursPerWeek() {
        return subject != null ? Math.max(0, subject.getHoursPerWeek()) : 0;
    }

    public int getSubjectSessionDuration() {
        return subject != null ? Math.max(0, subject.getSessionDuration()) : 0;
    }

    public int getRequiredWeeklyMinutes() {
        return subject != null ? Math.max(0, subject.getHoursPerWeek()) * 60 : 0;
    }

    public int getTimeslotDurationMinutes() {
        if (timeslot == null || timeslot.getStartTime() == null || timeslot.getEndTime() == null) {
            return 0;
        }
        return (int) Duration.between(timeslot.getStartTime(), timeslot.getEndTime()).toMinutes();
    }
}
