package com.timetable.service;

import com.timetable.model.*;
import com.timetable.repository.*;
import com.timetable.solver.LessonAssignment;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportExportService {

    private final ClassGroupRepository classGroupRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TeacherRepository teacherRepository;
    private final LessonRepository lessonRepository;
    private final TimeslotRepository timeslotRepository;
    private final SchoolRepository schoolRepository;

    public List<String> importData(Long schoolId, MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".csv")) {
            return importTimetableCsv(schoolId, file);
        }
        return importExcel(schoolId, file);
    }

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
        return exportTimetableExcel(schoolId, List.of());
    }

    public byte[] exportTimetableExcel(Long schoolId, List<LessonAssignment> fallbackAssignments) throws IOException {
        List<Lesson> lessons = lessonRepository.findBySchoolIdWithDetails(schoolId).stream()
            .sorted(Comparator
                .comparing((Lesson l) -> l.getTimeslot() != null && l.getTimeslot().getDayOfWeek() != null
                    ? l.getTimeslot().getDayOfWeek().ordinal() : Integer.MAX_VALUE)
                .thenComparing(l -> l.getTimeslot() != null && l.getTimeslot().getStartTime() != null
                    ? l.getTimeslot().getStartTime() : java.time.LocalTime.MAX))
            .toList();

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

            int rowNum = 1;

            if (!lessons.isEmpty()) {
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
            } else {
                for (LessonAssignment assignment : fallbackAssignments) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(assignment.getTimeslot() != null ? assignment.getTimeslot().getDayOfWeek().name() : "");
                    row.createCell(1).setCellValue(assignment.getTimeslot() != null ? assignment.getTimeslot().getStartTime().toString() : "");
                    row.createCell(2).setCellValue(assignment.getTimeslot() != null ? assignment.getTimeslot().getEndTime().toString() : "");
                    row.createCell(3).setCellValue(assignment.getSubject() != null ? assignment.getSubject().getName() : "");
                    row.createCell(4).setCellValue(assignment.getTeacher() != null
                            ? assignment.getTeacher().getFirstName() + " " + assignment.getTeacher().getLastName() : "");
                    row.createCell(5).setCellValue(assignment.getClassGroup() != null ? assignment.getClassGroup().getName() : "");
                    row.createCell(6).setCellValue(assignment.getRoom() != null ? assignment.getRoom().getName() : "");
                }
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportTimetablePdf(Long schoolId) throws IOException {
        List<Lesson> lessons = lessonRepository.findBySchoolIdWithDetails(schoolId).stream()
                .sorted(Comparator
                        .comparing((Lesson l) -> l.getTimeslot() != null && l.getTimeslot().getDayOfWeek() != null
                                ? l.getTimeslot().getDayOfWeek().ordinal() : Integer.MAX_VALUE)
                        .thenComparing(l -> l.getTimeslot() != null && l.getTimeslot().getStartTime() != null
                                ? l.getTimeslot().getStartTime() : java.time.LocalTime.MAX))
                .toList();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            Paragraph title = new Paragraph("School Timetable", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16));
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(12f);
            document.add(title);

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setHeaderRows(1);
            table.setWidths(new float[]{1.2f, 1.1f, 1.1f, 1.7f, 1.8f, 1.3f, 1.2f});

            addHeader(table, "Day");
            addHeader(table, "Start");
            addHeader(table, "End");
            addHeader(table, "Subject");
            addHeader(table, "Teacher");
            addHeader(table, "Class");
            addHeader(table, "Room");

            for (Lesson lesson : lessons) {
                table.addCell(value(lesson.getTimeslot() != null && lesson.getTimeslot().getDayOfWeek() != null
                        ? lesson.getTimeslot().getDayOfWeek().name() : ""));
                table.addCell(value(lesson.getTimeslot() != null && lesson.getTimeslot().getStartTime() != null
                        ? lesson.getTimeslot().getStartTime().toString() : ""));
                table.addCell(value(lesson.getTimeslot() != null && lesson.getTimeslot().getEndTime() != null
                        ? lesson.getTimeslot().getEndTime().toString() : ""));
                table.addCell(value(lesson.getSubject() != null ? lesson.getSubject().getName() : ""));
                table.addCell(value(lesson.getTeacher() != null
                        ? lesson.getTeacher().getFirstName() + " " + lesson.getTeacher().getLastName() : ""));
                table.addCell(value(lesson.getClassGroup() != null ? lesson.getClassGroup().getName() : ""));
                table.addCell(value(lesson.getRoom() != null ? lesson.getRoom().getName() : ""));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        }
    }

    private void addHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private String value(String value) {
        return value == null ? "" : value;
    }

    private List<String> importTimetableCsv(Long schoolId, MultipartFile file) throws IOException {
        School school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));

        List<Lesson> existing = lessonRepository.findBySchoolId(schoolId);
        if (!existing.isEmpty()) {
            lessonRepository.deleteAllInBatch(existing);
        }

        List<String> result = new ArrayList<>();
        int imported = 0;

        Map<String, Subject> subjectsByName = new HashMap<>();
        for (Subject subject : subjectRepository.findBySchoolId(schoolId)) {
            subjectsByName.put(normalize(subject.getName()), subject);
        }

        Map<String, Teacher> teachersByName = new HashMap<>();
        for (Teacher teacher : teacherRepository.findBySchoolId(schoolId)) {
            String fullName = (teacher.getFirstName() + " " + teacher.getLastName()).trim();
            teachersByName.put(normalize(fullName), teacher);
        }

        Map<String, ClassGroup> classesByName = new HashMap<>();
        for (ClassGroup classGroup : classGroupRepository.findBySchoolId(schoolId)) {
            classesByName.put(normalize(classGroup.getName()), classGroup);
        }

        Map<String, Room> roomsByName = new HashMap<>();
        for (Room room : roomRepository.findBySchoolId(schoolId)) {
            roomsByName.put(normalize(room.getName()), room);
        }

        Map<String, Timeslot> timeslotByKey = new HashMap<>();
        for (Timeslot timeslot : timeslotRepository.findAllByOrderByDayOfWeekAscOrderInDayAsc()) {
            String key = timeslot.getDayOfWeek().name() + "|" + timeslot.getStartTime() + "|" + timeslot.getEndTime();
            timeslotByKey.put(key, timeslot);
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean headerSkipped = false;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }

                String[] cols = splitCsv(line);
                if (cols.length < 7) {
                    continue;
                }

                String day = cols[0].trim().toUpperCase();
                String start = cols[1].trim();
                String end = cols[2].trim();
                String subjectName = cols[3].trim();
                String teacherName = cols[4].trim();
                String className = cols[5].trim();
                String roomName = cols[6].trim();

                Subject subject = subjectsByName.get(normalize(subjectName));
                Teacher teacher = teachersByName.get(normalize(teacherName));
                ClassGroup classGroup = classesByName.get(normalize(className));
                Room room = roomsByName.get(normalize(roomName));
                Timeslot timeslot = timeslotByKey.get(day + "|" + start + "|" + end);

                if (subject == null || teacher == null || classGroup == null || room == null || timeslot == null) {
                    continue;
                }

                Lesson lesson = Lesson.builder()
                        .subject(subject)
                        .teacher(teacher)
                        .classGroup(classGroup)
                        .room(room)
                        .timeslot(timeslot)
                        .school(school)
                        .build();
                lessonRepository.save(lesson);
                imported++;
            }
        }

        result.add("Imported " + imported + " timetable lessons from CSV");
        return result;
    }

    private String[] splitCsv(String line) {
        return line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
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
