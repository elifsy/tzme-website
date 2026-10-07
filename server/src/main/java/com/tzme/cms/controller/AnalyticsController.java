package com.tzme.cms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.tzme.cms.service.AnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Timestamp;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService service;
    private final JdbcTemplate jdbc;
    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    public AnalyticsController(AnalyticsService service, JdbcTemplate jdbc) { this.service=service; this.jdbc=jdbc; }
    @GetMapping("/config") public Map<String,Object> config() { return Map.of("enabled", service.enabled()); }
    @PutMapping("/config") public Map<String,Object> configure(@RequestBody JsonNode input) {
        if (!input.isObject() || input.size()!=1 || !input.path("enabled").isBoolean()) throw bad("Invalid analytics configuration");
        service.configure(input.path("enabled").asBoolean()); return config();
    }
    @PostMapping("/events") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void collect(@RequestBody JsonNode input) {
        if (!service.enabled()) return;
        var events=input.path("events");
        if (!events.isArray() || events.isEmpty() || events.size()>20) throw bad("Send 1 to 20 events");
        for (var e: events) validate(e);
        for (var e: events) service.insert(e,e.path("name").asText(),e.path("id").asText(),e.path("target").asText(""));
    }
    private void validate(JsonNode e) {
        if (!e.isObject() || e.size()>12 || !AnalyticsService.uuid(e.path("id").asText()) || !AnalyticsService.uuid(e.path("visitorId").asText()) || !AnalyticsService.uuid(e.path("sessionId").asText())) throw bad("Invalid anonymous identifier");
        if (!AnalyticsService.CLIENT_EVENTS.contains(e.path("name").asText())) throw bad("Unknown event");
        String path=text(e,"path",500);
        if (AnalyticsService.pageKey(path).isEmpty()) throw bad("Only public pages are tracked");
        if (!text(e,"locale",20).matches("[a-zA-Z][a-zA-Z0-9-]{1,19}")) throw bad("Invalid language");
        if (!Set.of("desktop","tablet","mobile").contains(text(e,"device",16))) throw bad("Invalid device");
        if (!text(e,"referrerHost",255).matches("[a-zA-Z0-9.-]+")) throw bad("Invalid source");
        text(e,"target",255);
        if (!e.path("duration").isIntegralNumber() || !e.path("duration").canConvertToInt() || e.path("duration").asInt()<0 || e.path("duration").asInt()>86400 || !e.path("scrollDepth").isIntegralNumber() || !e.path("scrollDepth").canConvertToInt() || e.path("scrollDepth").asInt()<0 || e.path("scrollDepth").asInt()>100) throw bad("Invalid engagement");
    }
    private static String text(JsonNode e,String key,int max) {
        if (!e.path(key).isTextual() || e.path(key).asText().length()>max || e.path(key).asText().chars().anyMatch(c->c<32)) throw bad("Invalid "+key);
        return e.path(key).asText();
    }
    private record Scope(String where, Object[] args, LocalDate start, LocalDate end) {}
    private Scope scope(String from,String to,String locale,String device) {
        LocalDate end, start;
        try { end=to==null?LocalDate.now(ZONE):LocalDate.parse(to); start=from==null?end.minusDays(29):LocalDate.parse(from); }
        catch (Exception e) { throw bad("Invalid date"); }
        if (start.isAfter(end) || ChronoUnit.DAYS.between(start,end)>365 || end.isAfter(LocalDate.now(ZONE))) throw bad("Choose up to 366 days through today");
        var args=new ArrayList<Object>();
        args.add(Timestamp.valueOf(start.atStartOfDay(ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime()));
        args.add(Timestamp.valueOf(end.plusDays(1).atStartOfDay(ZONE).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime()));
        String where="occurred_at>=? AND occurred_at<?";
        if (locale!=null && !locale.isBlank()) { if (!locale.matches("[a-zA-Z][a-zA-Z0-9-]{1,19}")) throw bad("Invalid language"); where+=" AND locale=?"; args.add(locale); }
        if (device!=null && !device.isBlank()) { if (!Set.of("desktop","tablet","mobile").contains(device)) throw bad("Invalid device"); where+=" AND device=?"; args.add(device); }
        return new Scope(where,args.toArray(),start,end);
    }
    private Map<String,Object> row(String sql, Scope s) { return jdbc.queryForMap(sql,s.args); }
    private List<Map<String,Object>> rows(String sql, Scope s) { return jdbc.queryForList(sql,s.args); }
    @GetMapping("/report")
    @Transactional(readOnly=true)
    public Map<String,Object> report(@RequestParam(required=false) String from,@RequestParam(required=false) String to,
        @RequestParam(required=false) String locale,@RequestParam(required=false) String device) {
        var s=scope(from,to,locale,device); String w=s.where;
        var summary=row("""
            SELECT COUNT(CASE WHEN event_name='page_view' THEN 1 END) AS pageViews,
              COUNT(DISTINCT CASE WHEN event_name='page_view' THEN visitor_id END) AS visitors,
              COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) AS sessions,
              COUNT(CASE WHEN event_name='inquiry_success' THEN 1 END) AS inquiries,
              COUNT(DISTINCT CASE WHEN event_name='inquiry_start' THEN session_id END) AS formStarts,
              COUNT(DISTINCT CASE WHEN event_name='inquiry_submit' THEN session_id END) AS submittedSessions,
              COUNT(DISTINCT CASE WHEN event_name='inquiry_success' THEN session_id END) AS convertedSessions,
              COALESCE(ROUND(AVG(CASE WHEN event_name='page_engagement' THEN duration_seconds END)),0) AS avgDuration
            FROM site_analytics_events WHERE
            """+w,s);
        // Conversion stages use the same set of visiting sessions as their denominator.
        var stageArgs=new ArrayList<>(Arrays.asList(s.args)); stageArgs.addAll(Arrays.asList(s.args));
        var stages=jdbc.queryForMap("SELECT COUNT(DISTINCT CASE WHEN event_name='inquiry_start' THEN session_id END) AS formStarts,COUNT(DISTINCT CASE WHEN event_name='inquiry_submit' THEN session_id END) AS submittedSessions,COUNT(DISTINCT CASE WHEN event_name='inquiry_success' THEN session_id END) AS convertedSessions FROM site_analytics_events WHERE "+w+" AND session_id IN (SELECT session_id FROM site_analytics_events WHERE "+w+" AND event_name='page_view')",stageArgs.toArray());
        summary.putAll(stages);
        var bounce=row("SELECT COUNT(*) AS total,COUNT(CASE WHEN views=1 THEN 1 END) AS bounced FROM (SELECT session_id,COUNT(*) AS views FROM site_analytics_events WHERE "+w+" AND event_name='page_view' GROUP BY session_id) AS visits",s);
        summary.put("bounceRate",rate(number(bounce,"bounced"),number(bounce,"total")));
        summary.put("conversionRate",rate(number(summary,"convertedSessions"),number(summary,"sessions")));
        var byDay=rows("SELECT DATE_FORMAT(occurred_at+INTERVAL 8 HOUR,'%Y-%m-%d') AS day,COUNT(CASE WHEN event_name='page_view' THEN 1 END) AS pageViews,COUNT(DISTINCT CASE WHEN event_name='page_view' THEN visitor_id END) AS visitors,COUNT(CASE WHEN event_name='inquiry_success' THEN 1 END) AS inquiries FROM site_analytics_events WHERE "+w+" GROUP BY day ORDER BY day",s);
        var days=new HashMap<String,Map<String,Object>>(); for(var day:byDay) days.put(day.get("day").toString(),day);
        var trend=new ArrayList<Map<String,Object>>();
        for(LocalDate d=s.start; !d.isAfter(s.end); d=d.plusDays(1)) trend.add(days.getOrDefault(d.toString(),Map.of("day",d.toString(),"pageViews",0,"visitors",0,"inquiries",0)));
        var pages=rows("SELECT page_path AS path,page_key AS pageKey,COUNT(CASE WHEN event_name='page_view' THEN 1 END) AS views,COUNT(DISTINCT CASE WHEN event_name='page_view' THEN visitor_id END) AS visitors,COALESCE(ROUND(AVG(CASE WHEN event_name='page_engagement' THEN duration_seconds END)),0) AS avgDuration,COALESCE(ROUND(AVG(CASE WHEN event_name='page_engagement' THEN scroll_depth END)),0) AS scrollDepth FROM site_analytics_events WHERE "+w+" GROUP BY page_path,page_key HAVING views>0 ORDER BY views DESC,path LIMIT 50",s);
        var events=rows("SELECT event_name AS name,COUNT(*) AS count,COUNT(DISTINCT visitor_id) AS visitors FROM site_analytics_events WHERE "+w+" AND event_name NOT IN ('page_view','page_engagement') GROUP BY event_name ORDER BY count DESC",s);
        var actions=rows("SELECT event_name AS name,target,COUNT(*) AS count,COUNT(DISTINCT visitor_id) AS visitors FROM site_analytics_events WHERE "+w+" AND event_name IN ('industry_filter','news_filter','cta_click','content_click','social_click','contact_click') GROUP BY event_name,target ORDER BY count DESC,name,target LIMIT 30",s);
        var sources=breakdown("referrer_host",s); var devices=breakdown("device",s); var languages=breakdown("locale",s);
        return Map.of("summary",summary,"trend",trend,"pages",pages,"events",events,"actions",actions,"sources",sources,"devices",devices,"languages",languages,"timezone","Asia/Shanghai","enabled",service.enabled());
    }
    private List<Map<String,Object>> breakdown(String column,Scope s) {
        return rows("SELECT "+column+" AS name,COUNT(*) AS views,COUNT(DISTINCT visitor_id) AS visitors FROM site_analytics_events WHERE "+s.where+" AND event_name='page_view' GROUP BY "+column+" ORDER BY views DESC,name LIMIT 20",s);
    }
    @GetMapping("/events")
    @Transactional(readOnly=true)
    public Map<String,Object> events(@RequestParam(required=false) String from,@RequestParam(required=false) String to,
        @RequestParam(required=false) String locale,@RequestParam(required=false) String device,@RequestParam(defaultValue="1") int page,@RequestParam(required=false) String name) {
        var s=scope(from,to,locale,device); String w=s.where; var args=new ArrayList<>(Arrays.asList(s.args));
        if (name!=null && !name.isBlank()) { if (!AnalyticsService.CLIENT_EVENTS.contains(name) && !name.equals("inquiry_success")) throw bad("Invalid event"); w+=" AND event_name=?"; args.add(name); }
        if (page<1 || page>1000000) throw bad("Invalid page");
        Long total=jdbc.queryForObject("SELECT COUNT(*) FROM site_analytics_events WHERE "+w,Long.class,args.toArray());
        args.add(20); args.add((page-1)*20);
        var items=jdbc.queryForList("SELECT DATE_FORMAT(occurred_at+INTERVAL 8 HOUR,'%Y-%m-%d %H:%i:%s') AS time,event_name AS name,page_path AS path,page_key AS pageKey,locale,device,referrer_host AS source,target,duration_seconds AS duration,scroll_depth AS scrollDepth FROM site_analytics_events WHERE "+w+" ORDER BY occurred_at DESC,id DESC LIMIT ? OFFSET ?",args.toArray());
        return Map.of("total",total,"items",items);
    }
    private static long number(Map<String,Object> map,String key) { return ((Number)map.get(key)).longValue(); }
    private static double rate(long numerator,long denominator) { return denominator==0?0:Math.round(numerator*10000.0/denominator)/100.0; }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
