package com.timetable.solver;

import com.timetable.model.TeacherAvailability;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;
import org.optaplanner.core.api.score.stream.ConstraintCollectors;

import java.text.Normalizer;
import java.util.Locale;

public class TimetableConstraintProvider implements ConstraintProvider {

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
                teacherAvailabilityMissing(constraintFactory),
                teacherMaxHours(constraintFactory),
                exactWeeklyHoursPerClassAndSubject(constraintFactory),
                timeslotDurationCompatibility(constraintFactory),
                roomTypeCompatibility(constraintFactory),
                roomCapacity(constraintFactory),
                prioritySubjectsMorningHard(constraintFactory),
                // Soft constraints
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
                sportArtAfternoonPreference(constraintFactory),
                subjectCoherentTimeWindows(constraintFactory),
                practicalSubjectGrouping(constraintFactory),
                teacherRoomStability(constraintFactory),
                timeslotDurationWasteMinimization(constraintFactory),
                subjectVarietyPerDay(constraintFactory),
                classGroupDayBalance(constraintFactory),
                roomDailyUsageBalance(constraintFactory)
        };
    }

        // Every lesson must be fully assigned
        Constraint unassignedLesson(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() == null || la.getRoom() == null)
                                .penalize(HardSoftScore.ofHard(1_000))
                                .asConstraint("Unassigned lesson");
        }

    // A room can only have one lesson at a time
    Constraint roomConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getRoom))
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Room conflict");
    }

    // A teacher can only teach one lesson at a time
    Constraint teacherConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getTeacherId))
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Teacher conflict");
    }

    // A class group can only attend one lesson at a time
    Constraint classGroupConflict(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getTimeslot),
                        Joiners.equal(LessonAssignment::getClassGroupId))
                .penalize(HardSoftScore.ofHard(1_000))
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
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Duplicate assignment");
    }

    // Teacher assigned to a subject they cannot teach is invalid
    Constraint teacherQualification(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTeacher() != null && la.getSubject() != null)
                .filter(la -> la.getTeacher().getSubjects() == null
                        || la.getTeacher().getSubjects().stream().noneMatch(s -> s.getId().equals(la.getSubjectId())))
                .penalize(HardSoftScore.ofHard(1_000))
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
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Teacher availability");
    }

    // Missing availability record is treated as unavailable
    Constraint teacherAvailabilityMissing(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .ifNotExists(TeacherAvailability.class,
                        Joiners.equal(la -> la.getTeacher().getId(), ta -> ta.getTeacher().getId()),
                        Joiners.equal(la -> la.getTimeslot().getId(), ta -> ta.getTimeslot().getId()))
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Teacher availability missing");
    }

    // Teacher max hours per week (uses actual teacher value)
    Constraint teacherMaxHours(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTeacher() != null)
                .groupBy(LessonAssignment::getTeacherId,
                        ConstraintCollectors.sum(LessonAssignment::getSubjectSessionDuration),
                        ConstraintCollectors.max(LessonAssignment::getTeacherMaxHours))
                .filter((teacherId, assignedMinutes, maxHours) -> assignedMinutes > (maxHours != null ? maxHours : 0) * 60)
                .penalize(HardSoftScore.ofHard(1_000),
                        (teacherId, assignedMinutes, maxHours) -> assignedMinutes - ((maxHours != null ? maxHours : 0) * 60))
                .asConstraint("Teacher max hours");
    }

    // Enforce exact planned weekly hours per class and subject
    Constraint exactWeeklyHoursPerClassAndSubject(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .groupBy(LessonAssignment::getClassGroupId,
                        LessonAssignment::getSubjectId,
                        ConstraintCollectors.sum(la -> la.getTimeslot() != null && la.getRoom() != null ? la.getSubjectSessionDuration() : 0),
                        ConstraintCollectors.max(LessonAssignment::getRequiredWeeklyMinutes))
                .filter((classId, subjectId, assignedMinutes, expectedMinutes) -> assignedMinutes != (expectedMinutes != null ? expectedMinutes : 0))
                .penalize(HardSoftScore.ofHard(1_000),
                        (classId, subjectId, assignedMinutes, expectedMinutes) -> Math.abs(assignedMinutes - (expectedMinutes != null ? expectedMinutes : 0)))
                .asConstraint("Exact weekly hours per class/subject");
    }

    Constraint timeslotDurationCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .filter(la -> la.getTimeslotDurationMinutes() < la.getSubjectSessionDuration())
                .penalize(HardSoftScore.ofHard(1_000),
                        la -> la.getSubjectSessionDuration() - la.getTimeslotDurationMinutes())
                .asConstraint("Timeslot duration compatibility");
    }

    // Room must have enough capacity for the class
    Constraint roomCapacity(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && la.getClassGroup() != null
                        && la.getClassGroupStudentCount() > la.getRoomCapacity())
                .penalize(HardSoftScore.ofHard(1_000),
                        la -> la.getClassGroupStudentCount() - la.getRoomCapacity())
                .asConstraint("Room capacity");
    }

    // Assigned room type must satisfy subject required room type when specified
    Constraint roomTypeCompatibility(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getRoom() != null && hasText(la.getRequiredRoomType()))
                .filter(la -> !normalize(la.getRequiredRoomType()).equals(normalize(la.getRoom().getType())))
                .penalize(HardSoftScore.ofHard(1_000))
                .asConstraint("Room type compatibility");
    }

        // Optional hard policy: high-priority subjects should be in morning slots
        Constraint prioritySubjectsMorningHard(ConstraintFactory constraintFactory) {
                return constraintFactory
                                .forEach(LessonAssignment.class)
                                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                                .filter(this::isPriorityMorningSubject)
                                .filter(la -> la.getTimeslot().getOrderInDay() > 3)
                                .penalize(HardSoftScore.ofHard(250), la -> la.getTimeslot().getOrderInDay() - 3)
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
                                .penalize(HardSoftScore.ofSoft(18),
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
                                .penalize(HardSoftScore.ofSoft(14),
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
                .penalize(HardSoftScore.ofSoft(8), (teacherId, day, count) -> count - 5)
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
                .penalize(HardSoftScore.ofSoft(7), (classId, day, count) -> count - 5)
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
                .filter((classId, day, assignments) -> longestConsecutiveStreak(assignments) > 4)
                .penalize(HardSoftScore.ofSoft(9), (classId, day, assignments) -> longestConsecutiveStreak(assignments) - 4)
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
                .filter((teacherId, day, assignments) -> longestConsecutiveStreak(assignments) > 4)
                .penalize(HardSoftScore.ofSoft(8), (teacherId, day, assignments) -> longestConsecutiveStreak(assignments) - 4)
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
                .penalize(HardSoftScore.ofSoft(10), (classId, subjectId, day, count) -> count - 1)
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
                .penalize(HardSoftScore.ofSoft(12))
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
                .penalize(HardSoftScore.ofSoft(8))
                .asConstraint("Teacher heavy consecutive lessons");
    }

    // Prefer high-priority subjects in morning slots
    Constraint prioritySubjectsMorningSoft(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                .filter(this::isPriorityMorningSubject)
                .filter(la -> la.getTimeslot().getOrderInDay() > 3)
                .penalize(HardSoftScore.ofSoft(6), la -> la.getTimeslot().getOrderInDay() - 3)
                .asConstraint("Priority subjects morning (soft)");
    }

    // Prefer sports and arts in later slots (typically afternoon)
    Constraint sportArtAfternoonPreference(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null && la.getTimeslot().getOrderInDay() != null)
                .filter(this::isSportOrArtSubject)
                .filter(la -> la.getTimeslot().getOrderInDay() <= 3)
                .penalize(HardSoftScore.ofSoft(4), la -> 4 - la.getTimeslot().getOrderInDay())
                .asConstraint("Sport/Art afternoon preference");
    }

    // Keep the same subject in coherent daily time windows across the week
    Constraint subjectCoherentTimeWindows(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getOrderInDay() != null && l2.getTimeslot().getOrderInDay() != null
                        && l1.getTimeslot().getDayOfWeek() != l2.getTimeslot().getDayOfWeek())
                .penalize(HardSoftScore.ofSoft(3),
                        (l1, l2) -> Math.abs(l1.getTimeslot().getOrderInDay() - l2.getTimeslot().getOrderInDay()))
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
                .reward(HardSoftScore.ofSoft(3))
                .asConstraint("Practical subject grouping");
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
                .penalize(HardSoftScore.ofSoft(4))
                .asConstraint("Teacher room stability");
    }

    Constraint timeslotDurationWasteMinimization(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(LessonAssignment.class)
                .filter(la -> la.getTimeslot() != null)
                .filter(la -> la.getTimeslotDurationMinutes() > la.getSubjectSessionDuration())
                .penalize(HardSoftScore.ofSoft(2),
                        la -> la.getTimeslotDurationMinutes() - la.getSubjectSessionDuration())
                .asConstraint("Timeslot duration waste minimization");
    }

    // Penalize having the same subject multiple times on the same day for the same class
    Constraint subjectVarietyPerDay(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEachUniquePair(LessonAssignment.class,
                        Joiners.equal(LessonAssignment::getClassGroupId),
                        Joiners.equal(LessonAssignment::getSubjectId))
                .filter((l1, l2) -> l1.getTimeslot() != null && l2.getTimeslot() != null
                        && l1.getTimeslot().getDayOfWeek() == l2.getTimeslot().getDayOfWeek())
                .penalize(HardSoftScore.ofSoft(7))
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
                .filter((classId, day, count) -> count > 4)
                .penalize(HardSoftScore.ofSoft(7), (classId, day, count) -> count - 4)
                .asConstraint("Class group day balance");
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
                .penalize(HardSoftScore.ofSoft(2), (roomId, day, count) -> count - 6)
                .asConstraint("Room daily usage balance");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isHeavySubject(LessonAssignment lessonAssignment) {
        String name = normalize(lessonAssignment.getSubject() != null ? lessonAssignment.getSubject().getName() : null);
        return name.contains("MATHEMAT") || name.contains("PHYSIQUE") || name.contains("CHIMIE");
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

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String upper = value.trim().toUpperCase(Locale.ROOT);
        return Normalizer.normalize(upper, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
    }
}
