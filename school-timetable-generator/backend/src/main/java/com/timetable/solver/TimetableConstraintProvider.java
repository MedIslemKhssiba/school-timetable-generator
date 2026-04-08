package com.timetable.solver;

import com.timetable.model.TeacherAvailability;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;
import org.optaplanner.core.api.score.stream.ConstraintCollectors;

import java.text.Normalizer;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class TimetableConstraintProvider implements ConstraintProvider {

        private static final int HARD_CRITICAL = 1_000;
        private static final int HARD_HIGH = 800;

        private static final int SOFT_VERY_STRONG = 4;
        private static final int SOFT_STRONG = 2;
        private static final int SOFT_MEDIUM = 1;
        private static final int SOFT_LOW = 1;

        // Premium quality-oriented soft scoring profile
        private static final int SOFT_PRIORITY = 4;
        private static final int SOFT_GAP = 3;
        private static final int SOFT_BALANCE = 2;
        private static final int SOFT_CONSECUTIVE = 3;
        private static final int SOFT_CONTINUITY = 1;
        private static final int SOFT_COMFORT = 2;
        private static final int SOFT_SUPPORT = 1;

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[]{
                // Hard constraints
                unassignedLesson(constraintFactory),
                roomConflict(constraintFactory),
                teacherConflict(constraintFactory),
                classGroupConflict(constraintFactory),
                duplicateAssignment(constraintFactory),
                teacherQualification(constraintFactory),
                teacherAvailability(constraintFactory),
                timeslotDurationCompatibility(constraintFactory),
                roomTypeCompatibility(constraintFactory),
                roomCapacity(constraintFactory),
                // Soft constraints
                teacherAvailabilityMissing(constraintFactory),
                teacherMaxHours(constraintFactory),
                exactWeeklyHoursPerClassAndSubject(constraintFactory),
                classGapMinimization(constraintFactory),
                teacherGapMinimization(constraintFactory),
                teacherDailyOverload(constraintFactory),
                classDailyOverload(constraintFactory),
                classConsecutiveOverload(constraintFactory),
                teacherConsecutiveOverload(constraintFactory),
                heavySubjectDistribution(constraintFactory),
                avoidHeavyConsecutiveLessons(constraintFactory),
                avoidTeacherHeavyConsecutiveLessons(constraintFactory),
                prioritySubjectsMorningSoft(constraintFactory),
                prioritySubjectsEarlyReward(constraintFactory),
                sportArtAfternoonPreference(constraintFactory),
                subjectCoherentTimeWindows(constraintFactory),
                practicalSubjectGrouping(constraintFactory),
                teacherRoomStability(constraintFactory),
                timeslotDurationWasteMinimization(constraintFactory),
                subjectVarietyPerDay(constraintFactory),
                classGroupDayBalance(constraintFactory),
                                classWeeklyDistributionBalance(constraintFactory),
                                teacherWeeklyDistributionBalance(constraintFactory),
                roomDailyUsageBalance(constraintFactory)
        };
    }

        // Every lesson must be fully assigned
        Constraint unassignedLesson(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() == null || la.getRoom() == null)
                                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                                .asConstraint("Unassigned lesson");
        }

    // A room can only have one lesson at a time
    Constraint roomConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getRoom))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Room conflict");
    }

    // A teacher can only teach one lesson at a time
    Constraint teacherConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getTeacherId))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Teacher conflict");
    }

    // A class group can only attend one lesson at a time
    Constraint classGroupConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getClassGroupId))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Class group conflict");
    }

    // Prevent exact duplicate allocations of the same lesson signature in the same slot
    Constraint duplicateAssignment(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getTeacherId),
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Duplicate assignment");
    }

    // Teacher assigned to a subject they cannot teach is invalid
    Constraint teacherQualification(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTeacher() != null && la.getSubject() != null)
                .filter(la -> la.getTeacher().getSubjects() == null
                        || la.getTeacher().getSubjects().stream().noneMatch(s -> s.getId().equals(la.getSubjectId())))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Teacher qualification");
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
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Teacher availability");
    }

    // Missing availability record is a data-quality issue (strong soft penalty, not infeasibility)
    Constraint teacherAvailabilityMissing(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .ifNotExists(TeacherAvailability.class,
                        Joiners.equal(la -> la.getTeacher().getId(), ta -> ta.getTeacher().getId()),
                        Joiners.equal(la -> la.getTimeslot().getId(), ta -> ta.getTimeslot().getId()))
                .penalize(HardSoftScore.ofSoft(SOFT_SUPPORT))
                .asConstraint("Teacher availability missing");
    }

    // Teacher max hours per week is a strong soft policy to preserve feasibility in difficult datasets
    Constraint teacherMaxHours(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        ConstraintCollectors.sum(LessonAssignment::getSubjectSessionDuration),
                        ConstraintCollectors.max(LessonAssignment::getTeacherMaxHours))
                .filter((teacherId, assignedMinutes, maxHours) -> assignedMinutes > (maxHours != null ? maxHours : 0) * 60)
                .penalize(HardSoftScore.ofSoft(SOFT_COMFORT),
                        (teacherId, assignedMinutes, maxHours) -> {
                            int limitMinutes = (maxHours != null ? maxHours : 0) * 60;
                            int overflowMinutes = assignedMinutes - limitMinutes;
                            return (overflowMinutes + 29) / 30;
                        })
                .asConstraint("Teacher max hours");
    }

    // Weekly coverage is prioritized as strong soft to avoid large hard-score instability
    Constraint exactWeeklyHoursPerClassAndSubject(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .groupBy(LessonAssignment::getClassGroupId,
                        LessonAssignment::getSubjectId,
                        ConstraintCollectors.sum(la -> la.getTimeslot() != null && la.getRoom() != null ? la.getSubjectSessionDuration() : 0),
                        ConstraintCollectors.max(LessonAssignment::getRequiredWeeklyMinutes))
                .filter((classId, subjectId, assignedMinutes, expectedMinutes) -> assignedMinutes != (expectedMinutes != null ? expectedMinutes : 0))
                .penalize(HardSoftScore.ofSoft(SOFT_BALANCE),
                        (classId, subjectId, assignedMinutes, expectedMinutes) -> {
                            int delta = Math.abs(assignedMinutes - (expectedMinutes != null ? expectedMinutes : 0));
                            return (delta + 29) / 30;
                        })
                .asConstraint("Exact weekly hours per class/subject");
    }

    Constraint timeslotDurationCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .filter(la -> la.getTimeslotDurationMinutes() < la.getSubjectSessionDuration())
                .penalize(HardSoftScore.ofHard(HARD_HIGH),
                        la -> la.getSubjectSessionDuration() - la.getTimeslotDurationMinutes())
                .asConstraint("Timeslot duration compatibility");
    }

    // Room must have enough capacity for the class
    Constraint roomCapacity(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && la.getClassGroup() != null
                        && la.getClassGroupStudentCount() > la.getRoomCapacity())
                .penalize(HardSoftScore.ofHard(HARD_HIGH),
                        la -> la.getClassGroupStudentCount() - la.getRoomCapacity())
                .asConstraint("Room capacity");
    }

    // Assigned room type must satisfy subject required room type when specified
    Constraint roomTypeCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && hasText(la.getRequiredRoomType()))
                .filter(la -> !normalize(la.getRequiredRoomType()).equals(normalize(la.getRoom().getType())))
                .penalize(HardSoftScore.ofHard(HARD_CRITICAL))
                .asConstraint("Room type compatibility");
    }

        // Optional hard policy: high-priority subjects should be in morning slots
        Constraint prioritySubjectsMorningHard(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                                .filter(this::isPriorityMorningSubject)
                                .filter(la -> la.getTimeslot().getOrderInDay() > 3)
                                .penalize(HardSoftScore.ofSoft(SOFT_LOW), la -> la.getTimeslot().getOrderInDay() - 3)
                                .asConstraint("Priority subjects morning (hard)");
        }

    // Minimize class timetable holes during each day
    Constraint classGapMinimization(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getClassGroupId() != null && la.getTimeslot().getOrderInDay() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.toList())
                .filter((classId, day, assignments) -> {
                    int minOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).min().orElse(0);
                    int maxOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).max().orElse(0);
                    return (maxOrder - minOrder + 1) > assignments.size();
                })
                                                                .penalize(HardSoftScore.ofSoft(SOFT_GAP),
                        (classId, day, assignments) -> {
                            int minOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).min().orElse(0);
                            int maxOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).max().orElse(0);
                            return Math.max(0, (maxOrder - minOrder + 1) - assignments.size());
                        })
                .asConstraint("Class gaps in day");
    }

    // Minimize teacher timetable holes during each day
    Constraint teacherGapMinimization(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacherId() != null && la.getTimeslot().getOrderInDay() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.toList())
                .filter((teacherId, day, assignments) -> {
                    int minOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).min().orElse(0);
                    int maxOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).max().orElse(0);
                    return (maxOrder - minOrder + 1) > assignments.size();
                })
                                                                .penalize(HardSoftScore.ofSoft(SOFT_GAP),
                        (teacherId, day, assignments) -> {
                            int minOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).min().orElse(0);
                            int maxOrder = assignments.stream().mapToInt(a -> a.getTimeslot().getOrderInDay()).max().orElse(0);
                            return Math.max(0, (maxOrder - minOrder + 1) - assignments.size());
                        })
                .asConstraint("Teacher gaps in day");
    }

    // Avoid concentrating too many classes for one teacher in a single day
    Constraint teacherDailyOverload(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacherId() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((teacherId, day, count) -> count > 5)
                .penalize(HardSoftScore.ofSoft(SOFT_COMFORT), (teacherId, day, count) -> count - 5)
                .asConstraint("Teacher daily overload");
    }

    // Avoid days overloaded for classes
    Constraint classDailyOverload(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getClassGroupId() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((classId, day, count) -> count > 5)
                .penalize(HardSoftScore.ofSoft(SOFT_BALANCE), (classId, day, count) -> count - 5)
                .asConstraint("Class daily overload");
    }

    // Limit long consecutive streaks for classes
    Constraint classConsecutiveOverload(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null && la.getClassGroupId() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.toList())
                .filter((classId, day, assignments) -> longestConsecutiveStreak(assignments) > 3)
                .penalize(HardSoftScore.ofSoft(SOFT_CONSECUTIVE), (classId, day, assignments) -> longestConsecutiveStreak(assignments) - 3)
                .asConstraint("Class consecutive overload");
    }

    // Limit long consecutive streaks for teachers
    Constraint teacherConsecutiveOverload(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null && la.getTeacherId() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.toList())
                .filter((teacherId, day, assignments) -> longestConsecutiveStreak(assignments) > 3)
                .penalize(HardSoftScore.ofSoft(SOFT_CONSECUTIVE), (teacherId, day, assignments) -> longestConsecutiveStreak(assignments) - 3)
                .asConstraint("Teacher consecutive overload");
    }

    // Spread heavy subjects across days to keep class rhythm balanced
    Constraint heavySubjectDistribution(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getClassGroupId() != null && isHeavySubject(la))
                .groupBy(LessonAssignment::getClassGroupId,
                        LessonAssignment::getSubjectId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((classId, subjectId, day, count) -> count > 1)
                .penalize(HardSoftScore.ofSoft(SOFT_BALANCE), (classId, subjectId, day, count) -> count - 1)
                .asConstraint("Heavy subject distribution");
    }

    // Avoid back-to-back heavy subjects for the same class
    Constraint avoidHeavyConsecutiveLessons(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(la -> la.getTimeslot() != null ? la.getTimeslot().getDayOfWeek() : null))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()) == 1
                        && isHeavySubject(l1) && isHeavySubject(l2))
                .penalize(HardSoftScore.ofSoft(SOFT_CONSECUTIVE))
                .asConstraint("Heavy consecutive lessons");
    }

    // Avoid back-to-back heavy subjects for the same teacher
    Constraint avoidTeacherHeavyConsecutiveLessons(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTeacherId),
                        Joiners.equal(la -> la.getTimeslot() != null ? la.getTimeslot().getDayOfWeek() : null))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()) == 1
                        && isHeavySubject(l1) && isHeavySubject(l2))
                .penalize(HardSoftScore.ofSoft(SOFT_CONSECUTIVE))
                .asConstraint("Teacher heavy consecutive lessons");
    }

    // Prefer high-priority subjects in morning slots
    Constraint prioritySubjectsMorningSoft(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                .filter(this::isPriorityMorningSubject)
                                .filter(la -> la.getTimeslot().getOrderInDay() > 2)
                                .penalize(HardSoftScore.ofSoft(SOFT_PRIORITY), la -> la.getTimeslot().getOrderInDay() - 2)
                .asConstraint("Priority subjects morning (soft)");
    }

        // Strongly reward placing priority subjects in early slots (pedagogical freshness)
        Constraint prioritySubjectsEarlyReward(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                                .filter(this::isPriorityMorningSubject)
                                .filter(la -> la.getTimeslot().getOrderInDay() <= 2)
                                .reward(HardSoftScore.ofSoft(SOFT_PRIORITY), la -> 3 - la.getTimeslot().getOrderInDay())
                                .asConstraint("Priority subjects early reward");
        }

    // Prefer sports and arts in later slots (typically afternoon)
    Constraint sportArtAfternoonPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                .filter(this::isSportOrArtSubject)
                .filter(la -> la.getTimeslot().getOrderInDay() <= 3)
                .penalize(HardSoftScore.ofSoft(SOFT_SUPPORT), la -> 4 - la.getTimeslot().getOrderInDay())
                .asConstraint("Sport/Art afternoon preference");
    }

    // Keep the same subject in coherent daily time windows across the week
    Constraint subjectCoherentTimeWindows(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        LessonAssignment::getSubjectId,
                        ConstraintCollectors.toList())
                .filter((classId, subjectId, assignments) -> timeWindowSpread(assignments) > 2)
                .penalize(HardSoftScore.ofSoft(SOFT_CONTINUITY),
                        (classId, subjectId, assignments) -> timeWindowSpread(assignments) - 2)
                .asConstraint("Subject coherent time windows");
    }

    // Reward pedagogical grouping of practical subjects in consecutive slots
    Constraint practicalSubjectGrouping(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId),
                        Joiners.equal(la -> la.getTimeslot() != null ? la.getTimeslot().getDayOfWeek() : null))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()) == 1
                        && isPracticalSubject(l1))
                .reward(HardSoftScore.ofSoft(SOFT_CONTINUITY))
                .asConstraint("Practical subject grouping");
    }

    // Prefer assigning a teacher to the same room throughout the day
    Constraint teacherRoomStability(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacherId() != null && la.getRoomId() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.countDistinct(LessonAssignment::getRoomId))
                .filter((teacherId, day, roomCount) -> roomCount > 2)
                .penalize(HardSoftScore.ofSoft(SOFT_SUPPORT),
                        (teacherId, day, roomCount) -> roomCount - 2)
                .asConstraint("Teacher room stability");
    }

    Constraint timeslotDurationWasteMinimization(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .filter(la -> la.getTimeslotDurationMinutes() > la.getSubjectSessionDuration())
                .penalize(HardSoftScore.ofSoft(SOFT_SUPPORT),
                        la -> {
                            int wasteMinutes = la.getTimeslotDurationMinutes() - la.getSubjectSessionDuration();
                            return (wasteMinutes + 14) / 15;
                        })
                .asConstraint("Timeslot duration waste minimization");
    }

    // Penalize having the same subject multiple times on the same day for the same class
    Constraint subjectVarietyPerDay(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        LessonAssignment::getSubjectId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((classId, subjectId, day, count) -> count > 2)
                .penalize(HardSoftScore.ofSoft(SOFT_CONTINUITY),
                        (classId, subjectId, day, count) -> count - 2)
                .asConstraint("Subject variety per day");
    }

    // Balance class group lessons evenly across days
    Constraint classGroupDayBalance(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .groupBy(LessonAssignment::getClassGroupId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                                .filter((classId, day, count) -> count > 6)
                                .penalize(HardSoftScore.ofSoft(SOFT_BALANCE), (classId, day, count) -> count - 6)
                .asConstraint("Class group day balance");
    }

        // Penalize weekly front-loading or over-concentration for classes
        Constraint classWeeklyDistributionBalance(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() != null && la.getClassGroupId() != null)
                                .groupBy(LessonAssignment::getClassGroupId, ConstraintCollectors.toList())
                                .filter((classId, assignments) -> dailySpread(assignments) > 2)
                                .penalize(HardSoftScore.ofSoft(SOFT_BALANCE), (classId, assignments) -> dailySpread(assignments) - 2)
                                .asConstraint("Class weekly distribution balance");
        }

        // Improve teacher comfort by smoothing daily teaching load over the week
        Constraint teacherWeeklyDistributionBalance(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() != null && la.getTeacherId() != null)
                                .groupBy(LessonAssignment::getTeacherId, ConstraintCollectors.toList())
                                .filter((teacherId, assignments) -> dailySpread(assignments) > 2)
                                .penalize(HardSoftScore.ofSoft(SOFT_COMFORT), (teacherId, assignments) -> dailySpread(assignments) - 2)
                                .asConstraint("Teacher weekly distribution balance");
        }

    // Avoid overusing the same room in one day
    Constraint roomDailyUsageBalance(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getRoomId() != null)
                .groupBy(LessonAssignment::getRoomId,
                        la -> la.getTimeslot().getDayOfWeek(),
                        ConstraintCollectors.count())
                .filter((roomId, day, count) -> count > 6)
                .penalize(HardSoftScore.ofSoft(SOFT_SUPPORT), (roomId, day, count) -> count - 6)
                .asConstraint("Room daily usage balance");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isHeavySubject(LessonAssignment lessonAssignment) {
        String name = normalize(lessonAssignment.getSubject() != null ? lessonAssignment.getSubject().getName() : null);
                return name.contains("MATHEMAT") || name.contains("PHYSIQUE") || name.contains("CHIMIE")
                                || name.contains("SCIENC") || name.contains("INFORMAT");
    }

    private boolean isSportOrArtSubject(LessonAssignment lessonAssignment) {
        String name = normalize(lessonAssignment.getSubject() != null ? lessonAssignment.getSubject().getName() : null);
        return name.contains("SPORT") || name.contains("PHYSIQUE") || name.contains("ARTIST") || name.contains("MUSI");
    }

        private boolean isPriorityMorningSubject(LessonAssignment lessonAssignment) {
                if (lessonAssignment == null || lessonAssignment.getSubject() == null) {
                        return false;
                }
                return lessonAssignment.getSubjectHoursPerWeek() >= 4 || isHeavySubject(lessonAssignment);
        }

        private boolean isPracticalSubject(LessonAssignment lessonAssignment) {
                String name = normalize(lessonAssignment.getSubject() != null ? lessonAssignment.getSubject().getName() : null);
                return name.contains("LAB") || name.contains("TP") || name.contains("MUSI")
                                || name.contains("ART") || name.contains("SPORT");
        }

        private int longestConsecutiveStreak(java.util.List<LessonAssignment> assignments) {
                if (assignments == null || assignments.isEmpty()) {
                        return 0;
                }

                java.util.List<Integer> orders = assignments.stream()
                                .map(a -> a.getTimeslot() != null ? a.getTimeslot().getOrderInDay() : null)
                                .filter(java.util.Objects::nonNull)
                                .sorted()
                                .toList();

                if (orders.isEmpty()) {
                        return 0;
                }

                int best = 1;
                int current = 1;
                for (int i = 1; i < orders.size(); i++) {
                        int prev = orders.get(i - 1);
                        int now = orders.get(i);
                        if (now == prev + 1) {
                                current++;
                                best = Math.max(best, current);
                        } else if (now != prev) {
                                current = 1;
                        }
                }
                return best;
        }

        private int dailySpread(List<LessonAssignment> assignments) {
                if (assignments == null || assignments.isEmpty()) {
                        return 0;
                }

                Map<com.timetable.model.DayOfWeek, Integer> byDay = new EnumMap<>(com.timetable.model.DayOfWeek.class);
                for (LessonAssignment assignment : assignments) {
                        if (assignment.getTimeslot() == null || assignment.getTimeslot().getDayOfWeek() == null) {
                                continue;
                        }
                        byDay.merge(assignment.getTimeslot().getDayOfWeek(), 1, Integer::sum);
                }
                if (byDay.size() <= 1) {
                        return 0;
                }

                int min = Integer.MAX_VALUE;
                int max = Integer.MIN_VALUE;
                for (int count : byDay.values()) {
                        min = Math.min(min, count);
                        max = Math.max(max, count);
                }
                return Math.max(0, max - min);
        }

        private int timeWindowSpread(List<LessonAssignment> assignments) {
                if (assignments == null || assignments.size() < 2) {
                        return 0;
                }

                int min = Integer.MAX_VALUE;
                int max = Integer.MIN_VALUE;
                for (LessonAssignment assignment : assignments) {
                        if (assignment.getTimeslot() == null || assignment.getTimeslot().getOrderInDay() == null) {
                                continue;
                        }
                        int order = assignment.getTimeslot().getOrderInDay();
                        min = Math.min(min, order);
                        max = Math.max(max, order);
                }

                if (min == Integer.MAX_VALUE) {
                        return 0;
                }
                return Math.max(0, max - min);
        }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String upper = value.trim().toUpperCase(Locale.ROOT);
        return Normalizer.normalize(upper, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
    }
}
