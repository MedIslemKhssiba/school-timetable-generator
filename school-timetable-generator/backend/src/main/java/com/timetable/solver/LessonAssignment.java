package com.timetable.solver;

import com.timetable.model.*;
import lombok.*;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

@PlanningEntity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LessonAssignment {

    @PlanningId
    private Long id;

    private Subject subject;
    private Teacher teacher;
    private ClassGroup classGroup;
    private Long schoolId;

    @PlanningVariable(valueRangeProviderRefs = "timeslotRange")
    private Timeslot timeslot;

    @PlanningVariable(valueRangeProviderRefs = "roomRange")
    private Room room;

    public Long getTeacherId() {
        return teacher != null ? teacher.getId() : null;
    }

    public Long getClassGroupId() {
        return classGroup != null ? classGroup.getId() : null;
    }
}
