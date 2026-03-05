package com.timetable.service;

import com.timetable.model.*;
import com.timetable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportExportService {

    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TeacherRepository teacherRepository;
    private final LessonRepository lessonRepository;
    private final SchoolRepository schoolRepository;

    public List<String> importExcel(Long schoolId, MultipartFile file) throws IOException {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));

        List<String> results = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            // Import Classes sheet
            Sheet classesSheet = workbook.getSheet("Classes");
            if (classesSheet != null) {
                int count = importClasses(classesSheet, school);
                results.add("Imported " + count + " classes");
            }

            // Import Subjects sheet
            Sheet subjectsSheet = workbook.getSheet("Subjects");
            if (subjectsSheet != null) {
                int count = importSubjects(subjectsSheet, school);
                results.add("Imported " + count + " subjects");
            }

            // Import Rooms sheet
            Sheet roomsSheet = workbook.getSheet("Rooms");
            if (roomsSheet != null) {
                int count = importRooms(roomsSheet, school);
                results.add("Imported " + count + " rooms");
            }

            // Import Teachers sheet
            Sheet teachersSheet = workbook.getSheet("Teachers");
            if (teachersSheet != null) {
                int count = importTeachers(teachersSheet, school);
                results.add("Imported " + count + " teachers");
            }
        }

        return results;
    }

    private int importClasses(Sheet sheet, School school) {
        int count = 0;
        Iterator<Row> rows = sheet.iterator();
        if (rows.hasNext()) rows.next(); // skip header
        while (rows.hasNext()) {
            Row row = rows.next();
            String name = getCellString(row, 0);
            if (name == null || name.isBlank()) continue;

            ClassGroup cg = ClassGroup.builder()
                    .name(name)
                    .level(getCellString(row, 1))
                    .studentCount((int) getCellNumeric(row, 2))
                    .school(school)
                    .build();
            classGroupRepository.save(cg);
            count++;
        }
        return count;
    }

    private int importSubjects(Sheet sheet, School school) {
        int count = 0;
        Iterator<Row> rows = sheet.iterator();
        if (rows.hasNext()) rows.next(); // skip header
        while (rows.hasNext()) {
            Row row = rows.next();
            String name = getCellString(row, 0);
            if (name == null || name.isBlank()) continue;

            Subject subject = Subject.builder()
                    .name(name)
                    .color(getCellString(row, 1))
                    .hoursPerWeek((int) getCellNumeric(row, 2))
                    .sessionDuration((int) getCellNumeric(row, 3))
                    .school(school)
                    .build();
            subjectRepository.save(subject);
            count++;
        }
        return count;
    }

    private int importRooms(Sheet sheet, School school) {
        int count = 0;
        Iterator<Row> rows = sheet.iterator();
        if (rows.hasNext()) rows.next(); // skip header
        while (rows.hasNext()) {
            Row row = rows.next();
            String name = getCellString(row, 0);
            if (name == null || name.isBlank()) continue;

            Room room = Room.builder()
                    .name(name)
                    .capacity((int) getCellNumeric(row, 1))
                    .type(getCellString(row, 2))
                    .school(school)
                    .build();
            roomRepository.save(room);
            count++;
        }
        return count;
    }

    private int importTeachers(Sheet sheet, School school) {
        int count = 0;
        Iterator<Row> rows = sheet.iterator();
        if (rows.hasNext()) rows.next(); // skip header
        while (rows.hasNext()) {
            Row row = rows.next();
            String firstName = getCellString(row, 0);
            if (firstName == null || firstName.isBlank()) continue;

            Teacher teacher = Teacher.builder()
                    .firstName(firstName)
                    .lastName(getCellString(row, 1))
                    .email(getCellString(row, 2))
                    .maxHoursPerWeek((int) getCellNumeric(row, 3))
                    .school(school)
                    .build();
            teacherRepository.save(teacher);
            count++;
        }
        return count;
    }

    public byte[] exportTimetableExcel(Long schoolId) throws IOException {
        List<Lesson> lessons = lessonRepository.findBySchoolId(schoolId);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Timetable");

            // Header
            Row header = sheet.createRow(0);
            String[] columns = {"Day", "Start Time", "End Time", "Subject", "Teacher", "Class", "Room"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Lesson lesson : lessons) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(lesson.getTimeslot() != null ? lesson.getTimeslot().getDayOfWeek().name() : "");
                row.createCell(1).setCellValue(lesson.getTimeslot() != null ? lesson.getTimeslot().getStartTime().toString() : "");
                row.createCell(2).setCellValue(lesson.getTimeslot() != null ? lesson.getTimeslot().getEndTime().toString() : "");
                row.createCell(3).setCellValue(lesson.getSubject() != null ? lesson.getSubject().getName() : "");
                row.createCell(4).setCellValue(lesson.getTeacher() != null ? lesson.getTeacher().getFirstName() + " " + lesson.getTeacher().getLastName() : "");
                row.createCell(5).setCellValue(lesson.getClassGroup() != null ? lesson.getClassGroup().getName() : "");
                row.createCell(6).setCellValue(lesson.getRoom() != null ? lesson.getRoom().getName() : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((int) cell.getNumericCellValue());
        return null;
    }

    private double getCellNumeric(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            try {
                return Double.parseDouble(cell.getStringCellValue());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        return 0;
    }
}
