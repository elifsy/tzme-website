package com.tzme.cms.controller;

import com.tzme.cms.model.ArticleAttachment;
import com.tzme.cms.service.ArticleAttachmentService;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/article-attachments")
public class ArticleAttachmentController {
    private final ArticleAttachmentService attachments;
    public ArticleAttachmentController(ArticleAttachmentService attachments) { this.attachments = attachments; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ArticleAttachment upload(@RequestParam("file") MultipartFile file) throws IOException { return attachments.upload(file); }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable String id) {
        var file = attachments.downloadable(id);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).contentLength(file.getSize())
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(file.getName(), StandardCharsets.UTF_8).build().toString())
            .header("X-Content-Type-Options", "nosniff").header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(new FileSystemResource(attachments.path(file)));
    }
}
