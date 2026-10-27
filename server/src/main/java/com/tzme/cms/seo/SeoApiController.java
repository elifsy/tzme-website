package com.tzme.cms.seo;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/seo")
public class SeoApiController {
    private final SeoSettingsService settings;
    private final SeoPageService pages;
    private final SeoHtmlRenderer renderer;
    public SeoApiController(SeoSettingsService settings, SeoPageService pages, SeoHtmlRenderer renderer) { this.settings=settings;this.pages=pages;this.renderer=renderer; }
    @GetMapping("/settings") public ObjectNode publicSettings(){return settings.publicView(settings.get());}
    @GetMapping("/settings/admin") public ObjectNode settings(){return settings.get();}
    @PutMapping("/settings/admin") public ObjectNode save(@RequestBody ObjectNode input){return settings.save(input);}
    @GetMapping("/page") public SeoPageService.Page page(@RequestParam(defaultValue="/") String path){return pages.document(path).page();}
    @GetMapping("/document") public SeoHtmlRenderer.Bundle document(@RequestParam(defaultValue="/") String path){return renderer.bundle(pages.document(path));}
    @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<?> error(ResponseStatusException error){return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",error.getReason()==null?"搜索展示配置暂不可用。":error.getReason()));}
}
