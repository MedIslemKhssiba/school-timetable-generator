package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.*;
import com.timetable.repository.*;
import com.timetable.solver.LessonAssignment;
import com.timetable.solver.TimetableSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.optaplanner.core.api.solver.SolverManager;
import org.optaplanner.core.api.solver.SolverStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

    private static final Pattern LEVEL_NUMBER_PATTERN = Pattern.compile("\\d+");

    private final LessonRepository lessonRepository;
    private final TeacherRepository teacherRepository;
    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TimeslotRepository timeslotRepository;
    private final TeacherAvailabilityRepository availabilityRepository;
    private final SolverManager<TimetableSolution, Long> solverManager;
    private final TimetableStatisticsService timetableStatisticsService;
    private final TimetableDiagnosticsService timetableDiagnosticsService;
    private final TimetableHistoryService timetableHistoryService;
    private final SchoolRepository schoolRepository;

    private final Map<Long, TimetableSolution> solutionMap = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public String solve(Long schoolId) {
        solverManager.terminateEarly(schoolId);
        solutionMap.remove(schoolId);
        timetableStatisticsService.resetSchoolRun(schoolId);

        timetableDiagnosticsService.assertReadyForSolve(schoolId);

        List<Teacher> teachers = teacherRepository.findWithSubjectsBySchoolId(schoolId);
        List<ClassGroup> classGroups = classGroupRepository.findBySchoolId(schoolId);
        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);
        List<Room> rooms = roomRepository.findBySchoolId(schoolId);
        List<Timeslot> timeslots = timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc();

        if (timeslots.isEmpty()) {
            throw new IllegalStateException("No timeslots configured. Please initialize timeslots first.");
        }
        if (teachers.isEmpty()) {
            throw new IllegalStateException("No teachers found for school " + schoolId);
        }
        if (rooms.isEmpty()) {
            throw new IllegalStateException("No rooms found for school " + schoolId);
        }

        // Build a map: subjectId -> list of teachers who can teach it
        Map<Long, List<Teacher>> teachersBySubject = new HashMap<>();
        for (Teacher t : teachers) {
            for (Subject s : t.getSubjects()) {
                teachersBySubject.computeIfAbsent(s.getId(), k -> new ArrayList<>()).add(t);
            }
        }

        // Track assigned minutes per teacher for load balancing
        Map<Long, Integer> teacherLoad = new HashMap<>();
        teachers.forEach(t -> teacherLoad.put(t.getId(), 0));

        // Build lesson assignments from subjects and class groups
        List<LessonAssignment> assignments = new ArrayList<>();
        List<String> missingCoverage = new ArrayList<>();
        long assignmentId = 1;
        for (ClassGroup cg : classGroups) {
            for (Subject subject : subjects) {
                if (!subjectMatchesClassLevel(subject, cg)) {
                    continue;
                }
                int sessionMinutes = normalizeSessionDurationMinutes(subject.getSessionDuration());
                int requiredSessions = computeRequiredSessions(subject, sessionMinutes);

                for (int i = 0; i < requiredSessions; i++) {
                    List<Teacher> qualified = teachersBySubject.getOrDefault(subject.getId(), List.of());

                    // Pick the teacher with the least load while respecting max weekly minutes
                    Teacher assignedTeacher = qualified.stream()
                        .filter(t -> teacherLoad.getOrDefault(t.getId(), 0) + sessionMinutes <= t.getMaxHoursPerWeek() * 60)
                            .min(Comparator.comparingInt(t -> teacherLoad.getOrDefault(t.getId(), 0)))
                            .orElse(null);

                    if (assignedTeacher != null) {
                        LessonAssignment la = new LessonAssignment();
                        la.setId(assignmentId++);
                        la.setSubject(subject);
                        la.setTeacher(assignedTeacher);
                        la.setClassGroup(cg);
                        la.setSchoolId(schoolId);
                        assignments.add(la);
                        teacherLoad.merge(assignedTeacher.getId(), sessionMinutes, Integer::sum);
                    } else {
                        String missing = String.format("Classe '%s' / Matiere '%s'", cg.getName(), subject.getName());
                        missingCoverage.add(missing);
                        log.warn("No eligible teacher found for {} in school {}", missing, schoolId);
                    }
                }
            }
        }

        if (!missingCoverage.isEmpty()) {
            String details = missingCoverage.stream()
                    .limit(10)
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException("Generation impossible: enseignants manquants ou surcharge hebdomadaire pour "
                    + missingCoverage.size() + " affectation(s). Exemples: " + details);
        }

        List<String> roomIncompatibilities = new ArrayList<>();
        for (LessonAssignment assignment : assignments) {
            boolean hasCompatibleRoom = rooms.stream().anyMatch(room -> {
                boolean capacityOk = room.getCapacity() >= assignment.getClassGroupStudentCount();
                boolean typeOk = assignment.getRequiredRoomType() == null || assignment.getRequiredRoomType().isBlank()
                        || (room.getType() != null && room.getType().trim().equalsIgnoreCase(assignment.getRequiredRoomType().trim()));
                return capacityOk && typeOk;
            });
            if (!hasCompatibleRoom) {
                roomIncompatibilities.add(String.format("Classe '%s' / Matiere '%s'", assignment.getClassGroup().getName(), assignment.getSubject().getName()));
            }
        }
        if (!roomIncompatibilities.isEmpty()) {
            String details = roomIncompatibilities.stream().limit(10).collect(Collectors.joining(", "));
            throw new IllegalStateException("Generation impossible: salles incompatibles pour "
                    + roomIncompatibilities.size() + " affectation(s). Exemples: " + details);
        }

        List<String> sessionDurationIssues = new ArrayList<>();
        for (LessonAssignment assignment : assignments) {
            int sessionMinutes = assignment.getSubjectSessionDuration();
            boolean hasCompatibleTimeslot = timeslots.stream().anyMatch(ts -> {
                int duration = (int) java.time.Duration.between(ts.getStartTime(), ts.getEndTime()).toMinutes();
                return duration >= sessionMinutes;
            });
            if (!hasCompatibleTimeslot) {
                sessionDurationIssues.add(String.format("Classe '%s' / Matiere '%s' (%d min)",
                        assignment.getClassGroup().getName(), assignment.getSubject().getName(), sessionMinutes));
            }
        }
        if (!sessionDurationIssues.isEmpty()) {
            String details = sessionDurationIssues.stream().limit(10).collect(Collectors.joining(", "));
            throw new IllegalStateException("Generation impossible: aucun creneau compatible avec la duree de certaines matieres. Exemples: " + details);
        }

        // Load teacher availabilities
        List<TeacherAvailability> allAvailabilities = new ArrayList<>();
        for (Teacher t : teachers) {
            allAvailabilities.addAll(availabilityRepository.findByTeacherId(t.getId()));
        }

        TimetableSolution problem = new TimetableSolution();
        problem.setId(schoolId);
        problem.setTimeslots(timeslots);
        problem.setRooms(rooms);
        problem.setLessonAssignments(assignments);
        problem.setTeacherAvailabilities(allAvailabilities);

        if (assignments.isEmpty()) {
            solutionMap.put(schoolId, problem);
            timetableStatisticsService.onSolvingStarted(schoolId);
            timetableStatisticsService.onBestSolution(schoolId, problem);
            timetableStatisticsService.onSolvingStopped(schoolId);
            log.warn("No lesson assignments generated for school {}. Returning empty timetable.", schoolId);
            return "No lesson assignments generated for school " + schoolId + ". Timetable is empty.";
        }

        timetableStatisticsService.onSolvingStarted(schoolId);
        solverManager.solveAndListen(schoolId, id -> problem,
                solution -> {
                    solutionMap.put(schoolId, solution);
                    timetableStatisticsService.onBestSolution(schoolId, solution);
                });

        log.info("Solving started for school {} with {} assignments, {} timeslots, {} rooms",
                schoolId, assignments.size(), timeslots.size(), rooms.size());
        return "Solving started for school " + schoolId;
    }

    private boolean subjectMatchesClassLevel(Subject subject, ClassGroup classGroup) {
        String subjectLevel = normalizeLevel(subject.getLevel());
        String classLevel = normalizeLevel(classGroup.getLevel());

        if (subjectLevel == null) {
            return true;
        }

        if (classLevel == null) {
            return false;
        }

        Integer subjectLevelNumber = extractFirstNumber(subjectLevel);
        Integer classLevelNumber = extractFirstNumber(classLevel);

        if (subjectLevelNumber != null && classLevelNumber != null) {
            return Objects.equals(subjectLevelNumber, classLevelNumber);
        }

        return subjectLevel.equals(classLevel);
    }

    private String normalizeLevel(String level) {
        if (level == null || level.isBlank()) {
            return null;
        }
        return level.trim().toUpperCase(Locale.ROOT);
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

    public TimetableSolution getSolution(Long schoolId) {
        return solutionMap.get(schoolId);
    }

    public String stopSolving(Long schoolId) {
        solverManager.terminateEarly(schoolId);
        timetableStatisticsService.onSolvingStopped(schoolId);
        return "Solving stopped for school " + schoolId;
    }

    @Transactional
    public List<Lesson> saveSolution(Long schoolId) {
        TimetableSolution solution = solutionMap.get(schoolId);
        if (solution == null) {
            List<Lesson> existingLessons = lessonRepository.findBySchoolIdWithDetails(schoolId);
            if (!existingLessons.isEmpty()) {
                log.info("No in-memory solution for school {}, returning existing persisted lessons", schoolId);
                Map<String, Object> historyResult = timetableHistoryService.archiveAndDispatchToTeachers(schoolId, existingLessons, null);
                markTimetableAsSent(schoolId);
                log.info("Existing timetable dispatched for school {} with history id {} and {} teacher dispatch(es)",
                        schoolId, historyResult.get("historyId"), historyResult.get("teacherDispatchCount"));
                return existingLessons;
            }
            throw new ResourceNotFoundException("No solution found for school " + schoolId
                    + ". Please generate a timetable before saving.");
        }

        long unassigned = solution.getLessonAssignments().stream()
                .filter(la -> la.getTimeslot() == null || la.getRoom() == null)
                .count();
        if (unassigned > 0) {
            throw new IllegalStateException("Le planning est incomplet: " + unassigned + " cours non assignes."
                    + " Veuillez relancer la generation avant sauvegarde.");
        }

        validateExactHoursPerClassAndSubject(schoolId, solution.getLessonAssignments());

        // Efficiently delete existing lessons
        lessonRepository.deleteBySchoolId(schoolId);

        School schoolRef = School.builder().id(schoolId).build();
        List<Lesson> saved = new ArrayList<>();
        for (LessonAssignment la : solution.getLessonAssignments()) {
            if (la.getTimeslot() != null && la.getRoom() != null) {
                Lesson lesson = Lesson.builder()
                        .subject(la.getSubject())
                        .teacher(la.getTeacher())
                        .classGroup(la.getClassGroup())
                        .room(la.getRoom())
                        .timeslot(la.getTimeslot())
                        .school(schoolRef)
                        .build();
                saved.add(lessonRepository.save(lesson));
            }
        }
        int syncedAvailabilities = syncTeachersWithAllTimeslots(schoolId);
        Map<String, Object> historyResult = timetableHistoryService.archiveAndDispatchToTeachers(schoolId, saved, solution);
        markTimetableAsSent(schoolId);
        log.info("Saved {} lessons for school {}", saved.size(), schoolId);
        log.info("Teacher availability synchronization after save for school {}: {} availability entries created",
                schoolId, syncedAvailabilities);
        log.info("Timetable history saved for school {} with history id {} and {} teacher dispatch(es)",
            schoolId, historyResult.get("historyId"), historyResult.get("teacherDispatchCount"));
        return saved;
    }

    private void markTimetableAsSent(Long schoolId) {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + schoolId));
        school.setTimetableSent(true);
        school.setTimetableSentAt(java.time.LocalDateTime.now());
        schoolRepository.save(school);
    }

    private void validateExactHoursPerClassAndSubject(Long schoolId, List<LessonAssignment> assignments) {
        List<ClassGroup> classGroups = classGroupRepository.findBySchoolId(schoolId);
        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);

        Map<String, Integer> expectedMinutesByClassAndSubject = new HashMap<>();
        for (ClassGroup classGroup : classGroups) {
            for (Subject subject : subjects) {
                if (!subjectMatchesClassLevel(subject, classGroup)) {
                    continue;
                }
                int expectedMinutes = Math.max(0, subject.getHoursPerWeek()) * 60;
                expectedMinutesByClassAndSubject.put(key(classGroup.getId(), subject.getId()), expectedMinutes);
            }
        }

        Map<String, Integer> actualMinutesByClassAndSubject = assignments.stream()
                .collect(Collectors.groupingBy(
                        la -> key(la.getClassGroupId(), la.getSubjectId()),
                        Collectors.summingInt(LessonAssignment::getSubjectSessionDuration)
                ));

        List<String> mismatches = new ArrayList<>();
        for (Map.Entry<String, Integer> expectedEntry : expectedMinutesByClassAndSubject.entrySet()) {
            int actual = actualMinutesByClassAndSubject.getOrDefault(expectedEntry.getKey(), 0);
            if (actual != expectedEntry.getValue()) {
                mismatches.add(formatHoursMismatch(expectedEntry.getKey(), expectedEntry.getValue(), actual, classGroups, subjects));
            }
        }

        for (Map.Entry<String, Integer> actualEntry : actualMinutesByClassAndSubject.entrySet()) {
            if (!expectedMinutesByClassAndSubject.containsKey(actualEntry.getKey())) {
                mismatches.add(formatHoursMismatch(actualEntry.getKey(), 0, actualEntry.getValue(), classGroups, subjects));
            }
        }

        if (!mismatches.isEmpty()) {
            String details = mismatches.stream().limit(10).collect(Collectors.joining(" | "));
            throw new IllegalStateException("Le planning ne respecte pas exactement les heures par niveau/matiere. "
                    + mismatches.size() + " ecart(s) detecte(s). Exemples: " + details);
        }
    }

    private int syncTeachersWithAllTimeslots(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
        List<Timeslot> timeslots = timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc();

        int created = 0;
        for (Teacher teacher : teachers) {
            for (Timeslot timeslot : timeslots) {
                if (!availabilityRepository.existsByTeacherIdAndTimeslotId(teacher.getId(), timeslot.getId())) {
                    availabilityRepository.save(TeacherAvailability.builder()
                            .teacher(teacher)
                            .timeslot(timeslot)
                            .available(true)
                            .build());
                    created++;
                }
            }
        }
        return created;
    }

    private String key(Long classGroupId, Long subjectId) {
        return classGroupId + ":" + subjectId;
    }

    private String formatHoursMismatch(String key,
                                       int expectedMinutes,
                                       int actualMinutes,
                                       List<ClassGroup> classGroups,
                                       List<Subject> subjects) {
        String[] parts = key.split(":");
        Long classGroupId = Long.parseLong(parts[0]);
        Long subjectId = Long.parseLong(parts[1]);

        String className = classGroups.stream()
                .filter(cg -> Objects.equals(cg.getId(), classGroupId))
                .map(ClassGroup::getName)
                .findFirst()
                .orElse("Classe#" + classGroupId);
        String subjectName = subjects.stream()
                .filter(s -> Objects.equals(s.getId(), subjectId))
                .map(Subject::getName)
                .findFirst()
                .orElse("Matiere#" + subjectId);

        return className + " / " + subjectName + " (attendu=" + expectedMinutes + " min, actuel=" + actualMinutes + " min)";
    }

    private int normalizeSessionDurationMinutes(Integer value) {
        if (value == null || value <= 0) {
            return 60;
        }
        return value;
    }

    private int computeRequiredSessions(Subject subject, int sessionMinutes) {
        int weeklyMinutes = Math.max(0, subject.getHoursPerWeek()) * 60;
        if (weeklyMinutes == 0) {
            return 0;
        }
        if (weeklyMinutes % sessionMinutes != 0) {
            int roundedSessions = (int) Math.ceil(weeklyMinutes / (double) sessionMinutes);
            log.warn("Subject '{}' has non-divisible weekly minutes ({} min) by session duration ({} min); rounding sessions to {}",
                    subject.getName(), weeklyMinutes, sessionMinutes, roundedSessions);
            return roundedSessions;
        }
        return weeklyMinutes / sessionMinutes;
    }

    public SolverStatus getStatus(Long schoolId) {
        return solverManager.getSolverStatus(schoolId);
    }
}
