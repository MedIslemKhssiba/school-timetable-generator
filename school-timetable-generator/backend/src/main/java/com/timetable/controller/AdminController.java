package com.timetable.controller;

import com.timetable.dto.ClassGroupDTO;
import com.timetable.dto.RoomDTO;
import com.timetable.dto.SubjectDTO;
import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.*;
import com.timetable.repository.*;
import com.timetable.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final TeacherService teacherService;
    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final LessonRepository lessonRepository;
    private final SchoolRepository schoolRepository;
    private final TeacherRepository teacherRepository;

    // --- Dashboard ---

    @GetMapping("/dashboard/{schoolId}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable Long schoolId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTeachers", teacherRepository.countBySchoolId(schoolId));
        stats.put("totalClasses", classGroupRepository.countBySchoolId(schoolId));
        stats.put("totalSubjects", subjectRepository.countBySchoolId(schoolId));
        stats.put("totalRooms", roomRepository.countBySchoolId(schoolId));
        stats.put("totalLessons", lessonRepository.countBySchoolId(schoolId));
        return ResponseEntity.ok(stats);
    }

    // --- Classes ---

    @GetMapping("/classes/{schoolId}")
    public ResponseEntity<List<ClassGroup>> getClasses(@PathVariable Long schoolId) {
        return ResponseEntity.ok(classGroupRepository.findBySchoolId(schoolId));
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassGroup> createClass(@Valid @RequestBody ClassGroupDTO dto) {
        School school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + dto.getSchoolId()));
        ClassGroup classGroup = ClassGroup.builder()
                .name(dto.getName())
                .level(dto.getLevel())
                .studentCount(dto.getStudentCount())
                .school(school)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(classGroupRepository.save(classGroup));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ClassGroup> updateClass(@PathVariable Long id, @Valid @RequestBody ClassGroupDTO dto) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassGroup not found with id: " + id));
        classGroup.setName(dto.getName());
        classGroup.setLevel(dto.getLevel());
        classGroup.setStudentCount(dto.getStudentCount());
        return ResponseEntity.ok(classGroupRepository.save(classGroup));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Void> deleteClass(@PathVariable Long id) {
        classGroupRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Subjects ---

    @GetMapping("/subjects/{schoolId}")
    public ResponseEntity<List<Subject>> getSubjects(@PathVariable Long schoolId) {
        return ResponseEntity.ok(subjectRepository.findBySchoolId(schoolId));
    }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@Valid @RequestBody SubjectDTO dto) {
        School school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + dto.getSchoolId()));
        Subject subject = Subject.builder()
                .name(dto.getName())
            .level(dto.getLevel())
                .requiredRoomType(dto.getRequiredRoomType())
                .color(dto.getColor())
                .hoursPerWeek(dto.getHoursPerWeek())
                .sessionDuration(dto.getSessionDuration())
                .school(school)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectRepository.save(subject));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectDTO dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        subject.setName(dto.getName());
        subject.setLevel(dto.getLevel());
        subject.setRequiredRoomType(dto.getRequiredRoomType());
        subject.setColor(dto.getColor());
        subject.setHoursPerWeek(dto.getHoursPerWeek());
        subject.setSessionDuration(dto.getSessionDuration());
        return ResponseEntity.ok(subjectRepository.save(subject));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        subjectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Rooms ---

    @GetMapping("/rooms/{schoolId}")
    public ResponseEntity<List<Room>> getRooms(@PathVariable Long schoolId) {
        return ResponseEntity.ok(roomRepository.findBySchoolId(schoolId));
    }

    @PostMapping("/rooms")
    public ResponseEntity<Room> createRoom(@Valid @RequestBody RoomDTO dto) {
        School school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + dto.getSchoolId()));
        Room room = Room.builder()
                .name(dto.getName())
                .capacity(dto.getCapacity())
                .type(dto.getType())
                .school(school)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(roomRepository.save(room));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @Valid @RequestBody RoomDTO dto) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        room.setName(dto.getName());
        room.setCapacity(dto.getCapacity());
        room.setType(dto.getType());
        return ResponseEntity.ok(roomRepository.save(room));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Lessons (view generated) ---

    @GetMapping("/lessons/{schoolId}")
    public ResponseEntity<List<Map<String, Object>>> getLessons(@PathVariable Long schoolId) {
        List<Lesson> lessons = lessonRepository.findBySchoolId(schoolId);
        List<Map<String, Object>> result = lessons.stream().map(l -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", l.getId());
            m.put("subjectId", l.getSubject() != null ? l.getSubject().getId() : null);
            m.put("subjectName", l.getSubject() != null ? l.getSubject().getName() : "");
            m.put("teacherId", l.getTeacher() != null ? l.getTeacher().getId() : null);
            m.put("teacherName", l.getTeacher() != null ? l.getTeacher().getFirstName() + " " + l.getTeacher().getLastName() : "");
            m.put("classGroupId", l.getClassGroup() != null ? l.getClassGroup().getId() : null);
            m.put("classGroupName", l.getClassGroup() != null ? l.getClassGroup().getName() : "");
            m.put("roomId", l.getRoom() != null ? l.getRoom().getId() : null);
            m.put("roomName", l.getRoom() != null ? l.getRoom().getName() : "");
            return m;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
