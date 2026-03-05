package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.School;
import com.timetable.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolService {

    private final SchoolRepository schoolRepository;

    public List<School> getAllSchools() {
        return schoolRepository.findAll();
    }

    public School getSchoolById(Long id) {
        return schoolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("School not found with id: " + id));
    }

    public School createSchool(School school) {
        return schoolRepository.save(school);
    }

    public School updateSchool(Long id, School updated) {
        School school = getSchoolById(id);
        school.setName(updated.getName());
        school.setAddress(updated.getAddress());
        school.setPhone(updated.getPhone());
        return schoolRepository.save(school);
    }

    public void deleteSchool(Long id) {
        schoolRepository.deleteById(id);
    }

    public School toggleActive(Long id) {
        School school = getSchoolById(id);
        school.setActive(!school.isActive());
        return schoolRepository.save(school);
    }
}
