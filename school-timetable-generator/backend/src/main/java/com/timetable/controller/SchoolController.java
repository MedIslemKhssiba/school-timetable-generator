package com.timetable.controller;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.School;
import com.timetable.repository.ClassGroupRepository;
import com.timetable.repository.LessonRepository;
import com.timetable.repository.RoomRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.repository.TeacherRepository;
import com.timetable.service.SchoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/super-admin/schools")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class SchoolController {

    private final SchoolService schoolService;
    private final TeacherRepository teacherRepository;
    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final LessonRepository lessonRepository;

    @GetMapping
    public ResponseEntity<List<School>> getAllSchools() {
        return ResponseEntity.ok(schoolService.getAllSchools());
    }

    @GetMapping("/{id}")
    public ResponseEntity<School> getSchool(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.getSchoolById(id));
    }

    @PostMapping
    public ResponseEntity<School> createSchool(@RequestBody School school) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schoolService.createSchool(school));
    }

    @PutMapping("/{id}")
    public ResponseEntity<School> updateSchool(@PathVariable Long id, @RequestBody School school) {
        return ResponseEntity.ok(schoolService.updateSchool(id, school));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable Long id) {
        schoolService.deleteSchool(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<School> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(schoolService.toggleActive(id));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<Map<String, Long>> getSchoolStatistics(@PathVariable Long id) {
        School school = schoolService.getSchoolById(id);
        Map<String, Long> stats = new HashMap<>();
        stats.put("teachers", teacherRepository.countBySchoolId(school.getId()));
        stats.put("classes", classGroupRepository.countBySchoolId(school.getId()));
        stats.put("subjects", subjectRepository.countBySchoolId(school.getId()));
        stats.put("rooms", roomRepository.countBySchoolId(school.getId()));
        stats.put("lessons", lessonRepository.countBySchoolId(school.getId()));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}/statistics/{kind}")
    public ResponseEntity<List<Map<String, Object>>> getSchoolStatisticsDetails(@PathVariable Long id, @PathVariable String kind) {
        School school = schoolService.getSchoolById(id);
        List<Map<String, Object>> rows = new ArrayList<>();

        switch (kind.toLowerCase()) {
            case "teachers" -> teacherRepository.findBySchoolId(school.getId()).forEach(t -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", t.getId());
                row.put("title", t.getFirstName() + " " + t.getLastName());
                row.put("subtitle", t.getEmail());
                rows.add(row);
            });
            case "classes" -> classGroupRepository.findBySchoolId(school.getId()).forEach(c -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", c.getId());
                row.put("title", c.getName());
                row.put("subtitle", c.getLevel() == null ? "Niveau non défini" : c.getLevel());
                rows.add(row);
            });
            case "subjects" -> subjectRepository.findBySchoolId(school.getId()).forEach(s -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", s.getId());
                row.put("title", s.getName());
                row.put("subtitle", s.getHoursPerWeek() + "h / semaine");
                rows.add(row);
            });
            case "rooms" -> roomRepository.findBySchoolId(school.getId()).forEach(r -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", r.getId());
                row.put("title", r.getName());
                row.put("subtitle", "Capacité " + r.getCapacity());
                rows.add(row);
            });
            case "lessons" -> lessonRepository.findBySchoolIdWithDetails(school.getId()).forEach(l -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", l.getId());
                String title = (l.getSubject() != null ? l.getSubject().getName() : "Cours")
                        + " - "
                        + (l.getClassGroup() != null ? l.getClassGroup().getName() : "Classe");
                String subtitle = (l.getTeacher() != null ? l.getTeacher().getFirstName() + " " + l.getTeacher().getLastName() : "Professeur")
                        + (l.getTimeslot() != null ? " | " + l.getTimeslot().getDayOfWeek() + " " + l.getTimeslot().getStartTime() + "-" + l.getTimeslot().getEndTime() : "");
                row.put("title", title);
                row.put("subtitle", subtitle);
                rows.add(row);
            });
            default -> {
                return ResponseEntity.badRequest().build();
            }
        }

        return ResponseEntity.ok(rows);
    }
}
