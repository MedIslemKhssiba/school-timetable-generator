package com.timetable.config;

import com.timetable.model.DayOfWeek;
import com.timetable.model.Role;
import com.timetable.model.Timeslot;
import com.timetable.model.User;
import com.timetable.repository.TimeslotRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final TimeslotRepository timeslotRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initializeTimeslots();
        initializeSuperAdmin();
    }

    private void initializeTimeslots() {
        if (timeslotRepository.count() > 0) {
            log.info("Timeslots already exist, skipping initialization");
            return;
        }

        log.info("Initializing default timeslots...");
        List<Timeslot> timeslots = new ArrayList<>();
        DayOfWeek[] days = {DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY};

        int[][] hours = {
                {8, 0, 9, 0},
                {9, 0, 10, 0},
                {10, 0, 11, 0},
                {11, 0, 12, 0},
                {14, 0, 15, 0},
                {15, 0, 16, 0},
                {16, 0, 17, 0}
        };

        for (DayOfWeek day : days) {
            for (int order = 0; order < hours.length; order++) {
                int[] h = hours[order];
                Timeslot ts = Timeslot.builder()
                        .dayOfWeek(day)
                        .startTime(LocalTime.of(h[0], h[1]))
                        .endTime(LocalTime.of(h[2], h[3]))
                        .orderInDay(order + 1)
                        .build();
                timeslots.add(ts);
            }
        }

        timeslotRepository.saveAll(timeslots);
        log.info("Created {} default timeslots (6 days x 7 slots)", timeslots.size());
    }

    private void initializeSuperAdmin() {
        String superAdminEmail = "super@admin.com";
        if (userRepository.existsByEmail(superAdminEmail)) {
            log.info("Super admin already exists");
            return;
        }

        User superAdmin = User.builder()
                .email(superAdminEmail)
                .password(passwordEncoder.encode("admin123"))
                .firstName("Super")
                .lastName("Admin")
                .role(Role.ROLE_SUPER_ADMIN)
                .build();

        userRepository.save(superAdmin);
        log.info("Created default super admin: {} / admin123", superAdminEmail);
    }
}
