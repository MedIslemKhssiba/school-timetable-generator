package com.timetable.service;

import com.timetable.model.ClassGroup;
import com.timetable.model.Room;
import com.timetable.model.Subject;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.Timeslot;
import com.timetable.repository.ClassGroupRepository;
import com.timetable.repository.RoomRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.repository.TeacherAvailabilityRepository;
import com.timetable.repository.TeacherRepository;
import com.timetable.repository.TimeslotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableDiagnosticsService {

    private final TeacherRepository teacherRepository;
    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TimeslotRepository timeslotRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;

    public Map<String, Object> buildDiagnostics(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findWithSubjectsBySchoolId(schoolId);
        List<ClassGroup> classes = classGroupRepository.findBySchoolId(schoolId);
        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);
        List<Room> rooms = roomRepository.findBySchoolId(schoolId);
        List<Timeslot> timeslots = timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc();

        List<String> blockingIssues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (teachers.isEmpty()) {
            blockingIssues.add("No teachers found for school " + schoolId);
            suggestions.add("Add teachers and assign them to subjects.");
        }
        if (classes.isEmpty()) {
            blockingIssues.add("No classes found for school " + schoolId);
            suggestions.add("Add at least one class group.");
        }
        if (subjects.isEmpty()) {
            blockingIssues.add("No subjects found for school " + schoolId);
            suggestions.add("Add subjects with valid weekly hours.");
        }
        if (rooms.isEmpty()) {
            blockingIssues.add("No rooms found for school " + schoolId);
            suggestions.add("Add at least one room with valid capacity/type.");
        }
        if (timeslots.isEmpty()) {
            blockingIssues.add("No timeslots configured.");
            suggestions.add("Generate weekly timeslots before solving.");
        }

        List<Subject> invalidSubjects = subjects.stream()
                .filter(s -> s.getHoursPerWeek() <= 0)
                .toList();
        if (!invalidSubjects.isEmpty()) {
            blockingIssues.add(invalidSubjects.size() + " subject(s) have non-positive hoursPerWeek.");
            suggestions.add("Set hoursPerWeek > 0 for every subject.");
        }

        Set<Long> taughtSubjectIds = teachers.stream()
                .flatMap(t -> t.getSubjects() == null ? java.util.stream.Stream.empty() : t.getSubjects().stream())
                .map(Subject::getId)
                .collect(Collectors.toSet());

        List<Subject> subjectsWithoutTeachers = subjects.stream()
                .filter(subject -> !taughtSubjectIds.contains(subject.getId()))
                .toList();
        if (!subjectsWithoutTeachers.isEmpty()) {
            blockingIssues.add(subjectsWithoutTeachers.size() + " subject(s) have no qualified teacher.");
            suggestions.add("Assign at least one teacher to every subject.");
        }

        List<String> teacherOverloadGaps = simulateTeacherCapacityGaps(teachers, classes, subjects);
        if (!teacherOverloadGaps.isEmpty()) {
            String sample = teacherOverloadGaps.stream().limit(8).collect(Collectors.joining(" | "));
            blockingIssues.add("Insufficient teacher weekly capacity for " + teacherOverloadGaps.size() + " assignment(s): " + sample);
            suggestions.add("Increase maxHoursPerWeek for overloaded teachers or add additional qualified teachers.");
        }

        for (ClassGroup classGroup : classes) {
            int expectedHours = subjects.stream()
                    .filter(subject -> subjectMatchesClassLevel(subject.getLevel(), classGroup.getLevel()))
                    .mapToInt(Subject::getHoursPerWeek)
                    .sum();

            if (expectedHours > timeslots.size()) {
                blockingIssues.add("Class " + classGroup.getName() + " needs " + expectedHours
+                        " lessons but only " + timeslots.size() + " timeslots are available.");
                suggestions.add("Increase timeslots or reduce weekly subject hours for class " + classGroup.getName() + ".");
            }

            boolean hasCapacityRoom = rooms.stream().anyMatch(room -> room.getCapacity() >= classGroup.getStudentCount());
            if (!hasCapacityRoom) {
                blockingIssues.add("Class " + classGroup.getName() + " has no room with enough capacity (" + classGroup.getStudentCount() + ").");
                suggestions.add("Add a bigger room or reduce class size for " + classGroup.getName() + ".");
            }
        }

        for (Subject subject : subjects) {
            String requiredType = normalize(subject.getRequiredRoomType());
            if (!requiredType.isBlank()) {
                boolean roomTypeExists = rooms.stream()
                        .map(Room::getType)
                        .map(this::normalize)
                        .anyMatch(type -> type.equals(requiredType));
                if (!roomTypeExists) {
                    blockingIssues.add("No room found for required type '" + subject.getRequiredRoomType() + "' (subject " + subject.getName() + ").");
                    suggestions.add("Add room type " + subject.getRequiredRoomType() + " or relax subject room requirement for " + subject.getName() + ".");
                }
            }
        }

        long missingAvailability = teachers.stream()
                .mapToLong(teacher -> {
                    List<TeacherAvailability> availabilities = teacherAvailabilityRepository.findByTeacherId(teacher.getId());
                    return Math.max(0, timeslots.size() - availabilities.size());
                })
                .sum();

        if (missingAvailability > 0) {
            warnings.add("Some teacher availability records are missing (" + missingAvailability + " missing entries).");
            suggestions.add("Synchronize teachers with timeslots before solving.");
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("teachers", teachers.size());
        summary.put("classes", classes.size());
        summary.put("subjects", subjects.size());
        summary.put("rooms", rooms.size());
        summary.put("timeslots", timeslots.size());
        summary.put("blockingIssues", blockingIssues.size());
        summary.put("warnings", warnings.size());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schoolId", schoolId);
        payload.put("ready", blockingIssues.isEmpty());
        payload.put("blockingIssues", blockingIssues);
        payload.put("warnings", warnings);
        payload.put("suggestions", suggestions.stream().distinct().toList());
        payload.put("summary", summary);

        return payload;
    }

    public void assertReadyForSolve(Long schoolId) {
        Map<String, Object> diagnostics = buildDiagnostics(schoolId);
        boolean ready = Boolean.TRUE.equals(diagnostics.get("ready"));
        if (ready) {
            return;
        }

        @SuppressWarnings("unchecked")
        List<String> blockingIssues = (List<String>) diagnostics.getOrDefault("blockingIssues", List.of());
        String details = blockingIssues.stream().limit(8).collect(Collectors.joining(" | "));
        throw new IllegalStateException("Generation impossible: pre-solve diagnostics failed. " + details);
    }

    private boolean subjectMatchesClassLevel(String subjectLevel, String classLevel) {
        String s = normalize(subjectLevel);
        String c = normalize(classLevel);
        if (s.isBlank()) {
            return true;
        }
        if (c.isBlank()) {
            return false;
        }

        Integer sn = extractFirstNumber(s);
        Integer cn = extractFirstNumber(c);
        if (sn != null && cn != null) {
            return sn.equals(cn);
        }
        return s.equals(c);
    }

    private Integer extractFirstNumber(String value) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\d+").matcher(value);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Integer.parseInt(matcher.group());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private List<String> simulateTeacherCapacityGaps(List<Teacher> teachers, List<ClassGroup> classes, List<Subject> subjects) {
        Map<Long, List<Teacher>> teachersBySubject = new LinkedHashMap<>();
        for (Teacher teacher : teachers) {
            if (teacher.getSubjects() == null) {
                continue;
            }
            for (Subject subject : teacher.getSubjects()) {
                teachersBySubject.computeIfAbsent(subject.getId(), key -> new ArrayList<>()).add(teacher);
            }
        }

        Map<Long, Integer> teacherLoad = new LinkedHashMap<>();
        for (Teacher teacher : teachers) {
            teacherLoad.put(teacher.getId(), 0);
        }

        List<String> missing = new ArrayList<>();
        for (ClassGroup classGroup : classes) {
            for (Subject subject : subjects) {
                if (!subjectMatchesClassLevel(subject.getLevel(), classGroup.getLevel())) {
                    continue;
                }

                for (int i = 0; i < subject.getHoursPerWeek(); i++) {
                    Teacher candidate = teachersBySubject.getOrDefault(subject.getId(), List.of()).stream()
                            .filter(t -> teacherLoad.getOrDefault(t.getId(), 0) < t.getMaxHoursPerWeek())
                            .min(java.util.Comparator.comparingInt(t -> teacherLoad.getOrDefault(t.getId(), 0)))
                            .orElse(null);

                    if (candidate == null) {
                        missing.add("Class " + classGroup.getName() + " / Subject " + subject.getName());
                    } else {
                        teacherLoad.merge(candidate.getId(), 1, Integer::sum);
                    }
                }
            }
        }

        return missing;
    }
}
