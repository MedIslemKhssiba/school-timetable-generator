package com.timetable.controller;

import com.timetable.dto.RegisterRequest;
import com.timetable.dto.UpdateAdminRequest;
import com.timetable.exception.ResourceNotFoundException;
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
        stats.put("totalAdmins", userRepository.countByRole(Role.ROLE_ADMIN));
        stats.put("totalUsers", userRepository.count());
        return ResponseEntity.ok(stats);
    }

    // Schools CRUD is handled by SchoolController at /super-admin/schools

    // --- Admin user management ---

    @GetMapping("/admins")
    public ResponseEntity<List<User>> getAllAdmins() {
        return ResponseEntity.ok(userRepository.findByRole(Role.ROLE_ADMIN));
    }

    @PostMapping("/admins")
    public ResponseEntity<User> createAdmin(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().build();
        }

        if (request.getSchoolId() == null) {
            throw new IllegalArgumentException("A school must be assigned to the administrator");
        }

        User admin = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.ROLE_ADMIN)
                .build();

        School school = schoolService.getSchoolById(request.getSchoolId());
        admin.setSchool(school);

        return ResponseEntity.status(HttpStatus.CREATED).body(userRepository.save(admin));
    }

    @PutMapping("/admins/{id}")
    public ResponseEntity<User> updateAdmin(@PathVariable Long id, @Valid @RequestBody UpdateAdminRequest request) {
        User admin = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + id));

        admin.setFirstName(request.getFirstName());
        admin.setLastName(request.getLastName());
        admin.setEmail(request.getEmail());

        School school = schoolService.getSchoolById(request.getSchoolId());
        admin.setSchool(school);

        return ResponseEntity.ok(userRepository.save(admin));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/password")
    public ResponseEntity<String> changeUserPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newPassword = body == null ? null : body.get("newPassword");
        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (user.getRole() == Role.ROLE_SUPER_ADMIN) {
            return ResponseEntity.badRequest().body("Super admin password cannot be changed from this endpoint");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password updated successfully");
    }
}
