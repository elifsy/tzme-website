package com.tzme.cms.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/uploads/certificates")
public class CertificateUploadController {
    private static final Map<String, String> TYPES = Map.of(
            "pdf", "application/pdf", "jpg", "image/jpeg", "png", "image/png", "gif", "image/gif", "webp", "image/webp");
    private final Path directory;

    public CertificateUploadController(@Value("${tzme.upload-dir:./uploads}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize().resolve("certificates");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 20L * 1024 * 1024)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certificate files must be between 1 byte and 20 MB");
        byte[] bytes = file.getBytes();
        boolean pdf = bytes.length >= 8 && new String(bytes, 0, 8, StandardCharsets.US_ASCII).matches("%PDF-[12]\\.[0-9]");
        String extension = pdf ? "pdf" : UploadController.imageExtension(bytes);
        if (extension == null || (!pdf && file.getSize() > 5L * 1024 * 1024))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a PDF up to 20 MB or a JPEG, PNG, GIF or WebP image up to 5 MB");
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + "." + extension;
        Files.write(directory.resolve(filename), bytes);
        return Map.of("url", "/api/uploads/certificates/" + filename);
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> file(@PathVariable String filename) {
        if (!filename.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|png|gif|webp)"))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path path = directory.resolve(filename).normalize();
        if (!path.startsWith(directory) || !Files.isRegularFile(path))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(TYPES.get(extension)))
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .body(new FileSystemResource(path));
    }
}
