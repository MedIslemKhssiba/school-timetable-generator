package com.timetable.solver;

import com.timetable.model.TeacherAvailability;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;

public class TimetableConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[]{
                // Hard constraints
                roomConflict(constraintFactory),
                teacherConflict(constraintFactory),
                classGroupConflict(constraintFactory),
                teacherAvailability(constraintFactory),
                teacherMaxHours(constraintFactory),
                // Soft constraints
                teacherRoomStability(constraintFactory),
                teacherTimeEfficiency(constraintFactory)
        };
    }

    // A room can only have one lesson at a time
    Constraint roomConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getRoom))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Room conflict");
    }

    // A teacher can only teach one lesson at a time
    Constraint teacherConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getTeacherId))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher conflict");
    }

    // A class group can only attend one lesson at a time
    Constraint classGroupConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getClassGroupId))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Class group conflict");
    }

    // Prefer assigning a teacher to the same room throughout the day
    Constraint teacherRoomStability(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTeacherId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getDayOfWeek() == l2.getTimeslot().getDayOfWeek()
                        && l1.getRoom() != null && l2.getRoom() != null
                        && !l1.getRoom().getId().equals(l2.getRoom().getId()))
                .penalize(HardSoftScore.ONE_SOFT)
                .asConstraint("Teacher room stability");
    }

    // Prefer consecutive lessons for the same teacher on the same day
    Constraint teacherTimeEfficiency(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTeacherId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getDayOfWeek() == l2.getTimeslot().getDayOfWeek()
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()) > 2)
                .penalize(HardSoftScore.ONE_SOFT)
                .asConstraint("Teacher time efficiency");
    }

    // Teacher must be available at the assigned timeslot
    Constraint teacherAvailability(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .join(TeacherAvailability.class,
                        Joiners.equal(la -> la.getTeacher().getId(), ta -> ta.getTeacher().getId()),
                        Joiners.equal(la -> la.getTimeslot().getId(), ta -> ta.getTimeslot().getId()))
                .filter((la, ta) -> !ta.isAvailable())
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher availability");
    }

    // Teacher max hours per week
    Constraint teacherMaxHours(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .groupBy(LessonAssignment::getTeacherId, org.optaplanner.core.api.score.stream.ConstraintCollectors.count())
                .filter((teacherId, count) -> count > 20) // default max, ideally from teacher entity
                .penalize(HardSoftScore.ONE_HARD, (teacherId, count) -> count - 20)
                .asConstraint("Teacher max hours");
    }
}
