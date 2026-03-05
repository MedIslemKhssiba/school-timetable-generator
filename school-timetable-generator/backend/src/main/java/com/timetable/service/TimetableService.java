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

    public String solve(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
        List<ClassGroup> classGroups = classGroupRepository.findBySchoolId(schoolId);
        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);
        List<Room> rooms = roomRepository.findBySchoolId(schoolId);
        List<Timeslot> timeslots = timeslotRepository.findAll();

        // Build lesson assignments from subjects and class groups
        List<LessonAssignment> assignments = new ArrayList<>();
        long assignmentId = 1;
        for (ClassGroup cg : classGroups) {
            for (Subject subject : subjects) {
                for (int i = 0; i < subject.getHoursPerWeek(); i++) {
                    // Find a teacher who teaches this subject
                    Teacher assignedTeacher = teachers.stream()
                            .filter(t -> t.getSubjects().stream().anyMatch(s -> s.getId().equals(subject.getId())))
                            .findFirst()
                            .orElse(teachers.isEmpty() ? null : teachers.get(0));

                    if (assignedTeacher != null) {
                        LessonAssignment la = new LessonAssignment();
                        la.setId(assignmentId++);
                        la.setSubject(subject);
                        la.setTeacher(assignedTeacher);
                        la.setClassGroup(cg);
                        la.setSchoolId(schoolId);
                        assignments.add(la);
                    }
                }
            }
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

        // Clear existing lessons
        lessonRepository.deleteAll(lessonRepository.findBySchoolId(schoolId));

        List<Lesson> saved = new ArrayList<>();
        for (LessonAssignment la : solution.getLessonAssignments()) {
            if (la.getTimeslot() != null && la.getRoom() != null) {
                Lesson lesson = Lesson.builder()
                        .subject(la.getSubject())
                        .teacher(la.getTeacher())
                        .classGroup(la.getClassGroup())
                        .room(la.getRoom())
                        .timeslot(la.getTimeslot())
                        .school(School.builder().id(schoolId).build())
                        .build();
                saved.add(lessonRepository.save(lesson));
            }
        }
        return saved;
    }

    public SolverStatus getStatus(Long schoolId) {
        return solverManager.getSolverStatus(schoolId);
    }
}
