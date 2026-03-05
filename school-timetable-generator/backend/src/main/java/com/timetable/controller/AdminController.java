package com.timetable.controller;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.*;
import com.timetable.repository.*;
import com.timetable.service.TeacherService;
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

    // --- Dashboard ---

    @GetMapping("/dashboard/{schoolId}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable Long schoolId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTeachers", teacherService.getTeachersBySchool(schoolId).size());
        stats.put("totalClasses", classGroupRepository.findBySchoolId(schoolId).size());
        stats.put("totalSubjects", subjectRepository.findBySchoolId(schoolId).size());
        stats.put("totalRooms", roomRepository.findBySchoolId(schoolId).size());
        return ResponseEntity.ok(stats);
    }

    // --- Classes ---

    @GetMapping("/classes/{schoolId}")
    public ResponseEntity<List<ClassGroup>> getClasses(@PathVariable Long schoolId) {
        return ResponseEntity.ok(classGroupRepository.findBySchoolId(schoolId));
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassGroup> createClass(@RequestBody ClassGroup classGroup) {
        return ResponseEntity.status(HttpStatus.CREATED).body(classGroupRepository.save(classGroup));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ClassGroup> updateClass(@PathVariable Long id, @RequestBody ClassGroup updated) {
        ClassGroup classGroup = classGroupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassGroup not found with id: " + id));
        classGroup.setName(updated.getName());
        classGroup.setLevel(updated.getLevel());
        classGroup.setStudentCount(updated.getStudentCount());
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
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectRepository.save(subject));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<Subject> updateSubject(@PathVariable Long id, @RequestBody Subject updated) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        subject.setName(updated.getName());
        subject.setColor(updated.getColor());
        subject.setHoursPerWeek(updated.getHoursPerWeek());
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
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roomRepository.save(room));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Room updated) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        room.setName(updated.getName());
        room.setCapacity(updated.getCapacity());
        room.setType(updated.getType());
        return ResponseEntity.ok(roomRepository.save(room));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Timetable endpoints are in TimetableController at /admin/timetable

    // --- Lessons (view generated) ---

    @GetMapping("/lessons/{schoolId}")
    public ResponseEntity<List<Lesson>> getLessons(@PathVariable Long schoolId) {
        return ResponseEntity.ok(lessonRepository.findBySchoolId(schoolId));
    }
}
