package com.timetable.controller;

import com.timetable.dto.RegisterRequest;
import com.timetable.model.Role;
import com.timetable.model.School;
import com.timetable.model.User;
import com.timetable.repository.UserRepository;
import com.timetable.service.SchoolService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SchoolService schoolService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // --- Dashboard ---

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchools", schoolService.getAllSchools().size());
        stats.put("totalAdmins", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN).count());
        stats.put("totalUsers", userRepository.count());
        return ResponseEntity.ok(stats);
    }

    // Schools CRUD is handled by SchoolController at /super-admin/schools

    // --- Admin user management ---

    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAllAdmins() {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_ADMIN)
                .toList();
        return ResponseEntity.ok(admins);
    }

    @PostMapping("/admins")
    public ResponseEntity<User> createAdmin(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().build();
        }

        User admin = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.ROLE_ADMIN)
                .build();

        if (request.getSchoolId() != null) {
            School school = schoolService.getSchoolById(request.getSchoolId());
            admin.setSchool(school);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(admin));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
