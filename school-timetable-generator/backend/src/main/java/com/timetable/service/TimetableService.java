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
        long assignmentId = 1;
        for (ClassGroup cg : classGroups) {
            for (Subject subject : subjects) {
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
                        log.warn("No teacher found for subject '{}' in school {}", subject.getName(), schoolId);
                    }
                }
            }
        }

        if (assignments.isEmpty()) {
            throw new IllegalStateException("No lesson assignments could be generated. Check teacher-subject mappings.");
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
