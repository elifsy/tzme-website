package com.tzme.cms.controller;

import com.tzme.cms.model.InquiryAttachment;
import com.tzme.cms.repository.InquiryAttachmentRepository;
import com.tzme.cms.service.ContactSettingsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/inquiry-attachments")
public class InquiryAttachmentController {
    private final InquiryAttachmentRepository repository;
    private final ContactSettingsService settings;
    private final Path directory;
    public InquiryAttachmentController(InquiryAttachmentRepository repository, ContactSettingsService settings, @Value("${tzme.upload-dir:./uploads}") String root) {
        this.repository = repository; this.settings = settings; directory = Path.of(root).toAbsolutePath().normalize().resolve("inquiries");
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public InquiryAttachment upload(@RequestParam("file") MultipartFile file) throws IOException {
        var config = settings.configuration(); var upload = config.path("upload");
        if (!config.path("form").path("enabled").asBoolean() || !upload.path("enabled").asBoolean()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Attachments are disabled");
        String name = Objects.requireNonNullElse(file.getOriginalFilename(), "file").replaceAll("[\\\\/\\p{Cntrl}]", "_");
        if (name.length() > 255) name = name.substring(name.length() - 255);
        int dot = name.lastIndexOf('.'); String extension = dot >= 0 ? name.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        boolean allowed = false;
        for (var type : upload.path("allowedExtensions")) if (type.asText().equals(extension)) allowed = true;
        if (!allowed || !ContactSettingsService.FILE_TYPES.contains(extension) || file.isEmpty() || file.getSize() > upload.path("maxFileSizeMb").asLong() * 1024 * 1024) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid attachment type or size");
        byte[] header;
        try (var stream = file.getInputStream()) { header = stream.readNBytes(512); }
        if (!validHeader(extension, header)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File contents do not match the selected type");
        var row = new InquiryAttachment(); row.setId(UUID.randomUUID().toString()); row.setOriginalName(name); row.setExtension(extension); row.setSize(file.getSize());
        Files.createDirectories(directory); Path path = directory.resolve(row.storageName());
        try {
            try (var stream = file.getInputStream()) { Files.copy(stream, path); }
            return repository.save(row);
        } catch (IOException | RuntimeException error) { Files.deleteIfExists(path); throw error; }
    }
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        var row = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Path path = directory.resolve(row.storageName()).normalize();
        if (!path.startsWith(directory) || !Files.isRegularFile(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition", ContentDisposition.attachment().filename(row.getOriginalName(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff").header("Cache-Control", "no-store")
            .body(new FileSystemResource(path));
    }
    private static boolean validHeader(String extension, byte[] bytes) {
        if (bytes.length == 0) return false;
        String text = new String(bytes, StandardCharsets.ISO_8859_1);
        return switch (extension) {
            case "pdf" -> text.startsWith("%PDF-");
            case "jpg", "jpeg" -> bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255;
            case "png" -> bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8), new byte[] { (byte)137, 80, 78, 71, 13, 10, 26, 10 });
            case "webp" -> text.startsWith("RIFF") && text.length() >= 12 && text.substring(8, 12).equals("WEBP");
            case "zip", "docx", "xlsx" -> text.startsWith("PK\003\004") || text.startsWith("PK\005\006");
            case "doc", "xls" -> bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8), new byte[] { (byte)208, (byte)207, 17, (byte)224, (byte)161, (byte)177, 26, (byte)225 });
            case "dwg" -> text.startsWith("AC10");
            case "dxf" -> text.startsWith("AutoCAD Binary DXF") || text.stripLeading().matches("(?s)0\\s+SECTION.*");
            case "txt" -> text.indexOf('\0') < 0;
            default -> false;
        };
    }
}
