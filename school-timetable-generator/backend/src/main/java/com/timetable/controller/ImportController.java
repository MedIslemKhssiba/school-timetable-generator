package com.timetable.controller;

import com.timetable.service.ImportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/admin/import")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
public class ImportController {

    private final ImportExportService importExportService;

    @PostMapping("/{schoolId}")
    public ResponseEntity<List<String>> importExcel(
            @PathVariable Long schoolId,
            @RequestParam("file") MultipartFile file) throws IOException {
        List<String> results = importExportService.importData(schoolId, file);
        return ResponseEntity.ok(results);
    }
}
