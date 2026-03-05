package com.timetable.solver;

import com.timetable.model.*;
import lombok.*;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

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
}
