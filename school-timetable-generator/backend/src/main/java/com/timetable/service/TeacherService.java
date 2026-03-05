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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final SchoolRepository schoolRepository;
    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<TeacherDTO> getTeachersBySchool(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
        return teachers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Teacher getTeacherById(Long id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found with id: " + id));
    }

    @Transactional
    public TeacherDTO createTeacher(TeacherDTO dto) {
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

        return toDTO(teacherRepository.save(teacher));
    }

    @Transactional
    public TeacherDTO updateTeacher(Long id, TeacherDTO dto) {
        Teacher teacher = getTeacherById(id);
        teacher.setFirstName(dto.getFirstName());
        teacher.setLastName(dto.getLastName());
        teacher.setEmail(dto.getEmail());
        teacher.setMaxHoursPerWeek(dto.getMaxHoursPerWeek());

        if (dto.getSubjectIds() != null) {
            List<Subject> subjects = subjectRepository.findAllById(dto.getSubjectIds());
            teacher.setSubjects(subjects);
        }

        return toDTO(teacherRepository.save(teacher));
    }

    public void deleteTeacher(Long id) {
        teacherRepository.deleteById(id);
    }

    private TeacherDTO toDTO(Teacher teacher) {
        TeacherDTO dto = new TeacherDTO();
        dto.setId(teacher.getId());
        dto.setFirstName(teacher.getFirstName());
        dto.setLastName(teacher.getLastName());
        dto.setEmail(teacher.getEmail());
        dto.setSchoolId(teacher.getSchool() != null ? teacher.getSchool().getId() : null);
        dto.setMaxHoursPerWeek(teacher.getMaxHoursPerWeek());
        if (teacher.getSubjects() != null) {
            dto.setSubjectIds(teacher.getSubjects().stream().map(Subject::getId).collect(Collectors.toList()));
            dto.setSubjects(teacher.getSubjects().stream()
                    .map(s -> new TeacherDTO.SubjectInfo(s.getId(), s.getName(), s.getColor()))
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
