package com.timetable.controller;

import com.timetable.dto.LessonDTO;
import com.timetable.model.Lesson;
import com.timetable.repository.LessonRepository;
import com.timetable.service.ImportExportService;
import com.timetable.service.TimetableService;
import com.timetable.solver.TimetableSolution;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/timetable")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;
    private final ImportExportService importExportService;
    private final LessonRepository lessonRepository;

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

    @PostMapping("/stop/{schoolId}")
    public ResponseEntity<String> stopSolving(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableService.stopSolving(schoolId));
    }

    @PostMapping("/save/{schoolId}")
    public ResponseEntity<List<Lesson>> saveSolution(@PathVariable Long schoolId) {
        return ResponseEntity.ok(timetableService.saveSolution(schoolId));
    }

    @GetMapping("/lessons/{schoolId}")
    public ResponseEntity<List<LessonDTO>> getLessons(@PathVariable Long schoolId) {
        List<Lesson> lessons = lessonRepository.findBySchoolId(schoolId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/lessons/class/{classGroupId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByClass(@PathVariable Long classGroupId) {
        List<Lesson> lessons = lessonRepository.findByClassGroupId(classGroupId);
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/lessons/teacher/{teacherId}")
    public ResponseEntity<List<LessonDTO>> getLessonsByTeacher(@PathVariable Long teacherId) {
        List<Lesson> lessons = lessonRepository.findByTeacherId(teacherId);
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
