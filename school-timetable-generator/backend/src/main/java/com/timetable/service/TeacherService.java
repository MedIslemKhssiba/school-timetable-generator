package com.timetable.service;

import com.timetable.dto.TeacherDTO;
import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.School;
import com.timetable.model.Subject;
import com.timetable.model.Teacher;
import com.timetable.repository.SchoolRepository;
import com.timetable.repository.SubjectRepository;
import com.timetable.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;
    private final SubjectRepository subjectRepository;

    public List<Teacher> getTeachersBySchool(Long schoolId) {
        return teacherRepository.findBySchoolId(schoolId);
    }

    public Teacher getTeacherById(Long id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + id));
    }

    public Teacher createTeacher(TeacherDTO dto) {
        School school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new ResourceNotFoundException("School not found"));

        Teacher teacher = Teacher.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .school(school)
                .maxHoursPerWeek(dto.getMaxHoursPerWeek())
                .build();

        if (dto.getSubjectIds() != null && !dto.getSubjectIds().isEmpty()) {
            List<Subject> subjects = subjectRepository.findAllById(dto.getSubjectIds());
            teacher.setSubjects(subjects);
        }

        return teacherRepository.save(teacher);
    }

    public Teacher updateTeacher(Long id, TeacherDTO dto) {
        Teacher teacher = getTeacherById(id);
        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setEmail(dto.getEmail());
        teacher.setMaxHoursPerWeek(dto.getMaxHoursPerWeek());

        if (dto.getSubjectIds() != null) {
            List<Subject> subjects = subjectRepository.findAllById(dto.getSubjectIds());
            teacher.setSubjects(subjects);
        }

        return teacherRepository.save(teacher);
    }

    public void deleteTeacher(Long id) {
        teacherRepository.deleteById(id);
    }
}
