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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

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
        if (solverManager.getSolverStatus(schoolId) != SolverStatus.NOT_SOLVING) {
            return "Solving already in progress for school " + schoolId;
        }

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

        Map<Long, List<Teacher>> teachersBySubject = new HashMap<>();
        for (Teacher t : teachers) {
            for (Subject s : t.getSubjects()) {
                teachersBySubject.computeIfAbsent(s.getId(), k -> new ArrayList<>()).add(t);
            }
        }

        Map<Long, Integer> teacherLoad = new HashMap<>();
        teachers.forEach(t -> teacherLoad.put(t.getId(), 0));

        List<LessonAssignment> assignments = new ArrayList<>();
        long assignmentId = 1;
        for (ClassGroup cg : classGroups) {
            List<Subject> subjectsForClass = subjects.stream()
                    .filter(subject -> isSubjectApplicableToClassLevel(subject, cg))
                    .toList();

            for (Subject subject : subjectsForClass) {
                for (int i = 0; i < subject.getHoursPerWeek(); i++) {
                    List<Teacher> qualified = teachersBySubject.getOrDefault(subject.getId(), List.of());

                    Teacher assignedTeacher = qualified.stream()
                            .min(Comparator.comparingInt(t -> teacherLoad.getOrDefault(t.getId(), 0)))
                            .orElse(null);

                    if (assignedTeacher == null) {
                        assignedTeacher = teachers.stream()
                                .min(Comparator.comparingInt(t -> teacherLoad.getOrDefault(t.getId(), 0)))
                                .orElse(null);

                        if (assignedTeacher != null) {
                            log.warn("No mapped teacher for subject '{}' in school {}. Using fallback teacher {} {}.",
                                    subject.getName(), schoolId, assignedTeacher.getFirstName(), assignedTeacher.getLastName());
                        }
                    }

                    if (assignedTeacher != null) {
                        LessonAssignment la = new LessonAssignment();
                        la.setId(assignmentId++);
                        la.setSubject(subject);
                        la.setTeacher(assignedTeacher);
                        la.setClassGroup(cg);
                        la.setSchoolId(schoolId);
                        assignments.add(la);
                        teacherLoad.merge(assignedTeacher.getId(), 1, Integer::sum);
                    }
                }
            }
        }

        if (assignments.isEmpty()) {
            throw new IllegalStateException("No lesson assignments could be generated. Check teacher-subject mappings.");
        }

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

        solverManager.solveAndListen(schoolId, id -> problem,
                solution -> solutionMap.put(schoolId, solution));

        log.info("Solving started for school {} with {} assignments, {} timeslots, {} rooms",
                schoolId, assignments.size(), timeslots.size(), rooms.size());
        return "Solving started for school " + schoolId;
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

    private boolean isSubjectApplicableToClassLevel(Subject subject, ClassGroup classGroup) {
        String subjectLevel = normalizeLevel(subject.getLevel());
        String classLevel = normalizeLevel(classGroup.getLevel());

        if (subjectLevel.isEmpty()) {
            return true;
        }
        if (classLevel.isEmpty()) {
            return false;
        }

        return subjectLevel.equals(classLevel);
    }

    private String normalizeLevel(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        Matcher matcher = Pattern.compile("(\\d+)").matcher(normalized);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return normalized;
    }
}
