package com.tzme.cms.service;

import com.tzme.cms.auth.ApiAccess;
import com.tzme.cms.model.*;
import com.tzme.cms.repository.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ArticleAttachmentService {
    public static final int MAX_FILES = 10;
    public static final long MAX_SIZE = 20L * 1024 * 1024;
    private static final Set<String> TYPES = Set.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "dwg", "dxf", "jpg", "jpeg", "png");
    private static final String ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    private final ArticleAttachmentRepository files;
    private final ContentRepository content;
    private final Path directory;

    public ArticleAttachmentService(ArticleAttachmentRepository files, ContentRepository content, @Value("${tzme.upload-dir:./uploads}") String root) {
        this.files = files; this.content = content;
        directory = Path.of(root).toAbsolutePath().normalize().resolve("articles");
    }

    public List<Content> populate(List<Content> records) {
        var articles = records.stream().filter(item -> "articles".equals(item.getType())).toList();
        if (articles.isEmpty()) return records;
        var grouped = files.findByArticleIdInOrderByCreatedAtAsc(articles.stream().map(Content::getId).toList()).stream()
            .collect(Collectors.groupingBy(ArticleAttachment::getArticleId));
        articles.forEach(item -> item.setAttachments(grouped.getOrDefault(item.getId(), List.of())));
        return records;
    }

    // The client submits only a selection. Names, sizes and URLs always come from
    // server-owned upload records; attachments cannot be taken from another article.
    @Transactional
    public void bind(Content article, List<ArticleAttachment> selection) {
        if (selection == null) { populate(List.of(article)); return; }
        if (selection.size() > MAX_FILES) throw invalid("每篇资讯最多上传 10 个附件。");
        var ids = new ArrayList<String>();
        for (var item : selection) {
            if (item == null || item.getId() == null || !item.getId().matches(ID) || ids.contains(item.getId())) throw invalid("附件信息无效，请重新上传。");
            ids.add(item.getId());
        }
        var selected = ids.isEmpty() ? List.<ArticleAttachment>of() : files.findForBinding(ids);
        if (selected.size() != ids.size()) throw invalid("附件不存在，请重新上传。");
        for (var file : selected) {
            if (file.getArticleId() != null && !file.getArticleId().equals(article.getId())) throw invalid("附件已属于其他资讯，请单独上传。");
            if (!Files.isRegularFile(path(file))) throw invalid("附件文件不存在，请重新上传。");
        }
        var previous = files.findByArticleIdOrderByCreatedAtAsc(article.getId());
        for (var file : previous) if (!ids.contains(file.getId())) file.setArticleId(null);
        selected.forEach(file -> file.setArticleId(article.getId()));
        files.saveAll(previous); files.saveAll(selected);
        article.setAttachments(selected.stream().sorted(Comparator.comparing(ArticleAttachment::getCreatedAt)).toList());
    }

    public ArticleAttachment upload(MultipartFile upload) throws IOException {
        if (upload.isEmpty() || upload.getSize() > MAX_SIZE) throw invalid("附件不能为空，且单个文件不能超过 20 MB。");
        String name = Optional.ofNullable(upload.getOriginalFilename()).orElse("").replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).trim();
        if (name.isEmpty() || name.length() > 180 || name.chars().anyMatch(c -> Character.isISOControl(c))) throw invalid("文件名无效或过长。");
        String extension = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        byte[] bytes = upload.getBytes();
        if (!TYPES.contains(extension) || !matchesType(extension, bytes)) throw invalid("文件格式不支持，或文件内容与扩展名不一致。");
        var file = new ArticleAttachment(); file.setId(UUID.randomUUID().toString()); file.setName(name); file.setExtension(extension); file.setSize(bytes.length);
        Files.createDirectories(directory);
        Path destination = path(file);
        Files.write(destination, bytes, StandardOpenOption.CREATE_NEW);
        try { return files.saveAndFlush(file); }
        catch (RuntimeException error) { Files.deleteIfExists(destination); throw error; }
    }

    public ArticleAttachment downloadable(String id) {
        if (!id.matches(ID)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        var file = files.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean published = file.getArticleId() != null && content.findByIdAndType(file.getArticleId(), "articles")
            .filter(item -> "published".equals(item.getStatus())).isPresent();
        if ((!ApiAccess.authenticated() && !published) || !Files.isRegularFile(path(file))) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return file;
    }
    public Path path(ArticleAttachment file) {
        if (file.getId() == null || !file.getId().matches(ID) || !TYPES.contains(file.getExtension())) throw invalid("附件信息无效。");
        return directory.resolve(file.getId() + "." + file.getExtension());
    }
    private static boolean matchesType(String extension, byte[] bytes) {
        String header = new String(bytes, 0, Math.min(bytes.length, 1024), StandardCharsets.ISO_8859_1);
        return switch (extension) {
            case "pdf" -> header.startsWith("%PDF-");
            case "doc", "xls", "ppt" -> starts(bytes, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
            case "docx", "xlsx", "pptx", "zip" -> starts(bytes, 0x50, 0x4b, 0x03, 0x04) || starts(bytes, 0x50, 0x4b, 0x05, 0x06);
            case "dwg" -> header.matches("(?s)^AC10[0-9]{2}.*");
            case "dxf" -> header.startsWith("AutoCAD Binary DXF") || (header.stripLeading().startsWith("0") && header.contains("SECTION"));
            case "jpg", "jpeg" -> starts(bytes, 0xff, 0xd8, 0xff);
            case "png" -> starts(bytes, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
            default -> false;
        };
    }
    private static boolean starts(byte[] bytes, int... prefix) {
        if (bytes.length < prefix.length) return false;
        for (int index = 0; index < prefix.length; index++) if ((bytes[index] & 255) != prefix[index]) return false;
        return true;
    }
    private static ResponseStatusException invalid(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
