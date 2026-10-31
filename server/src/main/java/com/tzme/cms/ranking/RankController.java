package com.tzme.cms.ranking;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/seo/rankings")
public class RankController {
    private final RankService service;private final RankCollector collector;
    public RankController(RankService service,RankCollector collector){this.service=service;this.collector=collector;}
    @GetMapping("/status") public Map<String,Object> status(){return Map.of("provider","SerpApi","configured",collector.configured(),"automatic",collector.automatic(),"siteHost",service.siteHost(),"engine","baidu","depths",List.of(10,20,50,100));}
    @GetMapping("/keywords") public List<RankService.KeywordView> list(){return service.list();}
    @PostMapping("/keywords") @ResponseStatus(HttpStatus.CREATED) public List<RankService.KeywordView> create(@RequestBody RankService.CreateInput input){return service.create(input);}
    @PutMapping("/keywords/{id}") public RankService.KeywordView update(@PathVariable String id,@RequestBody RankService.UpdateInput input){return service.update(id,input);}
    @DeleteMapping("/keywords/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void archive(@PathVariable String id){service.archive(id);}
    @GetMapping("/keywords/{id}/history") public Map<String,Object> history(@PathVariable String id,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="20") int pageSize){return service.history(id,page,pageSize);}
    @PostMapping("/keywords/{id}/observations") @ResponseStatus(HttpStatus.CREATED) public RankService.KeywordView record(@PathVariable String id,@RequestBody RankService.ObservationInput input){return service.record(id,input);}
    @PostMapping("/keywords/{id}/check") public RankService.KeywordView check(@PathVariable String id){return collector.collect(id);}
    @PostMapping("/import") public Map<String,Object> imports(@RequestBody List<RankService.ObservationInput> rows){return service.importRecords(rows);}
    @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<?> error(ResponseStatusException error){return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",error.getReason()==null?"排名监测操作未完成。":error.getReason()));}
    @ExceptionHandler(DataIntegrityViolationException.class) public ResponseEntity<?> duplicate(){return ResponseEntity.status(409).body(Map.of("message","监测条件或相同时间的历史记录已存在，请刷新核对。"));}
}
