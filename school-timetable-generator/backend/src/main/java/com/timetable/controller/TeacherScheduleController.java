package com.timetable.controller;

import com.timetable.dto.LessonDTO;
import com.timetable.model.Lesson;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherAvailability;
import com.timetable.model.User;
import com.timetable.repository.LessonRepository;
import com.timetable.repository.TeacherAvailabilityRepository;
import com.timetable.repository.TeacherRepository;
import com.timetable.repository.UserRepository;
import com.timetable.dto.AvailabilityDTO;
import com.timetable.repository.TimeslotRepository;
import com.timetable.model.Timeslot;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/teacher")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'TEACHER')")
@RequiredArgsConstructor
public class TeacherScheduleController {

    private final LessonRepository lessonRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final TeacherAvailabilityRepository availabilityRepository;
    private final TimeslotRepository timeslotRepository;

    @GetMapping("/schedule")
    public ResponseEntity<List<LessonDTO>> getMySchedule(Authentication authentication) {
        Teacher teacher = getTeacherFromAuth(authentication);
        if (teacher == null) {
            return ResponseEntity.ok(List.of());
        }

        List<Lesson> lessons = lessonRepository.findByTeacherId(teacher.getId());
        List<LessonDTO> dtos = lessons.stream().map(this::toLessonDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/availabilities")
    public ResponseEntity<List<AvailabilityDTO>> getMyAvailabilities(Authentication authentication) {
        Teacher teacher = getTeacherFromAuth(authentication);
        if (teacher == null) return ResponseEntity.ok(List.of());
        List<TeacherAvailability> avails = availabilityRepository.findByTeacherId(teacher.getId());
        List<AvailabilityDTO> dtos = avails.stream().map(a -> {
            AvailabilityDTO dto = new AvailabilityDTO();
            dto.setId(a.getId());
            dto.setTeacherId(teacher.getId());
            dto.setTimeslotId(a.getTimeslot() != null ? a.getTimeslot().getId() : null);
            dto.setAvailable(a.isAvailable());
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/availabilities")
    @Transactional
    public ResponseEntity<List<AvailabilityDTO>> updateMyAvailabilities(
            Authentication authentication,
            @RequestBody List<AvailabilityDTO> dtos) {
        Teacher teacher = getTeacherFromAuth(authentication);
        if (teacher == null) return ResponseEntity.badRequest().build();

        availabilityRepository.deleteByTeacherId(teacher.getId());

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
            rDto.setTeacherId(teacher.getId());
            rDto.setTimeslotId(timeslot.getId());
            rDto.setAvailable(saved.isAvailable());
            result.add(rDto);
        }
        return ResponseEntity.ok(result);
    }

    private Teacher getTeacherFromAuth(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return teacherRepository.findByUserId(user.getId())
                .or(() -> teacherRepository.findByEmail(user.getEmail()))
                .orElse(null);
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
