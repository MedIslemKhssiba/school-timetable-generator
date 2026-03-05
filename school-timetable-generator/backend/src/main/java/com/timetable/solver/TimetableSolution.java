package com.timetable.solver;

import com.timetable.model.Room;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.Timeslot;
import lombok.*;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

import java.util.ArrayList;
import java.util.List;

@PlanningSolution
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TimetableSolution {

    private Long id;

    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = "timeslotRange")
    private List<Timeslot> timeslots = new ArrayList<>();

    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = "roomRange")
    private List<Room> rooms = new ArrayList<>();

    @ProblemFactCollectionProperty
    private List<TeacherAvailability> teacherAvailabilities = new ArrayList<>();

    @PlanningEntityCollectionProperty
    private List<LessonAssignment> lessonAssignments = new ArrayList<>();

    @PlanningScore
    private HardSoftScore score;
}
