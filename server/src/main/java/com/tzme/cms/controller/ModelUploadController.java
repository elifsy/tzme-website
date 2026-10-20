package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/uploads/models")
public class ModelUploadController {
    private final Path directory;
    private final ObjectMapper mapper;
    private static final int MAX_BYTES = 40 * 1024 * 1024;
    public ModelUploadController(@Value("${tzme.upload-dir:./uploads}") String directory, ObjectMapper mapper) {
        this.directory = Path.of(directory).toAbsolutePath().normalize().resolve("models");
        this.mapper = mapper;
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > MAX_BYTES) invalid("GLB models must be between 1 byte and 40 MB");
        byte[] bytes = file.getBytes();
        if (bytes.length < 24) invalid("Invalid GLB model");
        ByteBuffer header = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        if (header.getInt(0) != 0x46546c67 || header.getInt(4) != 2 || header.getInt(8) != bytes.length || header.getInt(16) != 0x4e4f534a) invalid("Upload a GLB 2.0 model");
        int length = header.getInt(12);
        if (length <= 0 || length > bytes.length - 20) invalid("Invalid GLB JSON chunk");
        JsonNode model;
        try (var stream = new ByteArrayInputStream(bytes, 20, length)) { model = mapper.readTree(stream); }
        catch (IOException error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid GLB content"); }
        if (!"2.0".equals(model.path("asset").path("version").asText()) || !model.path("meshes").isArray() || model.path("meshes").isEmpty()) invalid("The GLB must contain equipment geometry");
        validateResources(model);
        for (JsonNode extension : model.path("extensionsRequired")) {
            if (Set.of("KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_texture_basisu").contains(extension.asText())) invalid("Export a self-contained GLB without geometry or texture compression extensions");
        }
        Files.createDirectories(directory);
        String filename = UUID.randomUUID() + ".glb";
        Files.write(directory.resolve(filename), bytes, StandardOpenOption.CREATE_NEW);
        return Map.of("url", "/api/uploads/models/" + filename);
    }
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> model(@PathVariable String filename) {
        if (!filename.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.glb")) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        Path file = directory.resolve(filename).normalize();
        if (!file.startsWith(directory) || !Files.isRegularFile(file)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("model/gltf-binary"))
                .header("X-Content-Type-Options", "nosniff").header("Cache-Control", "public, max-age=31536000, immutable")
                .body(new FileSystemResource(file));
    }
    private static void validateResources(JsonNode node) {
        if (node.isObject()) node.fields().forEachRemaining(entry -> {
            if (entry.getKey().equals("uri") && (!entry.getValue().isTextual() || !entry.getValue().asText().startsWith("data:"))) invalid("Include all textures and buffers inside the GLB file");
            validateResources(entry.getValue());
        });
        else if (node.isArray()) node.forEach(ModelUploadController::validateResources);
    }
    private static void invalid(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
