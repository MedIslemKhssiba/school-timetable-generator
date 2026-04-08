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
import java.util.Map;

@RestController
@RequestMapping("/admin/teachers")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;
    private final TeacherAvailabilityRepository availabilityRepository;
    private final TimeslotRepository timeslotRepository;

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<TeacherDTO>> getTeachers(@PathVariable Long schoolId) {
        return ResponseEntity.ok(teacherService.getTeachersBySchool(schoolId));
    }

    @PostMapping
    public ResponseEntity<TeacherDTO> createTeacher(@RequestBody TeacherDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teacherService.createTeacher(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeacherDTO> updateTeacher(@PathVariable Long id, @RequestBody TeacherDTO dto) {
        return ResponseEntity.ok(teacherService.updateTeacher(id, dto));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> updateTeacherPassword(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        teacherService.updateTeacherPassword(id, payload.get("newPassword"));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable Long id) {
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }

    // --- Availability ---

    @GetMapping("/{teacherId}/availabilities")
    public ResponseEntity<List<AvailabilityDTO>> getAvailabilities(@PathVariable Long teacherId) {
        Teacher teacher = teacherService.getTeacherById(teacherId);
        List<Timeslot> allTimeslots = timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc();
        for (Timeslot timeslot : allTimeslots) {
            if (!availabilityRepository.existsByTeacherIdAndTimeslotId(teacherId, timeslot.getId())) {
                TeacherAvailability ta = TeacherAvailability.builder()
                        .teacher(teacher)
                        .timeslot(timeslot)
                        .available(true)
                        .build();
                availabilityRepository.save(ta);
            }
        }

        List<TeacherAvailability> avails = availabilityRepository.findByTeacherId(teacherId);
        List<AvailabilityDTO> dtos = avails.stream().map(a -> {
            AvailabilityDTO dto = new AvailabilityDTO();
            dto.setId(a.getId());
            dto.setTeacherId(teacherId);
            dto.setTimeslotId(a.getTimeslot() != null ? a.getTimeslot().getId() : null);
            dto.setAvailable(a.isAvailable());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{teacherId}/availabilities")
    @Transactional
    public ResponseEntity<List<AvailabilityDTO>> updateAvailabilities(
            @PathVariable Long teacherId,
            @RequestBody List<AvailabilityDTO> dtos) {

        Teacher teacher = teacherService.getTeacherById(teacherId);
        availabilityRepository.deleteByTeacherId(teacherId);

        List<AvailabilityDTO> result = new ArrayList<>();
        for (AvailabilityDTO dto : dtos) {
            Timeslot timeslot = timeslotRepository.findById(dto.getTimeslotId())
                    .orElseThrow(() -> new RuntimeException("Timeslot not found"));
            TeacherAvailability ta = TeacherAvailability.builder()
                    .teacher(teacher)
                    .timeslot(timeslot)
                    .available(dto.isAvailable())
                    .build();
            TeacherAvailability saved = availabilityRepository.save(ta);
            AvailabilityDTO rDto = new AvailabilityDTO();
            rDto.setId(saved.getId());
            rDto.setTeacherId(teacherId);
            rDto.setTimeslotId(timeslot.getId());
            rDto.setAvailable(saved.isAvailable());
            result.add(rDto);
        }
        return ResponseEntity.ok(result);
    }
}
