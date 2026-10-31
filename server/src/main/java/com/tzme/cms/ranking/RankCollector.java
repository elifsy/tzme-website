package com.tzme.cms.ranking;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RankCollector {
    private final RankService service;
    private final RankProvider provider;
    private final boolean automatic;
    public RankCollector(RankService service,RankProvider provider,@Value("${tzme.rank-monitor.automatic:false}") boolean automatic){this.service=service;this.provider=provider;this.automatic=automatic;}
    public boolean configured(){return provider.configured();}
    public boolean automatic(){return automatic&&configured();}
    public RankService.KeywordView collect(String id){
        if(!configured())throw new ResponseStatusException(HttpStatus.CONFLICT,"尚未配置排名数据接口，可先录入或导入实际查询结果。");
        var keyword=service.claim(id);RankProvider.Observation observation;
        try{observation=provider.check(keyword);}catch(Exception error){String message=error instanceof RankProvider.CollectionFailure?error.getMessage():"采集暂时失败，请稍后重试。";service.finish(id,null,message);throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,message+" 已保留上次有效排名。");}
        return service.finish(id,observation,null);
    }
    @Scheduled(fixedDelay=900000,initialDelay=120000) public void scheduled(){
        if(!automatic())return;
        for(String id:service.due()){try{collect(id);}catch(ResponseStatusException ignored){}}
    }
}
