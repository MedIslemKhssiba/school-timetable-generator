package com.timetable.controller;

import com.timetable.dto.LessonDTO;
import com.timetable.dto.LessonDragDropDTO;
import com.timetable.dto.LessonUpdateDTO;
import com.timetable.dto.TimeslotDayGenerationDTO;
import com.timetable.dto.TimeslotDTO;
import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.DayOfWeek;
import com.timetable.model.Lesson;
import com.timetable.model.Room;
import com.timetable.model.Subject;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.Timeslot;
import com.timetable.repository.LessonRepository;
import com.timetable.repository.RoomRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.repository.TeacherAvailabilityRepository;
import com.timetable.repository.TeacherRepository;
import com.timetable.repository.TimeslotRepository;
import com.timetable.service.ImportExportService;
import com.timetable.service.TimetableDiagnosticsService;
import com.timetable.service.TimetableHistoryService;
import com.timetable.service.TimetableStatisticsService;
import com.timetable.service.TimetableService;
import com.timetable.solver.LessonAssignment;
import com.timetable.solver.TimetableSolution;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.optaplanner.core.api.solver.SolverStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/timetable")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;
    private final ImportExportService importExportService;
    private final LessonRepository lessonRepository;
    private final TimeslotRepository timeslotRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TeacherRepository teacherRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;
    private final TimetableStatisticsService timetableStatisticsService;
    private final TimetableDiagnosticsService timetableDiagnosticsService;
    private final TimetableHistoryService timetableHistoryService;

    @GetMapping("/timeslots")
    public ResponseEntity<List<Timeslot>> getTimeslots() {
        return ResponseEntity.ok(timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc());
    }

    @PostMapping("/timeslots")
    public ResponseEntity<Timeslot> createTimeslot(@Valid @RequestBody TimeslotDTO dto) {
        LocalTime startTime = LocalTime.parse(dto.getStartTime());
        LocalTime endTime = LocalTime.parse(dto.getEndTime());
        LocalTime breakStart = dto.getBreakStartTime() != null && !dto.getBreakStartTime().isBlank()
            ? LocalTime.parse(dto.getBreakStartTime()) : null;
        LocalTime breakEnd = dto.getBreakEndTime() != null && !dto.getBreakEndTime().isBlank()
            ? LocalTime.parse(dto.getBreakEndTime()) : null;
        validateTimeslotRange(startTime, endTime, breakStart, breakEnd);

        Timeslot timeslot = Timeslot.builder()
                .dayOfWeek(DayOfWeek.valueOf(dto.getDayOfWeek()))
            .startTime(startTime)
            .endTime(endTime)
            .breakStartTime(breakStart)
            .breakEndTime(breakEnd)
                .orderInDay(dto.getOrderInDay())
                .build();

        Timeslot saved = timeslotRepository.save(timeslot);
        syncTeachersWithTimeslot(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/timeslots/{id}")
    public ResponseEntity<Timeslot> updateTimeslot(@PathVariable Long id, @Valid @RequestBody TimeslotDTO dto) {
        Timeslot timeslot = timeslotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timeslot not found with id: " + id));

        LocalTime startTime = LocalTime.parse(dto.getStartTime());
        LocalTime endTime = LocalTime.parse(dto.getEndTime());
        LocalTime breakStart = dto.getBreakStartTime() != null && !dto.getBreakStartTime().isBlank()
            ? LocalTime.parse(dto.getBreakStartTime()) : null;
        LocalTime breakEnd = dto.getBreakEndTime() != null && !dto.getBreakEndTime().isBlank()
            ? LocalTime.parse(dto.getBreakEndTime()) : null;
        validateTimeslotRange(startTime, endTime, breakStart, breakEnd);

        timeslot.setDayOfWeek(DayOfWeek.valueOf(dto.getDayOfWeek()));
        timeslot.setStartTime(startTime);
        timeslot.setEndTime(endTime);
        timeslot.setBreakStartTime(breakStart);
        timeslot.setBreakEndTime(breakEnd);
        timeslot.setOrderInDay(dto.getOrderInDay());

        Timeslot saved = timeslotRepository.save(timeslot);
        syncTeachersWithTimeslot(saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/timeslots/generate-day")
    @Transactional
    public ResponseEntity<List<Timeslot>> generateTimeslotsForDay(@Valid @RequestBody TimeslotDayGenerationDTO dto) {
        DayOfWeek dayOfWeek = DayOfWeek.valueOf(dto.getDayOfWeek());
        LocalTime dayStart = LocalTime.parse(dto.getStartTime());
        LocalTime dayEnd = LocalTime.parse(dto.getEndTime());
        LocalTime breakStart = dto.getBreakStartTime() != null && !dto.getBreakStartTime().isBlank()
                ? LocalTime.parse(dto.getBreakStartTime()) : null;
        LocalTime breakEnd = dto.getBreakEndTime() != null && !dto.getBreakEndTime().isBlank()
                ? LocalTime.parse(dto.getBreakEndTime()) : null;

        validateTimeslotRange(dayStart, dayEnd, breakStart, breakEnd);

        List<Timeslot> existingForDay = timeslotRepository.findByDayOfWeekOrderByStartTimeAsc(dayOfWeek);
        if (!existingForDay.isEmpty()) {
            List<Long> timeslotIds = existingForDay.stream().map(Timeslot::getId).collect(Collectors.toList());

            List<Lesson> impactedLessons = lessonRepository.findByTimeslotIdIn(timeslotIds);
            if (!impactedLessons.isEmpty()) {
                for (Lesson lesson : impactedLessons) {
                    lesson.setTimeslot(null);
                }
                lessonRepository.saveAll(impactedLessons);
            }

            List<TeacherAvailability> availabilitiesToDelete = teacherAvailabilityRepository.findByTimeslotIdIn(timeslotIds);
            if (!availabilitiesToDelete.isEmpty()) {
                teacherAvailabilityRepository.deleteAllInBatch(availabilitiesToDelete);
                teacherAvailabilityRepository.flush();
            }
            timeslotRepository.deleteAllInBatch(existingForDay);
            timeslotRepository.flush();
        }

        int slotDurationMinutes = resolveSlotDurationMinutes(dto.getSchoolId());
        int orderInDay = 1;
        List<Timeslot> created = new ArrayList<>();

        orderInDay = appendGeneratedSlots(created, dayOfWeek, dayStart, breakStart != null ? breakStart : dayEnd,
                breakStart, breakEnd, orderInDay, slotDurationMinutes);

        if (breakStart != null && breakEnd != null) {
            appendGeneratedSlots(created, dayOfWeek, breakEnd, dayEnd, breakStart, breakEnd, orderInDay, slotDurationMinutes);
        }

        for (Timeslot timeslot : created) {
            syncTeachersWithTimeslot(timeslot);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/timeslots/{id}")
    public ResponseEntity<Void> deleteTimeslot(@PathVariable Long id) {
        teacherAvailabilityRepository.deleteByTimeslotId(id);
        timeslotRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/timeslots/sync-teachers/{schoolId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> syncTeachersWithTimeslots(@PathVariable Long schoolId) {
        int created = syncTeachersWithAllTimeslots(schoolId);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("created", created);
        payload.put("schoolId", schoolId);
        return ResponseEntity.ok(payload);
    }

    private void validateTimeslotRange(LocalTime startTime, LocalTime endTime, LocalTime breakStart, LocalTime breakEnd) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        if ((breakStart == null) != (breakEnd == null)) {
            throw new IllegalArgumentException("Both break start and break end must be provided together");
        }

        if (breakStart != null) {
            if (!breakStart.isBefore(breakEnd)) {
                throw new IllegalArgumentException("Break start must be before break end");
            }
            if (breakStart.isBefore(startTime) || breakEnd.isAfter(endTime)) {
                throw new IllegalArgumentException("Break interval must be inside the timeslot range");
            }
        }
    }

    private void syncTeachersWithTimeslot(Timeslot timeslot) {
        List<Teacher> teachers = teacherRepository.findAll();
        for (Teacher teacher : teachers) {
            if (!teacherAvailabilityRepository.existsByTeacherIdAndTimeslotId(teacher.getId(), timeslot.getId())) {
                TeacherAvailability ta = TeacherAvailability.builder()
                        .teacher(teacher)
                        .timeslot(timeslot)
                        .available(true)
                        .build();
                teacherAvailabilityRepository.save(ta);
            }
        }
    }

    private int syncTeachersWithAllTimeslots(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
        List<Timeslot> timeslots = timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc();

        int created = 0;
        for (Teacher teacher : teachers) {
            for (Timeslot timeslot : timeslots) {
                if (!teacherAvailabilityRepository.existsByTeacherIdAndTimeslotId(teacher.getId(), timeslot.getId())) {
                    teacherAvailabilityRepository.save(TeacherAvailability.builder()
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

    private int appendGeneratedSlots(List<Timeslot> created,
                                     DayOfWeek dayOfWeek,
                                     LocalTime rangeStart,
                                     LocalTime rangeEnd,
                                     LocalTime breakStart,
                                     LocalTime breakEnd,
                                     int startOrder,
                                     int slotDurationMinutes) {
        LocalTime cursor = rangeStart;
        int order = startOrder;

        while (!cursor.plusMinutes(slotDurationMinutes).isAfter(rangeEnd)) {
            Timeslot timeslot = Timeslot.builder()
                    .dayOfWeek(dayOfWeek)
                    .startTime(cursor)
                    .endTime(cursor.plusMinutes(slotDurationMinutes))
                    .breakStartTime(breakStart)
                    .breakEndTime(breakEnd)
                    .orderInDay(order++)
                    .build();
            created.add(timeslotRepository.save(timeslot));
            cursor = cursor.plusMinutes(slotDurationMinutes);
        }

        return order;
    }

    private int resolveSlotDurationMinutes(Long schoolId) {
        if (schoolId == null) {
            return 60;
        }

        List<Subject> subjects = subjectRepository.findBySchoolId(schoolId);
        if (subjects.isEmpty()) {
            return 60;
        }

        Map<Integer, Long> occurrences = subjects.stream()
                .map(Subject::getSessionDuration)
                .filter(duration -> duration != null && duration >= 30 && duration <= 180)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        if (occurrences.isEmpty()) {
            return 60;
        }

        return occurrences.entrySet().stream()
                .sorted((a, b) -> {
                    int countCompare = Long.compare(b.getValue(), a.getValue());
                    if (countCompare != 0) {
                        return countCompare;
                    }
                    return Integer.compare(a.getKey(), b.getKey());
                })
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(60);
    }

    @PostMapping("/solve/{schoolId}")
    public ResponseEntity<String> solve(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableService.solve(schoolId));
    }

    @GetMapping("/solution/{schoolId}")
    public ResponseEntity<TimetableSolution> getSolution(@PathVariable Long schoolId) {
        TimetableSolution solution = timetableService.getSolution(schoolId);
        if (solution == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(solution);
    }

    @GetMapping("/status/{schoolId}")
    public ResponseEntity<Map<String, Object>> getSolveStatus(@PathVariable Long schoolId) {
        SolverStatus status = timetableService.getStatus(schoolId);
        TimetableSolution solution = timetableService.getSolution(schoolId);
        return ResponseEntity.ok(timetableStatisticsService.buildStatistics(schoolId, status, solution));
    }

    @GetMapping("/statistics/{schoolId}")
    public ResponseEntity<Map<String, Object>> getSolverStatistics(@PathVariable Long schoolId) {
        SolverStatus status = timetableService.getStatus(schoolId);
        TimetableSolution solution = timetableService.getSolution(schoolId);
        return ResponseEntity.ok(timetableStatisticsService.buildStatistics(schoolId, status, solution));
    }

    @GetMapping("/statistics/{schoolId}/export/csv")
    public ResponseEntity<byte[]> exportSolverStatisticsCsv(@PathVariable Long schoolId) {
        SolverStatus status = timetableService.getStatus(schoolId);
        TimetableSolution solution = timetableService.getSolution(schoolId);
        Map<String, Object> statistics = timetableStatisticsService.buildStatistics(schoolId, status, solution);
        String csv = timetableStatisticsService.buildStatisticsCsv(statistics);

        String dateToken = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fileName = "rapport-ecole-statistiques-solveur-school-" + schoolId + "-" + dateToken + ".csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @GetMapping("/history/{schoolId}")
    public ResponseEntity<List<Map<String, Object>>> getTimetableHistory(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableHistoryService.getSchoolHistory(schoolId));
    }

    @GetMapping("/diagnostics/{schoolId}")
    public ResponseEntity<Map<String, Object>> getPreSolveDiagnostics(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableDiagnosticsService.buildDiagnostics(schoolId));
    }

    @PostMapping("/stop/{schoolId}")
    public ResponseEntity<String> stopSolving(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableService.stopSolving(schoolId));
    }

    @PostMapping("/save/{schoolId}")
    public ResponseEntity<List<LessonDTO>> saveSolution(@PathVariable Long schoolId) {
        List<Lesson> lessons = timetableService.saveSolution(schoolId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/lessons/{schoolId}")
    public ResponseEntity<List<LessonDTO>> getLessons(@PathVariable Long schoolId) {
        List<Lesson> lessons = lessonRepository.findBySchoolIdWithDetails(schoolId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/lessons/class/{classGroupId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByClass(@PathVariable Long classGroupId) {
        List<Lesson> lessons = lessonRepository.findByClassGroupIdWithDetails(classGroupId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/lessons/teacher/{teacherId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByTeacher(@PathVariable Long teacherId) {
        List<Lesson> lessons = lessonRepository.findByTeacherIdWithDetails(teacherId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/lessons/{lessonId}")
    @Transactional
    public ResponseEntity<LessonDTO> updateLesson(@PathVariable Long lessonId, @Valid @RequestBody LessonUpdateDTO dto) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + lessonId));

        Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + dto.getTeacherId()));
        Room room = roomRepository.findById(dto.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + dto.getRoomId()));
        Timeslot timeslot = timeslotRepository.findById(dto.getTimeslotId())
                .orElseThrow(() -> new ResourceNotFoundException("Timeslot not found with id: " + dto.getTimeslotId()));

        Subject subject = lesson.getSubject();
        if (subject == null) {
            throw new IllegalStateException("Lesson has no subject assigned");
        }

        Long schoolId = lesson.getSchool() != null ? lesson.getSchool().getId() : null;
        if (schoolId == null) {
            throw new IllegalStateException("Lesson school reference is missing");
        }

        List<Lesson> schoolLessons = lessonRepository.findBySchoolIdWithDetails(schoolId);
        validateLessonPlacement(lesson, teacher, room, timeslot, schoolLessons, java.util.Set.of(lesson.getId()));

        lesson.setTeacher(teacher);
        lesson.setRoom(room);
        lesson.setTimeslot(timeslot);
        Lesson saved = lessonRepository.save(lesson);
        return ResponseEntity.ok(toLessonDTO(saved));
    }

    @PutMapping("/lessons/{lessonId}/move")
    @Transactional
    public ResponseEntity<List<LessonDTO>> moveOrSwapLesson(@PathVariable Long lessonId,
                                                             @Valid @RequestBody LessonDragDropDTO dto) {
        Lesson source = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found with id: " + lessonId));
        Timeslot targetTimeslot = timeslotRepository.findById(dto.getTargetTimeslotId())
                .orElseThrow(() -> new ResourceNotFoundException("Timeslot not found with id: " + dto.getTargetTimeslotId()));

        Long schoolId = source.getSchool() != null ? source.getSchool().getId() : null;
        if (schoolId == null) {
            throw new IllegalStateException("Lesson school reference is missing");
        }

        Lesson targetLesson = null;
        if (dto.getTargetLessonId() != null) {
            targetLesson = lessonRepository.findById(dto.getTargetLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target lesson not found with id: " + dto.getTargetLessonId()));
            Long targetSchoolId = targetLesson.getSchool() != null ? targetLesson.getSchool().getId() : null;
            if (!schoolId.equals(targetSchoolId)) {
                throw new IllegalStateException("Target lesson belongs to a different school");
            }
        }

        List<Lesson> schoolLessons = lessonRepository.findBySchoolIdWithDetails(schoolId);

        Timeslot originalSourceTimeslot = source.getTimeslot();
        Room originalSourceRoom = source.getRoom();

        if (targetLesson != null) {
            Timeslot originalTargetTimeslot = targetLesson.getTimeslot();
            Room originalTargetRoom = targetLesson.getRoom();

            source.setTimeslot(originalTargetTimeslot != null ? originalTargetTimeslot : targetTimeslot);
            source.setRoom(originalTargetRoom);
            targetLesson.setTimeslot(originalSourceTimeslot);
            targetLesson.setRoom(originalSourceRoom);

            validateLessonPlacement(source, source.getTeacher(), source.getRoom(), source.getTimeslot(), schoolLessons,
                    java.util.Set.of(source.getId(), targetLesson.getId()));
            validateLessonPlacement(targetLesson, targetLesson.getTeacher(), targetLesson.getRoom(), targetLesson.getTimeslot(), schoolLessons,
                    java.util.Set.of(source.getId(), targetLesson.getId()));

            Lesson savedSource = lessonRepository.save(source);
            Lesson savedTarget = lessonRepository.save(targetLesson);
            return ResponseEntity.ok(List.of(toLessonDTO(savedSource), toLessonDTO(savedTarget)));
        }

        source.setTimeslot(targetTimeslot);
        validateLessonPlacement(source, source.getTeacher(), source.getRoom(), source.getTimeslot(), schoolLessons,
                java.util.Set.of(source.getId()));
        Lesson savedSource = lessonRepository.save(source);
        return ResponseEntity.ok(List.of(toLessonDTO(savedSource)));
    }

    private void validateLessonPlacement(Lesson lesson,
                                         Teacher teacher,
                                         Room room,
                                         Timeslot timeslot,
                                         List<Lesson> schoolLessons,
                                         java.util.Set<Long> ignoreLessonIds) {
        if (lesson.getSubject() == null) {
            throw new IllegalStateException("Lesson has no subject assigned");
        }
        if (teacher == null) {
            throw new IllegalStateException("Enseignant manquant sur le cours");
        }
        if (room == null) {
            throw new IllegalStateException("Salle manquante sur le cours");
        }
        if (timeslot == null) {
            throw new IllegalStateException("Creneau manquant sur le cours");
        }

        Subject subject = lesson.getSubject();
        if (teacher.getSubjects() == null || teacher.getSubjects().stream().noneMatch(s -> s.getId().equals(subject.getId()))) {
            throw new IllegalStateException("Enseignant non qualifie pour la matiere " + subject.getName());
        }

        int slotMinutes = (int) Duration.between(timeslot.getStartTime(), timeslot.getEndTime()).toMinutes();
        int sessionMinutes = Math.max(1, subject.getSessionDuration());
        if (slotMinutes < sessionMinutes) {
            throw new IllegalStateException("Creneau incompatible: " + slotMinutes + " min < session " + sessionMinutes + " min");
        }

        if (lesson.getClassGroup() != null && room.getCapacity() < lesson.getClassGroup().getStudentCount()) {
            throw new IllegalStateException("Salle " + room.getName() + " trop petite pour la classe " + lesson.getClassGroup().getName());
        }

        String requiredRoomType = subject.getRequiredRoomType();
        if (requiredRoomType != null && !requiredRoomType.isBlank()) {
            String required = requiredRoomType.trim().toUpperCase();
            String provided = room.getType() == null ? "" : room.getType().trim().toUpperCase();
            if (!required.equals(provided)) {
                throw new IllegalStateException("Salle incompatible: type requis " + requiredRoomType + ", type salle " + room.getType());
            }
        }

        List<TeacherAvailability> availabilityEntries = teacherAvailabilityRepository.findByTeacherIdAndTimeslotId(teacher.getId(), timeslot.getId());
        if (availabilityEntries.isEmpty() || availabilityEntries.stream().noneMatch(TeacherAvailability::isAvailable)) {
            throw new IllegalStateException("Enseignant indisponible sur ce creneau");
        }

        for (Lesson other : schoolLessons) {
            if (other.getId() == null || ignoreLessonIds.contains(other.getId()) || other.getTimeslot() == null) {
                continue;
            }
            if (!other.getTimeslot().getId().equals(timeslot.getId())) {
                continue;
            }

            if (other.getTeacher() != null && other.getTeacher().getId().equals(teacher.getId())) {
                throw new IllegalStateException("Conflit enseignant: deja occupe sur ce creneau");
            }
            if (other.getRoom() != null && other.getRoom().getId().equals(room.getId())) {
                throw new IllegalStateException("Conflit salle: deja occupee sur ce creneau");
            }
            if (other.getClassGroup() != null && lesson.getClassGroup() != null
                    && other.getClassGroup().getId().equals(lesson.getClassGroup().getId())) {
                throw new IllegalStateException("Conflit classe: deja occupee sur ce creneau");
            }
        }
    }

    @GetMapping("/export/{schoolId}")
    public ResponseEntity<byte[]> exportTimetable(@PathVariable Long schoolId) throws IOException {
        TimetableSolution solution = timetableService.getSolution(schoolId);
        List<LessonAssignment> fallbackAssignments = solution != null && solution.getLessonAssignments() != null
            ? solution.getLessonAssignments().stream()
            .filter(assignment -> assignment.getTimeslot() != null && assignment.getRoom() != null)
            .sorted(Comparator
                .comparing((LessonAssignment la) -> la.getTimeslot().getDayOfWeek().ordinal())
                .thenComparing(la -> la.getTimeslot().getStartTime()))
            .toList()
            : List.of();

        byte[] excelData = importExportService.exportTimetableExcel(schoolId, fallbackAssignments);
        String dateToken = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String fileName = "emploi-du-temps-ecole-export-school-" + schoolId + "-" + dateToken + ".xlsx";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(excelData);
    }

    private LessonDTO toLessonDTO(Lesson lesson) {
        LessonDTO dto = new LessonDTO();
        dto.setId(lesson.getId());
        dto.setSubjectId(lesson.getSubject() != null ? lesson.getSubject().getId() : null);
        dto.setSubjectName(lesson.getSubject() != null ? lesson.getSubject().getName() : "");
        dto.setTeacherId(lesson.getTeacher() != null ? lesson.getTeacher().getId() : null);
        dto.setTeacherName(lesson.getTeacher() != null ? lesson.getTeacher().getFirstName() + " " + lesson.getTeacher().getLastName() : "");
        dto.setClassGroupId(lesson.getClassGroup() != null ? lesson.getClassGroup().getId() : null);
        dto.setClassGroupName(lesson.getClassGroup() != null ? lesson.getClassGroup().getName() : "");
        dto.setRoomId(lesson.getRoom() != null ? lesson.getRoom().getId() : null);
        dto.setRoomName(lesson.getRoom() != null ? lesson.getRoom().getName() : "");
        dto.setTimeslotId(lesson.getTimeslot() != null ? lesson.getTimeslot().getId() : null);
        dto.setDayOfWeek(lesson.getTimeslot() != null ? lesson.getTimeslot().getDayOfWeek().name() : "");
        dto.setStartTime(lesson.getTimeslot() != null ? lesson.getTimeslot().getStartTime().toString() : "");
        dto.setEndTime(lesson.getTimeslot() != null ? lesson.getTimeslot().getEndTime().toString() : "");
        dto.setSessionDurationMinutes(lesson.getSubject() != null ? lesson.getSubject().getSessionDuration() : null);
        dto.setTimeslotDurationMinutes(lesson.getTimeslot() != null
            ? (int) java.time.Duration.between(lesson.getTimeslot().getStartTime(), lesson.getTimeslot().getEndTime()).toMinutes()
            : null);
        return dto;
    }
}
