package com.timetable.controller;

import com.timetable.dto.LessonDTO;
import com.timetable.dto.TimeslotDayGenerationDTO;
import com.timetable.dto.TimeslotDTO;
import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.DayOfWeek;
import com.timetable.model.Lesson;
import com.timetable.model.Subject;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.Timeslot;
import com.timetable.repository.LessonRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.repository.TeacherAvailabilityRepository;
import com.timetable.repository.TeacherRepository;
import com.timetable.repository.TimeslotRepository;
import com.timetable.service.ImportExportService;
import com.timetable.service.TimetableService;
import com.timetable.solver.TimetableSolution;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
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
    private final TeacherRepository teacherRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;

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

    @PostMapping("/timeslots/copy-monday-to-week")
    @Transactional
    public ResponseEntity<List<Timeslot>> copyMondayToRestDays() {
        List<Timeslot> mondaySlots = timeslotRepository.findByDayOfWeekOrderByStartTimeAsc(DayOfWeek.MONDAY);
        if (mondaySlots.isEmpty()) {
            throw new IllegalStateException("No Monday timeslots found to copy.");
        }

        List<DayOfWeek> targetDays = EnumSet.of(
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY,
                DayOfWeek.SATURDAY
        ).stream().toList();

        for (DayOfWeek targetDay : targetDays) {
            List<Timeslot> existingForDay = timeslotRepository.findByDayOfWeekOrderByStartTimeAsc(targetDay);
            if (!existingForDay.isEmpty()) {
                List<Long> ids = existingForDay.stream().map(Timeslot::getId).toList();
                List<Lesson> impactedLessons = lessonRepository.findByTimeslotIdIn(ids);
                if (!impactedLessons.isEmpty()) {
                    for (Lesson lesson : impactedLessons) {
                        lesson.setTimeslot(null);
                    }
                    lessonRepository.saveAll(impactedLessons);
                    lessonRepository.flush();
                }

                teacherAvailabilityRepository.deleteByTimeslotIdIn(ids);
                teacherAvailabilityRepository.flush();
                timeslotRepository.deleteAllInBatch(existingForDay);
                timeslotRepository.flush();
            }

            for (Timeslot mondaySlot : mondaySlots) {
                Timeslot newSlot = Timeslot.builder()
                        .dayOfWeek(targetDay)
                        .startTime(mondaySlot.getStartTime())
                        .endTime(mondaySlot.getEndTime())
                        .breakStartTime(mondaySlot.getBreakStartTime())
                        .breakEndTime(mondaySlot.getBreakEndTime())
                        .orderInDay(mondaySlot.getOrderInDay())
                        .build();
                Timeslot saved = timeslotRepository.save(newSlot);
                syncTeachersWithTimeslot(saved);
            }
        }

        return ResponseEntity.ok(timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc());
    }

    @DeleteMapping("/timeslots/{id}")
    @Transactional
    public ResponseEntity<Void> deleteTimeslot(@PathVariable Long id) {
        List<Lesson> impactedLessons = lessonRepository.findByTimeslotIdIn(List.of(id));
        if (!impactedLessons.isEmpty()) {
            for (Lesson lesson : impactedLessons) {
                lesson.setTimeslot(null);
            }
            lessonRepository.saveAll(impactedLessons);
            lessonRepository.flush();
        }

        teacherAvailabilityRepository.deleteByTimeslotId(id);
        teacherAvailabilityRepository.flush();
        timeslotRepository.deleteById(id);
        timeslotRepository.flush();
        return ResponseEntity.noContent().build();
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

    @GetMapping("/status/{schoolId}")
    public ResponseEntity<Map<String, String>> getSolveStatus(@PathVariable Long schoolId) {
        Map<String, String> response = new HashMap<>();
        response.put("status", timetableService.getStatus(schoolId).name());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/solution/{schoolId}")
    public ResponseEntity<TimetableSolution> getSolution(@PathVariable Long schoolId) {
        TimetableSolution solution = timetableService.getSolution(schoolId);
        if (solution == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(solution);
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

    @PostMapping("/share/{schoolId}")
    public ResponseEntity<List<LessonDTO>> shareWithTeachers(@PathVariable Long schoolId) {
        List<Lesson> lessons;
        try {
            lessons = timetableService.saveSolution(schoolId);
        } catch (ResourceNotFoundException ex) {
            lessons = lessonRepository.findBySchoolIdWithDetails(schoolId);
            if (lessons.isEmpty()) {
                throw ex;
            }
        }
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

    @GetMapping("/export/{schoolId}")
    public ResponseEntity<byte[]> exportTimetable(@PathVariable Long schoolId) throws IOException {
        byte[] excelData = importExportService.exportTimetableExcel(schoolId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=timetable.xlsx")
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
        return dto;
    }
}
