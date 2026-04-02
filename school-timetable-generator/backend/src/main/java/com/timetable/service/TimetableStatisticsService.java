package com.timetable.service;

import com.timetable.model.ClassGroup;
import com.timetable.model.Subject;
import com.timetable.model.TeacherAvailability;
import com.timetable.repository.ClassGroupRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.solver.LessonAssignment;
import com.timetable.solver.TimetableSolution;
import org.optaplanner.core.api.score.ScoreExplanation;
import org.optaplanner.core.api.score.ScoreManager;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.constraint.ConstraintMatchTotal;
import org.optaplanner.core.api.solver.SolverStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@lombok.RequiredArgsConstructor
public class TimetableStatisticsService {

    private static final Pattern LEVEL_NUMBER_PATTERN = Pattern.compile("\\d+");

    private final ScoreManager<TimetableSolution, HardSoftScore> scoreManager;
    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final Map<Long, SolverRunState> runStateBySchool = new ConcurrentHashMap<>();

    public void onSolvingStarted(Long schoolId) {
        SolverRunState state = new SolverRunState();
        state.startedAtMs = Instant.now().toEpochMilli();
        state.lastUpdatedAtMs = state.startedAtMs;
        runStateBySchool.put(schoolId, state);
    }

    public void resetSchoolRun(Long schoolId) {
        runStateBySchool.remove(schoolId);
    }

    public void onBestSolution(Long schoolId, TimetableSolution solution) {
        SolverRunState state = runStateBySchool.computeIfAbsent(schoolId, key -> {
            SolverRunState rs = new SolverRunState();
            rs.startedAtMs = Instant.now().toEpochMilli();
            rs.lastUpdatedAtMs = rs.startedAtMs;
            return rs;
        });

        state.lastUpdatedAtMs = Instant.now().toEpochMilli();
        HardSoftScore score = solution != null ? solution.getScore() : null;
        if (score != null) {
            if (!state.scoreHistory.isEmpty()) {
                ScoreHistoryPoint last = state.scoreHistory.get(state.scoreHistory.size() - 1);
                if (Objects.equals(last.score, score.toString())) {
                    return;
                }
            }
            ScoreHistoryPoint point = new ScoreHistoryPoint();
            point.timestampMs = state.lastUpdatedAtMs;
            point.hardScore = score.hardScore();
            point.softScore = score.softScore();
            point.score = score.toString();
            state.scoreHistory.add(point);
        }
    }

    public void onSolvingStopped(Long schoolId) {
        SolverRunState state = runStateBySchool.computeIfAbsent(schoolId, key -> new SolverRunState());
        long now = Instant.now().toEpochMilli();
        if (state.startedAtMs == 0L) {
            state.startedAtMs = now;
        }
        state.lastUpdatedAtMs = now;
        state.finishedAtMs = now;
    }

    public Map<String, Object> buildStatistics(Long schoolId, SolverStatus status, TimetableSolution solution) {
        SolverRunState state = runStateBySchool.get(schoolId);
        long now = Instant.now().toEpochMilli();
        long startedAtMs = state != null && state.startedAtMs > 0 ? state.startedAtMs : now;
        long finishedAtMs = state != null && state.finishedAtMs > 0 ? state.finishedAtMs : now;

        boolean solving = status != SolverStatus.NOT_SOLVING;
        if (!solving && state != null && state.finishedAtMs == 0L) {
            state.finishedAtMs = now;
            finishedAtMs = now;
        }

        List<LessonAssignment> assignments = solution != null && solution.getLessonAssignments() != null
                ? solution.getLessonAssignments()
                : List.of();

        int totalAssignments = assignments.size();
        int assignedAssignments = (int) assignments.stream()
                .filter(a -> a.getTimeslot() != null && a.getRoom() != null)
                .count();

        int completionPercent = totalAssignments == 0
                ? 0
                : Math.round((assignedAssignments * 100.0f) / totalAssignments);

        int progressPercent = completionPercent;
        if (solving && progressPercent >= 100) {
            progressPercent = 99;
        }

        HardSoftScore score = solution != null ? solution.getScore() : null;
        int hardScore = score != null ? score.hardScore() : 0;
        int softScore = score != null ? score.softScore() : 0;

        int qualityPercent;
        if (hardScore < 0) {
            qualityPercent = 0;
        } else {
            int softLoss = softScore < 0 ? (int) Math.round((Math.abs(softScore) * 100.0) / (Math.abs(softScore) + 200.0)) : 0;
            qualityPercent = Math.max(0, Math.min(100, completionPercent - softLoss));
        }

        boolean solverCompleted = !solving && totalAssignments > 0 && assignedAssignments == totalAssignments;
        boolean solverFeasible = score != null && score.isFeasible();
        boolean solverOptimal = solverCompleted && solverFeasible && softScore >= 0;

        Map<String, Integer> conflicts = calculateConflicts(assignments, solution != null ? solution.getTeacherAvailabilities() : List.of());
        Map<String, Map<String, Integer>> softBreakdown = buildSoftBreakdown(solution);
        List<Map<String, Object>> classWeaknesses = buildClassWeaknesses(assignments);
        List<Map<String, Object>> teacherWeaknesses = buildTeacherWeaknesses(assignments);

        long solvingTimeMs = (solving ? now : finishedAtMs) - startedAtMs;
        if (solvingTimeMs < 0) {
            solvingTimeMs = 0;
        }

        List<Map<String, Object>> scoreHistory = new ArrayList<>();
        if (state != null) {
            for (ScoreHistoryPoint point : state.scoreHistory) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("timestampMs", point.timestampMs);
                row.put("hardScore", point.hardScore);
                row.put("softScore", point.softScore);
                row.put("score", point.score);
                scoreHistory.add(row);
            }
        }

        Map<String, Long> roomUsage = assignments.stream()
                .filter(a -> a.getRoom() != null)
                .collect(Collectors.groupingBy(a -> a.getRoom().getName(), Collectors.counting()));

        Map<String, Long> teacherLoad = assignments.stream()
                .filter(a -> a.getTeacher() != null)
                .collect(Collectors.groupingBy(a -> a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName(), Collectors.counting()));

        Map<String, Long> classLoad = assignments.stream()
                .filter(a -> a.getClassGroup() != null)
                .collect(Collectors.groupingBy(a -> a.getClassGroup().getName(), Collectors.counting()));

        Map<String, Integer> expectedClassHours = buildExpectedClassHours(schoolId);
        Map<String, Integer> classHourDiff = buildClassHourDiff(expectedClassHours, classLoad);
        Map<String, Map<String, Object>> teacherLoadRatio = buildTeacherLoadRatio(assignments);
        Map<String, Long> subjectDistribution = assignments.stream()
            .filter(a -> a.getSubject() != null)
            .collect(Collectors.groupingBy(a -> a.getSubject().getName(), Collectors.counting()));
        Map<String, Long> levelDistribution = assignments.stream()
            .filter(a -> a.getClassGroup() != null)
            .collect(Collectors.groupingBy(a -> a.getClassGroup().getLevel(), Collectors.counting()));
        List<Map<String, Object>> topSoftConstraints = buildTopSoftConstraints(softBreakdown);
        Map<String, Object> iterationComparison = buildIterationComparison(scoreHistory);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", status.name());
        payload.put("solving", solving);
        payload.put("progress", Math.max(0, Math.min(100, progressPercent)));
        payload.put("progressPercent", Math.max(0, Math.min(100, progressPercent)));
        payload.put("completion", Math.max(0, Math.min(100, completionPercent)));
        payload.put("completionPercent", Math.max(0, Math.min(100, completionPercent)));
        payload.put("quality", Math.max(0, Math.min(100, qualityPercent)));
        payload.put("qualityPercent", Math.max(0, Math.min(100, qualityPercent)));
        payload.put("totalAssignments", totalAssignments);
        payload.put("assignedAssignments", assignedAssignments);
        payload.put("hardScore", hardScore);
        payload.put("softScore", softScore);
        payload.put("score", score != null ? score.toString() : null);
        payload.put("solverCompleted", solverCompleted);
        payload.put("solverFeasible", solverFeasible);
        payload.put("solverOptimal", solverOptimal);
        payload.put("conflicts", conflicts);
        payload.put("softBreakdown", softBreakdown);
        payload.put("classWeaknesses", classWeaknesses);
        payload.put("teacherWeaknesses", teacherWeaknesses);
        payload.put("solvingTime", solvingTimeMs);
        payload.put("solvingTimeMs", solvingTimeMs);
        payload.put("scoreHistory", scoreHistory);
        payload.put("roomUsage", roomUsage.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        payload.put("teacherLoad", teacherLoad.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        payload.put("classLoad", classLoad.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        payload.put("expectedClassHours", expectedClassHours);
        payload.put("classHourDiff", classHourDiff);
        payload.put("teacherLoadRatio", teacherLoadRatio);
        payload.put("subjectDistribution", subjectDistribution.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        payload.put("levelDistribution", levelDistribution.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry<String, Long>::getValue).reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new)));
        payload.put("topSoftConstraints", topSoftConstraints);
        payload.put("iterationComparison", iterationComparison);

        return payload;
    }

    public String buildStatisticsCsv(Map<String, Object> statistics) {
        StringBuilder sb = new StringBuilder();
        sb.append("metric,value\n");
        appendMetric(sb, "status", statistics.get("status"));
        appendMetric(sb, "progressPercent", statistics.get("progressPercent"));
        appendMetric(sb, "completionPercent", statistics.get("completionPercent"));
        appendMetric(sb, "qualityPercent", statistics.get("qualityPercent"));
        appendMetric(sb, "hardScore", statistics.get("hardScore"));
        appendMetric(sb, "softScore", statistics.get("softScore"));
        appendMetric(sb, "solvingTimeMs", statistics.get("solvingTimeMs"));

        sb.append("\nsection,name,value\n");
        appendMapSection(sb, "teacherLoad", statistics.get("teacherLoad"));
        appendMapSection(sb, "teacherLoadRatio", statistics.get("teacherLoadRatio"));
        appendMapSection(sb, "roomUsage", statistics.get("roomUsage"));
        appendMapSection(sb, "classLoad", statistics.get("classLoad"));
        appendMapSection(sb, "expectedClassHours", statistics.get("expectedClassHours"));
        appendMapSection(sb, "classHourDiff", statistics.get("classHourDiff"));
        appendMapSection(sb, "subjectDistribution", statistics.get("subjectDistribution"));
        appendMapSection(sb, "levelDistribution", statistics.get("levelDistribution"));
        appendMapSection(sb, "conflicts", statistics.get("conflicts"));

        Object topSoftObj = statistics.get("topSoftConstraints");
        if (topSoftObj instanceof List<?> topSoftList && !topSoftList.isEmpty()) {
            sb.append("\nsection,rank,constraint,softScore\n");
            int rank = 1;
            for (Object item : topSoftList) {
                if (!(item instanceof Map<?, ?> row)) {
                    continue;
                }
                Object name = row.get("constraint");
                Object value = row.get("softScore");
                sb.append("topSoftConstraints,")
                        .append(rank++)
                        .append(",")
                        .append(escapeCsv(name))
                        .append(",")
                        .append(escapeCsv(value))
                        .append("\n");
            }
        }

        Object historyObj = statistics.get("scoreHistory");
        if (historyObj instanceof List<?> historyList && !historyList.isEmpty()) {
            sb.append("\nsection,index,timestampMs,hardScore,softScore,score\n");
            int index = 0;
            for (Object item : historyList) {
                if (!(item instanceof Map<?, ?> row)) {
                    continue;
                }
                sb.append("scoreHistory,")
                        .append(index++)
                        .append(",")
                        .append(escapeCsv(row.get("timestampMs")))
                        .append(",")
                        .append(escapeCsv(row.get("hardScore")))
                        .append(",")
                        .append(escapeCsv(row.get("softScore")))
                        .append(",")
                        .append(escapeCsv(row.get("score")))
                        .append("\n");
            }
        }

        return sb.toString();
    }

    private Map<String, Map<String, Integer>> buildSoftBreakdown(TimetableSolution solution) {
        if (solution == null || solution.getScore() == null) {
            return Collections.emptyMap();
        }

        Map<String, Map<String, Integer>> breakdown = new LinkedHashMap<>();
        ScoreExplanation<TimetableSolution, HardSoftScore> explanation = scoreManager.explain(solution);

        for (ConstraintMatchTotal<HardSoftScore> matchTotal : explanation.getConstraintMatchTotalMap().values()) {
            HardSoftScore constraintScore = matchTotal.getScore();
            String key = matchTotal.getConstraintName();

            Map<String, Integer> values = new LinkedHashMap<>();
            values.put("hard", constraintScore.hardScore());
            values.put("soft", constraintScore.softScore());
            breakdown.put(key, values);
        }
        return breakdown;
    }

    private List<Map<String, Object>> buildClassWeaknesses(List<LessonAssignment> assignments) {
        Map<String, List<LessonAssignment>> byClass = assignments.stream()
                .filter(assignment -> assignment.getClassGroup() != null && assignment.getTimeslot() != null)
                .collect(Collectors.groupingBy(assignment -> assignment.getClassGroup().getName()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<LessonAssignment>> entry : byClass.entrySet()) {
            String className = entry.getKey();
            List<LessonAssignment> lessons = entry.getValue();

            int gaps = countDailyGaps(lessons, false);
            int heavyBackToBack = countHeavyBackToBackByClass(lessons);
            int repeatedSubjectSameDay = countRepeatedSubjectSameDay(lessons);

            int totalPenalty = gaps * 3 + heavyBackToBack * 5 + repeatedSubjectSameDay * 4;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("class", className);
            row.put("gaps", gaps);
            row.put("heavyBackToBack", heavyBackToBack);
            row.put("repeatedSubjectSameDay", repeatedSubjectSameDay);
            row.put("totalPenalty", totalPenalty);
            row.put("topIssue", topIssue(gaps, heavyBackToBack, repeatedSubjectSameDay,
                    "Too many timetable gaps", "Consecutive heavy subjects", "Same subject repeated in one day"));
            result.add(row);
        }

        result.sort(Comparator.comparing(row -> -((Integer) row.get("totalPenalty"))));
        return result;
    }

    private List<Map<String, Object>> buildTeacherWeaknesses(List<LessonAssignment> assignments) {
        Map<String, List<LessonAssignment>> byTeacher = assignments.stream()
                .filter(assignment -> assignment.getTeacher() != null && assignment.getTimeslot() != null)
                .collect(Collectors.groupingBy(assignment -> assignment.getTeacher().getFirstName() + " " + assignment.getTeacher().getLastName()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, List<LessonAssignment>> entry : byTeacher.entrySet()) {
            String teacher = entry.getKey();
            List<LessonAssignment> lessons = entry.getValue();

            int gaps = countDailyGaps(lessons, true);
            int roomChanges = countTeacherRoomChanges(lessons);
            int overloadDays = countTeacherOverloadDays(lessons);

            int totalPenalty = gaps * 3 + roomChanges * 2 + overloadDays * 5;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("teacher", teacher);
            row.put("gaps", gaps);
            row.put("roomChanges", roomChanges);
            row.put("overloadDays", overloadDays);
            row.put("totalPenalty", totalPenalty);
            row.put("topIssue", topIssue(gaps, roomChanges, overloadDays,
                    "Too many timetable gaps", "Frequent room changes", "Daily overload concentration"));
            result.add(row);
        }

        result.sort(Comparator.comparing(row -> -((Integer) row.get("totalPenalty"))));
        return result;
    }

    private int countDailyGaps(List<LessonAssignment> lessons, boolean byTeacher) {
        Map<Object, List<Integer>> ordersByDay = lessons.stream()
                .filter(lesson -> lesson.getTimeslot() != null && lesson.getTimeslot().getOrderInDay() != null)
                .collect(Collectors.groupingBy(
                        lesson -> lesson.getTimeslot().getDayOfWeek(),
                        Collectors.mapping(lesson -> lesson.getTimeslot().getOrderInDay(), Collectors.toList())
                ));

        int totalGaps = 0;
        for (List<Integer> orders : ordersByDay.values()) {
            if (orders.isEmpty()) {
                continue;
            }
            int min = orders.stream().min(Integer::compareTo).orElse(0);
            int max = orders.stream().max(Integer::compareTo).orElse(0);
            totalGaps += Math.max(0, (max - min + 1) - orders.size());
        }

        return totalGaps;
    }

    private int countHeavyBackToBackByClass(List<LessonAssignment> lessons) {
        Map<Object, List<LessonAssignment>> byDay = lessons.stream()
                .filter(lesson -> lesson.getTimeslot() != null && lesson.getTimeslot().getOrderInDay() != null)
                .collect(Collectors.groupingBy(lesson -> lesson.getTimeslot().getDayOfWeek()));

        int total = 0;
        for (List<LessonAssignment> dayLessons : byDay.values()) {
            dayLessons.sort(Comparator.comparing(lesson -> lesson.getTimeslot().getOrderInDay()));
            for (int i = 1; i < dayLessons.size(); i++) {
                LessonAssignment prev = dayLessons.get(i - 1);
                LessonAssignment curr = dayLessons.get(i);
                if (Math.abs(curr.getTimeslot().getOrderInDay() - prev.getTimeslot().getOrderInDay()) == 1
                        && isHeavySubject(prev) && isHeavySubject(curr)) {
                    total++;
                }
            }
        }
        return total;
    }

    private int countRepeatedSubjectSameDay(List<LessonAssignment> lessons) {
        Map<String, Long> bySubjectDay = lessons.stream()
                .filter(lesson -> lesson.getSubject() != null && lesson.getTimeslot() != null)
                .collect(Collectors.groupingBy(
                        lesson -> lesson.getTimeslot().getDayOfWeek() + "|" + lesson.getSubject().getName(),
                        Collectors.counting()));

        return bySubjectDay.values().stream()
                .filter(count -> count > 1)
                .mapToInt(count -> (int) (count - 1))
                .sum();
    }

    private int countTeacherRoomChanges(List<LessonAssignment> lessons) {
        Map<Object, List<LessonAssignment>> byDay = lessons.stream()
                .filter(lesson -> lesson.getTimeslot() != null && lesson.getTimeslot().getOrderInDay() != null)
                .collect(Collectors.groupingBy(lesson -> lesson.getTimeslot().getDayOfWeek()));

        int changes = 0;
        for (List<LessonAssignment> dayLessons : byDay.values()) {
            dayLessons.sort(Comparator.comparing(lesson -> lesson.getTimeslot().getOrderInDay()));
            for (int i = 1; i < dayLessons.size(); i++) {
                Long prevRoom = dayLessons.get(i - 1).getRoomId();
                Long currRoom = dayLessons.get(i).getRoomId();
                if (prevRoom != null && currRoom != null && !prevRoom.equals(currRoom)) {
                    changes++;
                }
            }
        }
        return changes;
    }

    private int countTeacherOverloadDays(List<LessonAssignment> lessons) {
        Map<Object, Long> countsByDay = lessons.stream()
                .filter(lesson -> lesson.getTimeslot() != null)
                .collect(Collectors.groupingBy(lesson -> lesson.getTimeslot().getDayOfWeek(), Collectors.counting()));

        return (int) countsByDay.values().stream().filter(count -> count > 5).count();
    }

    private String topIssue(int a, int b, int c, String aText, String bText, String cText) {
        if (a >= b && a >= c && a > 0) {
            return aText;
        }
        if (b >= a && b >= c && b > 0) {
            return bText;
        }
        if (c > 0) {
            return cText;
        }
        return "No significant weakness";
    }

    private boolean isHeavySubject(LessonAssignment lessonAssignment) {
        if (lessonAssignment.getSubject() == null || lessonAssignment.getSubject().getName() == null) {
            return false;
        }
        String subjectName = lessonAssignment.getSubject().getName().toUpperCase();
        return subjectName.contains("MATH") || subjectName.contains("PHYS") || subjectName.contains("CHIM");
    }

    private Map<String, Integer> calculateConflicts(List<LessonAssignment> assignments, List<TeacherAvailability> availabilities) {
        Map<String, Integer> conflicts = new LinkedHashMap<>();

        int roomConflicts = countDuplicateBy(assignments, a -> key(a.getTimeslotId(), a.getRoomId()));
        int teacherConflicts = countDuplicateBy(assignments, a -> key(a.getTimeslotId(), a.getTeacherId()));
        int classConflicts = countDuplicateBy(assignments, a -> key(a.getTimeslotId(), a.getClassGroupId()));
        int duplicateConflicts = countDuplicateBy(assignments,
                a -> key(a.getTimeslotId(), a.getTeacherId(), a.getClassGroupId(), a.getSubjectId()));

        Map<String, Boolean> availabilityByKey = new HashMap<>();
        for (TeacherAvailability availability : availabilities) {
            if (availability.getTeacher() == null || availability.getTimeslot() == null) {
                continue;
            }
            availabilityByKey.put(key(availability.getTimeslot().getId(), availability.getTeacher().getId()), availability.isAvailable());
        }

        int invalidAssignments = 0;
        for (LessonAssignment assignment : assignments) {
            if (assignment.getTimeslot() == null || assignment.getRoom() == null || assignment.getTeacher() == null || assignment.getClassGroup() == null) {
                invalidAssignments++;
                continue;
            }

            if (assignment.getClassGroupStudentCount() > assignment.getRoomCapacity()) {
                invalidAssignments++;
                continue;
            }

            String requiredRoomType = assignment.getRequiredRoomType();
            String roomType = assignment.getRoom().getType();
            if (requiredRoomType != null && !requiredRoomType.isBlank()) {
                if (roomType == null || !requiredRoomType.trim().equalsIgnoreCase(roomType.trim())) {
                    invalidAssignments++;
                    continue;
                }
            }

            String availabilityKey = key(assignment.getTimeslot().getId(), assignment.getTeacher().getId());
            Boolean available = availabilityByKey.get(availabilityKey);
            if (available == null || !available) {
                invalidAssignments++;
            }
        }

        int totalConflicts = roomConflicts + teacherConflicts + classConflicts + duplicateConflicts + invalidAssignments;

        conflicts.put("teacher", teacherConflicts);
        conflicts.put("room", roomConflicts);
        conflicts.put("class", classConflicts);
        conflicts.put("duplicates", duplicateConflicts);
        conflicts.put("invalidAssignments", invalidAssignments);
        conflicts.put("total", totalConflicts);
        return conflicts;
    }

    private Map<String, Integer> buildExpectedClassHours(Long schoolId) {
        List<ClassGroup> classGroups = classGroupRepository.findBySchoolId(schoolId);
        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);

        Map<String, Integer> result = new LinkedHashMap<>();
        for (ClassGroup classGroup : classGroups) {
            int expected = subjects.stream()
                    .filter(subject -> subjectMatchesClassLevel(subject.getLevel(), classGroup.getLevel()))
                    .mapToInt(subject -> {
                        int weeklyMinutes = Math.max(0, subject.getHoursPerWeek()) * 60;
                        int sessionMinutes = Math.max(1, subject.getSessionDuration());
                        return (int) Math.ceil(weeklyMinutes / (double) sessionMinutes);
                    })
                    .sum();
            result.put(classGroup.getName(), expected);
        }
        return result;
    }

    private Map<String, Integer> buildClassHourDiff(Map<String, Integer> expectedClassHours,
                                                    Map<String, Long> classLoad) {
        Map<String, Integer> result = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> expected : expectedClassHours.entrySet()) {
            int actual = classLoad.getOrDefault(expected.getKey(), 0L).intValue();
            result.put(expected.getKey(), actual - expected.getValue());
        }
        return result;
    }

    private Map<String, Map<String, Object>> buildTeacherLoadRatio(List<LessonAssignment> assignments) {
        Map<String, List<LessonAssignment>> byTeacher = assignments.stream()
                .filter(a -> a.getTeacher() != null)
                .collect(Collectors.groupingBy(a -> a.getTeacher().getFirstName() + " " + a.getTeacher().getLastName()));

        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        for (Map.Entry<String, List<LessonAssignment>> entry : byTeacher.entrySet()) {
            List<LessonAssignment> lessons = entry.getValue();
            int plannedMinutes = lessons.stream().mapToInt(LessonAssignment::getSubjectSessionDuration).sum();
            double planned = plannedMinutes / 60.0;
            int maxHours = lessons.get(0).getTeacherMaxHours();
            double ratio = maxHours <= 0 ? 0.0 : (planned * 100.0) / maxHours;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("planned", Math.round(planned * 10.0) / 10.0);
            row.put("maxHours", maxHours);
            row.put("ratioPercent", Math.round(ratio * 10.0) / 10.0);
            result.put(entry.getKey(), row);
        }

        return result.entrySet().stream()
                .sorted((a, b) -> {
                    Object ar = a.getValue().get("ratioPercent");
                    Object br = b.getValue().get("ratioPercent");
                    double adv = ar instanceof Number ? ((Number) ar).doubleValue() : 0.0;
                    double bdv = br instanceof Number ? ((Number) br).doubleValue() : 0.0;
                    return Double.compare(bdv, adv);
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> x, LinkedHashMap::new));
    }

    private List<Map<String, Object>> buildTopSoftConstraints(Map<String, Map<String, Integer>> softBreakdown) {
        return softBreakdown.entrySet().stream()
                .map(entry -> {
                    Map<String, Integer> values = entry.getValue();
                    int soft = values != null ? values.getOrDefault("soft", 0) : 0;
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("constraint", entry.getKey());
                    row.put("softScore", soft);
                    row.put("impact", Math.abs(soft));
                    return row;
                })
                .filter(row -> {
                    Object softValue = row.get("softScore");
                    return softValue instanceof Integer && (Integer) softValue < 0;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("impact"), (Integer) a.get("impact")))
                .limit(5)
                .toList();
    }

    private Map<String, Object> buildIterationComparison(List<Map<String, Object>> scoreHistory) {
        if (scoreHistory == null || scoreHistory.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> first = scoreHistory.get(0);
        Map<String, Object> last = scoreHistory.get(scoreHistory.size() - 1);

        int firstHard = toInt(first.get("hardScore"));
        int firstSoft = toInt(first.get("softScore"));
        int lastHard = toInt(last.get("hardScore"));
        int lastSoft = toInt(last.get("softScore"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("iterations", scoreHistory.size());
        result.put("hardImprovement", lastHard - firstHard);
        result.put("softImprovement", lastSoft - firstSoft);
        result.put("fromScore", first.get("score"));
        result.put("toScore", last.get("score"));
        return result;
    }

    private int toInt(Object value) {
        if (value instanceof Number n) {
            return n.intValue();
        }
        if (value instanceof String s) {
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
        return 0;
    }

    private boolean subjectMatchesClassLevel(String subjectLevel, String classLevel) {
        String s = normalizeLevel(subjectLevel);
        String c = normalizeLevel(classLevel);

        if (s == null) {
            return true;
        }
        if (c == null) {
            return false;
        }

        Integer sn = extractFirstNumber(s);
        Integer cn = extractFirstNumber(c);
        if (sn != null && cn != null) {
            return Objects.equals(sn, cn);
        }
        return s.equals(c);
    }

    private String normalizeLevel(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private Integer extractFirstNumber(String value) {
        if (value == null) {
            return null;
        }
        Matcher matcher = LEVEL_NUMBER_PATTERN.matcher(value);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Integer.parseInt(matcher.group());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private void appendMapSection(StringBuilder sb, String section, Object mapObj) {
        if (!(mapObj instanceof Map<?, ?> map) || map.isEmpty()) {
            return;
        }
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map<?, ?> nested) {
                sb.append(section)
                        .append(",")
                        .append(escapeCsv(entry.getKey()))
                        .append(",")
                        .append(escapeCsv(nested.toString()))
                        .append("\n");
            } else {
                sb.append(section)
                        .append(",")
                        .append(escapeCsv(entry.getKey()))
                        .append(",")
                        .append(escapeCsv(value))
                        .append("\n");
            }
        }
    }

    private void appendMetric(StringBuilder sb, String name, Object value) {
        sb.append(name).append(",").append(escapeCsv(value)).append("\n");
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String text = value.toString();
        boolean needsQuotes = text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r");
        if (text.contains("\"")) {
            text = text.replace("\"", "\"\"");
        }
        if (needsQuotes) {
            return "\"" + text + "\"";
        }
        return text;
    }

    private int countDuplicateBy(List<LessonAssignment> assignments, java.util.function.Function<LessonAssignment, String> keyExtractor) {
        Map<String, Long> grouped = assignments.stream()
                .filter(a -> a.getTimeslot() != null)
                .collect(Collectors.groupingBy(keyExtractor, Collectors.counting()));

        return grouped.values().stream()
                .filter(count -> count > 1)
                .mapToInt(count -> (int) (count - 1))
                .sum();
    }

    private String key(Object... parts) {
        return java.util.Arrays.stream(parts)
                .map(value -> value == null ? "null" : value.toString())
                .collect(Collectors.joining("|"));
    }

    private static final class SolverRunState {
        private long startedAtMs;
        private long lastUpdatedAtMs;
        private long finishedAtMs;
        private final List<ScoreHistoryPoint> scoreHistory = new ArrayList<>();
    }

    private static final class ScoreHistoryPoint {
        private long timestampMs;
        private int hardScore;
        private int softScore;
        private String score;
    }
}
