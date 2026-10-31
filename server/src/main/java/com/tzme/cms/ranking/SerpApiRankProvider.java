package com.tzme.cms.ranking;

import com.fasterxml.jackson.databind.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SerpApiRankProvider implements RankProvider {
    private final String key;
    private final ObjectMapper json;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).followRedirects(HttpClient.Redirect.NEVER).build();
    public SerpApiRankProvider(ObjectMapper json,@Value("${tzme.rank-monitor.api-key:}") String key){this.json=json;this.key=key.trim();}
    public boolean configured(){return !key.isBlank();}
    protected JsonNode fetchPage(RankKeyword keyword,int offset) throws CollectionFailure {
        if(!configured())throw new CollectionFailure("尚未配置排名数据接口，暂时无法自动采集。");
        try{
            String url="https://serpapi.com/search.json?engine=baidu&ct=2&no_cache=true&q="+URLEncoder.encode(keyword.keyword,StandardCharsets.UTF_8)+"&device="+keyword.device+"&pn="+offset+(keyword.device.equals("desktop")?"&rn=10":"")+"&api_key="+URLEncoder.encode(key,StandardCharsets.UTF_8);
            var result=http.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(18)).GET().build(),HttpResponse.BodyHandlers.ofString());
            if(result.statusCode()==401||result.statusCode()==403)throw new CollectionFailure("排名数据接口鉴权失败，请检查接口凭据。");
            if(result.statusCode()==429)throw new CollectionFailure("排名数据接口额度不足或请求过于频繁。");
            if(result.statusCode()!=200)throw new CollectionFailure("排名数据接口暂时不可用，请稍后重试。");
            return json.readTree(result.body());
        }catch(CollectionFailure error){throw error;}catch(InterruptedException error){Thread.currentThread().interrupt();throw new CollectionFailure("排名采集已中断。");}catch(Exception error){throw new CollectionFailure("排名数据接口连接失败，请稍后重试。");}
    }
    static String host(String text){
        try{
            String value=text.trim().split("[\\s›>…]",2)[0];
            URI uri=URI.create(value.startsWith("http://")||value.startsWith("https://")?value:"https://"+value);
            String host=uri.getHost();if(host==null||uri.getUserInfo()!=null)return "";
            host=host.toLowerCase(Locale.ROOT);return host.startsWith("www.")?host.substring(4):host;
        }catch(Exception ignored){return "";}
    }
    public Observation check(RankKeyword keyword) throws CollectionFailure {
        boolean unresolved=false;int checked=0;Set<String> pages=new HashSet<>();
        for(int offset=0;offset<keyword.searchDepth;offset+=10){
            JsonNode page=fetchPage(keyword,offset),results=page.path("organic_results");
            if(page.hasNonNull("error")||!page.path("search_metadata").path("status").asText().equalsIgnoreCase("Success")||!results.isArray())throw new CollectionFailure("搜索结果不完整，未更新排名，请稍后重试。");
            String fingerprint=results.toString();if(!results.isEmpty()&&!pages.add(fingerprint))throw new CollectionFailure("搜索结果分页重复，无法确认完整排名范围。");
            int found=Integer.MAX_VALUE;String foundUrl="";
            for(JsonNode item:results){
                if(!item.path("position").isIntegralNumber()||!item.path("position").canConvertToInt())throw new CollectionFailure("接口未提供有效的自然结果名次。");
                int position=item.path("position").asInt();
                if(offset>0&&position>=1&&position<=10)position+=offset;
                if(position<=offset||position>offset+10)throw new CollectionFailure("接口返回的自然结果位置不符合当前分页。");
                checked=Math.max(checked,position);String direct=item.path("link").asText(),display=item.path("displayed_link").asText();
                String directHost=host(direct),displayHost=host(display),target=host(keyword.targetHost);
                boolean directKnown=!directHost.isBlank()&&!directHost.equals("baidu.com")&&!directHost.endsWith(".baidu.com");
                boolean displayKnown=!displayHost.isBlank()&&displayHost.contains(".");
                if(!directKnown&&!displayKnown)unresolved=true;
                if((directKnown&&directHost.equals(target))||(displayKnown&&displayHost.equals(target))){
                    if(position<found){found=position;foundUrl=direct.startsWith("http://")||direct.startsWith("https://")?direct:"";}
                }
            }
            if(found!=Integer.MAX_VALUE)return new Observation("ranked",found,Math.max(found,checked),foundUrl);
            if(results.size()<10&&!page.path("serpapi_pagination").hasNonNull("next"))break;
        }
        if(unresolved)throw new CollectionFailure("部分搜索结果无法确认域名，请人工核对，未标记为跌出排名。");
        return new Observation("not_found",null,checked,"");
    }
}
