package com.timetable.solver;

import com.timetable.model.TeacherAvailability;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;
import org.optaplanner.core.api.score.stream.ConstraintCollectors;

import java.util.Locale;

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
                roomTypeCompatibility(constraintFactory),
                roomCapacity(constraintFactory),
                // Soft constraints
                teacherRoomStability(constraintFactory),
                teacherTimeEfficiency(constraintFactory),
                subjectVarietyPerDay(constraintFactory),
                subjectSpreadAcrossDays(constraintFactory),
                classGroupDayBalance(constraintFactory)
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

    // Teacher max hours per week (uses actual teacher value)
    Constraint teacherMaxHours(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        ConstraintCollectors.toList())
                .filter((teacherId, assignments) -> {
                    int maxHours = assignments.get(0).getTeacherMaxHours();
                    return assignments.size() > maxHours;
                })
                .penalize(HardSoftScore.ONE_HARD, (teacherId, assignments) ->
                        assignments.size() - assignments.get(0).getTeacherMaxHours())
                .asConstraint("Teacher max hours");
    }

    // Room must have enough capacity for the class
    Constraint roomCapacity(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && la.getClassGroup() != null
                        && la.getClassGroupStudentCount() > la.getRoomCapacity())
                .penalize(HardSoftScore.ONE_HARD,
                        la -> la.getClassGroupStudentCount() - la.getRoomCapacity())
                .asConstraint("Room capacity");
    }

    // Assigned room type must satisfy subject required room type when specified
    Constraint roomTypeCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && hasText(la.getRequiredRoomType()))
                .filter(la -> !normalize(la.getRequiredRoomType()).equals(normalize(la.getRoom().getType())))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Room type compatibility");
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

    // Prefer consecutive lessons for the same teacher on the same day (minimize gaps)
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

    // Penalize having the same subject multiple times on the same day for the same class
    Constraint subjectVarietyPerDay(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getDayOfWeek() == l2.getTimeslot().getDayOfWeek())
                .penalize(HardSoftScore.ONE_SOFT, (l1, l2) -> 3)
                .asConstraint("Subject variety per day");
    }

    // Spread same subject across different days for the same class
    Constraint subjectSpreadAcrossDays(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getDayOfWeek() == l2.getTimeslot().getDayOfWeek()
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()) == 1)
                .penalize(HardSoftScore.ONE_SOFT, (l1, l2) -> 5)
                .asConstraint("Subject spread across days");
    }

    // Balance class group lessons evenly across days
    Constraint classGroupDayBalance(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((classId, day, count) -> count > 5)
                .penalize(HardSoftScore.ONE_SOFT, (classId, day, count) -> (count - 5) * 2)
                .asConstraint("Class group day balance");
    }

        private boolean hasText(String value) {
                return value != null && !value.isBlank();
        }

        private String normalize(String value) {
                return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        }
}
