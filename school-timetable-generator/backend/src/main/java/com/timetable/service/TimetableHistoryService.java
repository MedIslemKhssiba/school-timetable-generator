package com.timetable.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timetable.model.Lesson;
import com.timetable.model.School;
import com.timetable.model.Teacher;
import com.timetable.model.TeacherTimetableDispatch;
import com.timetable.model.TimetableGenerationHistory;
import com.timetable.repository.TeacherTimetableDispatchRepository;
import com.timetable.repository.TimetableGenerationHistoryRepository;
import com.timetable.solver.TimetableSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableHistoryService {

    private final TimetableGenerationHistoryRepository historyRepository;
    private final TeacherTimetableDispatchRepository dispatchRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> archiveAndDispatchToTeachers(Long schoolId,
                                                             List<Lesson> lessons,
                                                             TimetableSolution solution) {
        Instant now = Instant.now();
        HardSoftScore score = solution != null ? solution.getScore() : null;

        TimetableGenerationHistory history = TimetableGenerationHistory.builder()
                .school(School.builder().id(schoolId).build())
                .generatedAt(now)
                .totalLessons(lessons.size())
                .hardScore(score != null ? score.hardScore() : null)
                .softScore(score != null ? score.softScore() : null)
                .scoreLabel(score != null ? score.toString() : null)
                .snapshotJson(toJson(buildSchoolSnapshot(schoolId, now, lessons)))
                .build();

        TimetableGenerationHistory savedHistory = historyRepository.save(history);

        Map<Teacher, List<Lesson>> lessonsByTeacher = lessons.stream()
                .filter(lesson -> lesson.getTeacher() != null)
                .collect(Collectors.groupingBy(Lesson::getTeacher));

        int teacherDispatchCount = 0;
        for (Map.Entry<Teacher, List<Lesson>> entry : lessonsByTeacher.entrySet()) {
            Teacher teacher = entry.getKey();
            List<Lesson> teacherLessons = entry.getValue();

            TeacherTimetableDispatch dispatch = TeacherTimetableDispatch.builder()
                    .history(savedHistory)
                    .teacher(teacher)
                    .dispatchedAt(now)
                    .lessonCount(teacherLessons.size())
                    .status("SENT")
                    .snapshotJson(toJson(buildTeacherSnapshot(savedHistory.getId(), teacher, teacherLessons, now)))
                    .build();
            dispatchRepository.save(dispatch);
            teacherDispatchCount++;
        }

        log.info("Saved timetable history {} for school {} and dispatched to {} teacher(s)",
                savedHistory.getId(), schoolId, teacherDispatchCount);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("historyId", savedHistory.getId());
        result.put("teacherDispatchCount", teacherDispatchCount);
        result.put("generatedAt", now.toString());
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSchoolHistory(Long schoolId) {
        List<TimetableGenerationHistory> histories = historyRepository.findBySchoolIdOrderByGeneratedAtDesc(schoolId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (TimetableGenerationHistory history : histories) {
            List<TeacherTimetableDispatch> dispatches =
                    dispatchRepository.findByHistoryIdOrderByTeacherLastNameAscTeacherFirstNameAsc(history.getId());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", history.getId());
            row.put("generatedAt", history.getGeneratedAt());
            row.put("totalLessons", history.getTotalLessons());
            row.put("hardScore", history.getHardScore());
            row.put("softScore", history.getSoftScore());
            row.put("score", history.getScoreLabel());
            row.put("teacherDispatchCount", dispatches.size());
            row.put("teachers", dispatches.stream().map(dispatch -> {
                Map<String, Object> teacherRow = new LinkedHashMap<>();
                teacherRow.put("teacherId", dispatch.getTeacher().getId());
                teacherRow.put("teacherName", dispatch.getTeacher().getFirstName() + " " + dispatch.getTeacher().getLastName());
                teacherRow.put("lessonCount", dispatch.getLessonCount());
                teacherRow.put("status", dispatch.getStatus());
                teacherRow.put("dispatchedAt", dispatch.getDispatchedAt());
                return teacherRow;
            }).toList());
            result.add(row);
        }

        return result;
    }

    private Map<String, Object> buildSchoolSnapshot(Long schoolId, Instant generatedAt, List<Lesson> lessons) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schoolId", schoolId);
        payload.put("generatedAt", generatedAt.toString());
        payload.put("lessons", lessons.stream().map(this::toLessonMap).toList());
        return payload;
    }

    private Map<String, Object> buildTeacherSnapshot(Long historyId, Teacher teacher, List<Lesson> lessons, Instant dispatchedAt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("historyId", historyId);
        payload.put("teacherId", teacher.getId());
        payload.put("teacherName", teacher.getFirstName() + " " + teacher.getLastName());
        payload.put("dispatchedAt", dispatchedAt.toString());
        payload.put("lessons", lessons.stream().map(this::toLessonMap).toList());
        return payload;
    }

    private Map<String, Object> toLessonMap(Lesson lesson) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("lessonId", lesson.getId());
        row.put("subject", lesson.getSubject() != null ? lesson.getSubject().getName() : null);
        row.put("classGroup", lesson.getClassGroup() != null ? lesson.getClassGroup().getName() : null);
        row.put("room", lesson.getRoom() != null ? lesson.getRoom().getName() : null);
        row.put("day", lesson.getTimeslot() != null && lesson.getTimeslot().getDayOfWeek() != null ? lesson.getTimeslot().getDayOfWeek().name() : null);
        row.put("start", lesson.getTimeslot() != null && lesson.getTimeslot().getStartTime() != null ? lesson.getTimeslot().getStartTime().toString() : null);
        row.put("end", lesson.getTimeslot() != null && lesson.getTimeslot().getEndTime() != null ? lesson.getTimeslot().getEndTime().toString() : null);
        row.put("sessionDurationMinutes", lesson.getSubject() != null ? lesson.getSubject().getSessionDuration() : null);
        return row;
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to serialize timetable history payload", ex);
        }
    }
}
