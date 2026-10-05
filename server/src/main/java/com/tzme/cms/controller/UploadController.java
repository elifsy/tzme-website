package com.tzme.cms.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads/images")
public class UploadController {
    private static final long MAX_SIZE = 5 * 1024 * 1024;
    private static final Map<String, String> TYPES = Map.of(
            "jpg", "image/jpeg", "png", "image/png", "gif", "image/gif", "webp", "image/webp");
    private final Path directory;

    public UploadController(@Value("${tzme.upload-dir:./uploads}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > MAX_SIZE)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Images must be between 1 byte and 5 MB");
        byte[] bytes = file.getBytes();
        String extension = imageExtension(bytes);
        if (extension == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, GIF and WebP images are supported");
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + "." + extension;
        Files.write(directory.resolve(filename), bytes);
        return Map.of("url", "/api/uploads/images/" + filename);
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> image(@PathVariable String filename) {
        if (!filename.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|gif|webp)"))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path path = directory.resolve(filename).normalize();
        if (!path.startsWith(directory) || !Files.isRegularFile(path))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(TYPES.get(extension)))
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .body(new FileSystemResource(path));
    }

    private static String imageExtension(byte[] bytes) {
        if (bytes.length < 12) return null;
        if ((bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return "jpg";
        if ((bytes[0] & 0xff) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) return "png";
        String header = new String(bytes, 0, 12, StandardCharsets.US_ASCII);
        if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "gif";
        if (header.startsWith("RIFF") && header.substring(8).equals("WEBP")) return "webp";
        return null;
    }
}
