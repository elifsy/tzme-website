package com.tzme.cms.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Map;
import java.util.Set;
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
@RequestMapping("/api/uploads/videos")
public class VideoUploadController {
    private static final long MAX_BYTES = 100L * 1024 * 1024;
    private final Path directory;

    public VideoUploadController(@Value("${tzme.upload-dir:./uploads}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize().resolve("videos");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > MAX_BYTES)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请选择不超过 100 MB 的 MP4 或 WebM 视频。");
        byte[] header;
        try (var input = file.getInputStream()) { header = input.readNBytes(4096); }
        String extension = videoExtension(header);
        if (extension == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "文件内容不是有效的 MP4 或 WebM 视频，请重新选择。");
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + "." + extension;
        Path path = directory.resolve(filename);
        try (var input = file.getInputStream(); var output = Files.newOutputStream(path, StandardOpenOption.CREATE_NEW)) {
            input.transferTo(output);
        } catch (IOException error) {
            Files.deleteIfExists(path);
            throw error;
        }
        return Map.of("url", "/api/uploads/videos/" + filename);
    }

    private static String videoExtension(byte[] header) {
        if (header.length >= 16 && new String(header, 4, 4, StandardCharsets.US_ASCII).equals("ftyp")) {
            String brand = new String(header, 8, 4, StandardCharsets.US_ASCII);
            if (Set.of("isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "dash").contains(brand))
                return "mp4";
        }
        if (header.length >= 12 && header[0] == 0x1a && header[1] == 0x45 && header[2] == (byte) 0xdf && header[3] == (byte) 0xa3
                && new String(header, StandardCharsets.ISO_8859_1).contains("webm")) return "webm";
        return null;
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> file(@PathVariable String filename) {
        if (!filename.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(mp4|webm)"))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path path = directory.resolve(filename).normalize();
        if (!path.startsWith(directory) || !Files.isRegularFile(path)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(filename.endsWith(".mp4") ? "video/mp4" : "video/webm"))
                .header("X-Content-Type-Options", "nosniff")
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .body(new FileSystemResource(path));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",
                error.getReason() == null ? "视频文件不存在。" : error.getReason()));
    }
}
