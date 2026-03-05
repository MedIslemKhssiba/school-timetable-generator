package com.timetable.controller;

import com.timetable.dto.TeacherDTO;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.Timeslot;
import com.timetable.dto.AvailabilityDTO;
import com.timetable.repository.TeacherAvailabilityRepository;
import com.timetable.repository.TimeslotRepository;
import com.timetable.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/admin/teachers")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;
    private final TeacherAvailabilityRepository availabilityRepository;
    private final TimeslotRepository timeslotRepository;

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<Teacher>> getTeachers(@PathVariable Long schoolId) {
        return ResponseEntity.ok(teacherService.getTeachersBySchool(schoolId));
    }

    @PostMapping
    public ResponseEntity<Teacher> createTeacher(@RequestBody TeacherDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teacherService.createTeacher(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable Long id, @RequestBody TeacherDTO dto) {
        return ResponseEntity.ok(teacherService.updateTeacher(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }

    // --- Availability ---

    @GetMapping("/{teacherId}/availabilities")
    public ResponseEntity<List<TeacherAvailability>> getAvailabilities(@PathVariable Long teacherId) {
        return ResponseEntity.ok(availabilityRepository.findByTeacherId(teacherId));
    }

    @PutMapping("/{teacherId}/availabilities")
    @Transactional
    public ResponseEntity<List<TeacherAvailability>> updateAvailabilities(
            @PathVariable Long teacherId,
            @RequestBody List<AvailabilityDTO> dtos) {

        Teacher teacher = teacherService.getTeacherById(teacherId);
        availabilityRepository.deleteByTeacherId(teacherId);

        List<TeacherAvailability> saved = new ArrayList<>();
        for (AvailabilityDTO dto : dtos) {
            Timeslot timeslot = timeslotRepository.findById(dto.getTimeslotId())
                    .orElseThrow(() -> new RuntimeException("Timeslot not found"));
            TeacherAvailability ta = TeacherAvailability.builder()
                    .teacher(teacher)
                    .timeslot(timeslot)
                    .available(dto.isAvailable())
                    .build();
            saved.add(availabilityRepository.save(ta));
        }
        return ResponseEntity.ok(saved);
    }
}
