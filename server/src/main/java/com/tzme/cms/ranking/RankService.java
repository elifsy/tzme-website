package com.tzme.cms.ranking;

import com.tzme.cms.seo.SeoSettingsService;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RankService {
    private final RankKeywordRepository keywords;
    private final RankSnapshotRepository snapshots;
    private final SeoSettingsService seo;
    public RankService(RankKeywordRepository keywords,RankSnapshotRepository snapshots,SeoSettingsService seo){this.keywords=keywords;this.snapshots=snapshots;this.seo=seo;}
    public record CreateInput(String keyword,List<String> devices,int searchDepth,String notes,Boolean enabled){}
    public record UpdateInput(Boolean enabled,Boolean archived,String notes){}
    public record ObservationInput(String keywordId,Instant observedAt,String status,@JsonDeserialize(using=StrictRankDeserializer.class) Integer position,String matchedUrl,String notes){}
    public record KeywordView(RankKeyword keyword,RankChange change){}
    public String siteHost(){return URI.create(seo.get().path("siteUrl").asText()).getHost().toLowerCase(Locale.ROOT);}
    public List<KeywordView> list(){return keywords.findAllByOrderByCreatedAtDesc().stream().map(this::view).toList();}
    public KeywordView view(RankKeyword keyword){return new KeywordView(keyword,RankChange.compare(keyword.latestStatus,keyword.latestRank,keyword.previousStatus,keyword.previousRank));}
    public RankKeyword get(String id){return keywords.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"关键词监测不存在。"));}
    private RankKeyword lock(String id){return keywords.lock(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"关键词监测不存在。"));}
    static String text(String input,int max,boolean required){
        String value=input==null?"":input.trim();if(value.length()>max||(required&&value.isBlank())||value.chars().anyMatch(c->Character.isISOControl(c)&&c!='\n'))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"填写内容为空、过长或包含不支持的字符。");return value;
    }
    private String monitorKey(String word,String device,String host,int depth){
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((Normalizer.normalize(word,Normalizer.Form.NFKC).toLowerCase(Locale.ROOT)+"\n"+device+"\n"+host+"\n"+depth).getBytes(StandardCharsets.UTF_8)));}catch(Exception error){throw new IllegalStateException(error);}
    }
    @Transactional public List<KeywordView> create(CreateInput input){
        String word=text(input.keyword(),160,true).replaceAll("\\s+"," "),notes=text(input.notes(),1000,false),host=siteHost();
        if(input.devices()==null||input.devices().isEmpty()||input.devices().size()>2||new HashSet<>(input.devices()).size()!=input.devices().size()||!Set.of("desktop","mobile").containsAll(input.devices())||!Set.of(10,20,50,100).contains(input.searchDepth()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"请选择有效的终端和监测范围。");
        if(keywords.count()+input.devices().size()>200)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"最多保存 200 个监测条件。");
        var created=new ArrayList<KeywordView>();
        for(String device:input.devices()){
            String key=monitorKey(word,device,host,input.searchDepth());if(keywords.existsByMonitorKey(key))throw new ResponseStatusException(HttpStatus.CONFLICT,"该关键词、终端和检查范围已存在，归档记录可恢复监测。");
            var item=new RankKeyword();item.keyword=word;item.notes=notes;item.device=device;item.targetHost=host;item.searchDepth=input.searchDepth();item.monitorKey=key;item.enabled=!Boolean.FALSE.equals(input.enabled());
            created.add(view(keywords.saveAndFlush(item)));
        }return created;
    }
    @Transactional public KeywordView update(String id,UpdateInput input){
        var item=lock(id);if(input.notes()!=null)item.notes=text(input.notes(),1000,false);if(input.enabled()!=null)item.enabled=input.enabled();if(input.archived()!=null)item.archived=input.archived();if(item.archived)item.enabled=false;item.updatedAt=Instant.now();return view(keywords.saveAndFlush(item));
    }
    @Transactional public void archive(String id){update(id,new UpdateInput(false,true,null));}
    private void refresh(RankKeyword item){
        var latest=snapshots.valid(item.id,PageRequest.of(0,2));
        if(!latest.isEmpty()){var first=latest.get(0);item.latestStatus=first.status;item.latestRank=first.position;item.latestObservedAt=first.observedAt;item.latestSource=first.source;item.matchedUrl=first.matchedUrl;}
        if(latest.size()>1){item.previousStatus=latest.get(1).status;item.previousRank=latest.get(1).position;}
        item.bestRank=snapshots.best(item.id);item.snapshotCount=snapshots.countByKeywordId(item.id);item.updatedAt=Instant.now();keywords.saveAndFlush(item);
    }
    private RankSnapshot manual(RankKeyword item,ObservationInput input,String source){
        if(input.observedAt()==null||input.observedAt().isAfter(Instant.now().plusSeconds(60))||input.observedAt().isBefore(Instant.parse("2000-01-01T00:00:00Z")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"请填写实际采集时间，不能录入未来的排名。");
        String status=input.status();if(!Set.of("ranked","not_found").contains(status==null?"":status)||(status.equals("ranked")&&(input.position()==null||input.position()<1||input.position()>item.searchDepth))||(status.equals("not_found")&&input.position()!=null))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"名次须在监测范围内；未检出时不要填写名次。");
        String url=text(input.matchedUrl(),2000,false);
        if(!url.isEmpty()){
            try{URI uri=URI.create(url);if(!Set.of("http","https").contains(uri.getScheme())||uri.getUserInfo()!=null||!SerpApiRankProvider.host(url).equals(SerpApiRankProvider.host(item.targetHost))||!status.equals("ranked"))throw new IllegalArgumentException();}catch(Exception error){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"命中链接需属于当前监测网站，且仅在查到排名时填写。");}
        }
        Instant observed=input.observedAt().truncatedTo(ChronoUnit.MICROS);
        if(snapshots.existsByKeywordIdAndObservedAt(item.id,observed))throw new ResponseStatusException(HttpStatus.CONFLICT,"该关键词在相同采集时间已有记录，请先核对历史。");
        var row=new RankSnapshot();row.keywordId=item.id;row.observedAt=observed;row.status=status;row.position=status.equals("ranked")?input.position():null;row.checkedDepth=item.searchDepth;row.matchedUrl=url;row.notes=text(input.notes(),1000,false);row.source=source;return row;
    }
    @Transactional public KeywordView record(String id,ObservationInput input){
        var item=lock(id);snapshots.saveAndFlush(manual(item,input,"manual"));refresh(item);return view(item);
    }
    @Transactional public Map<String,Object> importRecords(List<ObservationInput> input){
        if(input==null||input.isEmpty()||input.size()>500)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"一次导入 1–500 条实际排名记录。");
        Set<String> changed=new HashSet<>();int line=1;
        for(var entry:input){
            try{var item=lock(text(entry.keywordId(),36,true));snapshots.saveAndFlush(manual(item,entry,"import"));changed.add(item.id);}catch(ResponseStatusException error){throw new ResponseStatusException(error.getStatusCode(),"第 "+line+" 条："+error.getReason());}line++;
        }
        for(String id:changed)refresh(lock(id));return Map.of("imported",input.size(),"keywords",changed.size());
    }
    public Map<String,Object> history(String id,int page,int pageSize){
        var keyword=get(id);if(page<1||page>1000000||pageSize<1||pageSize>100)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"历史分页参数不正确。");
        var history=snapshots.findByKeywordIdOrderByObservedAtDescIdDesc(id,PageRequest.of(page-1,pageSize));
        return Map.of("keyword",view(keyword),"items",history.getContent(),"total",history.getTotalElements(),"chart",snapshots.findTop200ByKeywordIdOrderByObservedAtDescIdDesc(id));
    }
    @Transactional public RankKeyword claim(String id){
        var item=lock(id);Instant now=Instant.now();
        if(item.archived||!item.enabled)throw new ResponseStatusException(HttpStatus.CONFLICT,"请先恢复或启用该关键词监测。");
        if((item.checkingUntil!=null&&item.checkingUntil.isAfter(now))||(item.lastAttemptAt!=null&&item.lastAttemptAt.isAfter(now.minusSeconds(60))))throw new ResponseStatusException(HttpStatus.CONFLICT,"该关键词正在采集或刚刚采集，请稍后再试。");
        item.checkingUntil=now.plusSeconds(300);item.lastAttemptAt=now;keywords.saveAndFlush(item);return item;
    }
    @Transactional public KeywordView finish(String id,RankProvider.Observation result,String error){
        var item=lock(id);var row=new RankSnapshot();row.keywordId=id;row.observedAt=Instant.now();row.source="serpapi";
        if(error!=null){row.status="error";row.error=text(error,200,false);row.checkedDepth=0;item.lastError=row.error;}
        else{row.status=result.status();row.position=result.position();row.checkedDepth=result.checkedDepth();row.matchedUrl=text(result.matchedUrl(),2000,false);item.lastError="";}
        snapshots.saveAndFlush(row);item.checkingUntil=null;refresh(item);return view(item);
    }
    public List<String> due(){
        Instant cutoff=Instant.now().minus(1,ChronoUnit.DAYS);
        return keywords.findAll().stream().filter(item->item.enabled&&!item.archived&&(item.lastAttemptAt==null||item.lastAttemptAt.isBefore(cutoff))&&(item.latestObservedAt==null||item.latestObservedAt.isBefore(cutoff))&&(item.checkingUntil==null||item.checkingUntil.isBefore(Instant.now()))).sorted(Comparator.comparing(item->item.lastAttemptAt,Comparator.nullsFirst(Comparator.naturalOrder()))).limit(10).map(item->item.id).toList();
    }
}
