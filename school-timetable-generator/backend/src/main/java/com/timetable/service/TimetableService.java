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

    private final Map<Long, TimetableSolution> solutionMap = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public String solve(Long schoolId) {
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

        // Track assigned hours per teacher for load balancing
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
                for (int i = 0; i < subject.getHoursPerWeek(); i++) {
                    List<Teacher> qualified = teachersBySubject.getOrDefault(subject.getId(), List.of());

                    // Pick the teacher with the least load (round-robin balancing)
                    Teacher assignedTeacher = qualified.stream()
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
                        teacherLoad.merge(assignedTeacher.getId(), 1, Integer::sum);
                    } else {
                        String missing = String.format("Classe '%s' / Matiere '%s'", cg.getName(), subject.getName());
                        missingCoverage.add(missing);
                        log.warn("No teacher found for {} in school {}", missing, schoolId);
                    }
                }
            }
        }

        if (!missingCoverage.isEmpty()) {
            String details = missingCoverage.stream()
                    .limit(10)
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException("Generation impossible: enseignants manquants pour "
                    + missingCoverage.size() + " affectation(s). Exemples: " + details);
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
            log.warn("No lesson assignments generated for school {}. Returning empty timetable.", schoolId);
            return "No lesson assignments generated for school " + schoolId + ". Timetable is empty.";
        }

        solverManager.solveAndListen(schoolId, id -> problem,
                solution -> solutionMap.put(schoolId, solution));

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
        return "Solving stopped for school " + schoolId;
    }

    @Transactional
    public List<Lesson> saveSolution(Long schoolId) {
        TimetableSolution solution = solutionMap.get(schoolId);
        if (solution == null) {
            throw new ResourceNotFoundException("No solution found for school " + schoolId);
        }

        long unassigned = solution.getLessonAssignments().stream()
                .filter(la -> la.getTimeslot() == null || la.getRoom() == null)
                .count();
        if (unassigned > 0) {
            throw new IllegalStateException("Le planning est incomplet: " + unassigned + " cours non assignes."
                    + " Veuillez relancer la generation avant sauvegarde.");
        }

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
        log.info("Saved {} lessons for school {}", saved.size(), schoolId);
        return saved;
    }

    public SolverStatus getStatus(Long schoolId) {
        return solverManager.getSolverStatus(schoolId);
    }
}
