package com.tzme.cms.ranking;

import com.fasterxml.jackson.databind.*;
import com.tzme.cms.auth.*;
import com.tzme.cms.audit.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.*;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:keyword-ranks;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","spring.sql.init.mode=never","tzme.admin.username=","tzme.admin.password=","tzme.rank-monitor.automatic=false","debug=false","logging.level.root=WARN","logging.level.org.hibernate.SQL=WARN"})
@AutoConfigureMockMvc
class RankIntegrationTest {
    @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired RankKeywordRepository keywords;@Autowired RankSnapshotRepository snapshots;
    @Autowired AdminAccountRepository accounts;@Autowired PasswordEncoder passwords;@Autowired OperationLogRepository logs;@Autowired RankCollector collector;
    @MockBean RankProvider provider;
    MockHttpSession session;
    @BeforeEach void setup() throws Exception {
        snapshots.deleteAll();keywords.deleteAll();logs.deleteAll();accounts.deleteAll();reset(provider);when(provider.configured()).thenReturn(true);
        var account=new AdminAccount();account.username="ranking-editor";account.displayName="排名编辑员";account.role="ADMIN";account.mustChangePassword=false;account.passwordHash=passwords.encode("Ranking-Test-Password-2026");accounts.saveAndFlush(account);
        session=new MockHttpSession();write("POST","/api/auth/login",Map.of("username",account.username,"password","Ranking-Test-Password-2026")).andExpect(status().isOk());
    }
    String csrf() throws Exception {return json.readTree(mvc.perform(get("/api/auth/csrf").session(session)).andReturn().getResponse().getContentAsString()).path("token").asText();}
    ResultActions write(String method,String path,Object body)throws Exception{return mvc.perform(request(HttpMethod.valueOf(method),path).session(session).header("X-CSRF-TOKEN",csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));}
    JsonNode read(ResultActions result)throws Exception{return json.readTree(result.andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));}
    String create()throws Exception{return read(write("POST","/api/seo/rankings/keywords",Map.of("keyword","港口设备","devices",List.of("desktop"),"searchDepth",100)).andExpect(status().isCreated())).get(0).path("keyword").path("id").asText();}
    Map<String,Object> observation(int days,String status,Integer rank){var body=new HashMap<String,Object>();body.put("observedAt",Instant.now().minusSeconds(days*86400L).toString());body.put("status",status);body.put("position",rank);return body;}
    JsonNode record(String id,int days,String status,Integer rank)throws Exception{return read(write("POST","/api/seo/rankings/keywords/"+id+"/observations",observation(days,status,rank)).andExpect(status().isCreated()));}
    @Test void onlyAuthenticatedAdminsCanReadAndCsrfProtectsWrites()throws Exception {
        mvc.perform(get("/api/seo/rankings/keywords")).andExpect(status().isUnauthorized());mvc.perform(get("/api/seo/rankings/status")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/seo/rankings/keywords").session(session).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        var status=read(mvc.perform(get("/api/seo/rankings/status").session(session)).andExpect(status().isOk()));assertThat(status.path("automatic").asBoolean()).isFalse();assertThat(status.toString()).doesNotContain("apiKey","password","test-key");
    }
    @Test void twoDevicesRemainSeparateAndCreateHonorsDisabledState()throws Exception {
        var rows=read(write("POST","/api/seo/rankings/keywords",Map.of("keyword","港口设备","devices",List.of("desktop","mobile"),"searchDepth",50,"enabled",false)).andExpect(status().isCreated()));
        assertThat(rows.size()).isEqualTo(2);assertThat(rows.get(0).path("keyword").path("enabled").asBoolean()).isFalse();assertThat(rows.get(1).path("keyword").path("device").asText()).isEqualTo("mobile");assertThat(rows.get(0).path("change").path("kind").asText()).isEqualTo("pending");
        write("POST","/api/seo/rankings/keywords",Map.of("keyword","港口设备","devices",List.of("mobile"),"searchDepth",50)).andExpect(status().isConflict());assertThat(keywords.count()).isEqualTo(2);
    }
    @Test void duplicateCreationRollsBackBothDevicesAndInvalidDimensionsAreRejected()throws Exception {
        create();write("POST","/api/seo/rankings/keywords",Map.of("keyword","港口设备","devices",List.of("mobile","desktop"),"searchDepth",100)).andExpect(status().isConflict());assertThat(keywords.count()).isEqualTo(1);
        write("POST","/api/seo/rankings/keywords",Map.of("keyword","设备","devices",List.of("tablet"),"searchDepth",100)).andExpect(status().isBadRequest());
        write("POST","/api/seo/rankings/keywords",Map.of("keyword","设备","devices",List.of("mobile"),"searchDepth",7)).andExpect(status().isBadRequest());
    }
    @Test void upDownAndOutOfRangeHistoryUseChronologyInsteadOfInsertionOrder()throws Exception {
        String id=create();record(id,5,"ranked",28);var up=record(id,3,"ranked",12);assertThat(up.path("change").path("label").asText()).isEqualTo("上升 16 位");
        var backfill=record(id,4,"ranked",22);assertThat(backfill.path("keyword").path("latestRank").asInt()).isEqualTo(12);assertThat(backfill.path("change").path("places").asInt()).isEqualTo(10);
        var down=record(id,2,"ranked",18);assertThat(down.path("change").path("label").asText()).isEqualTo("下降 6 位");
        assertThat(record(id,1,"not_found",null).path("change").path("kind").asText()).isEqualTo("left");
        assertThat(record(id,0,"ranked",8).path("change").path("kind").asText()).isEqualTo("entered");assertThat(keywords.findById(id).orElseThrow().bestRank).isEqualTo(8);
        var history=read(mvc.perform(get("/api/seo/rankings/keywords/"+id+"/history?page=1&pageSize=2").session(session)).andExpect(status().isOk()));assertThat(history.path("total").asInt()).isEqualTo(6);assertThat(history.path("items").size()).isEqualTo(2);assertThat(history.path("chart").size()).isEqualTo(6);
    }
    @Test void invalidRanksFutureTimesAndForeignLinksNeverCreateHistory()throws Exception {
        String id=create(),path="/api/seo/rankings/keywords/"+id+"/observations";
        for(Object value:List.of(0,101,1.5,"8")){var body=observation(1,"ranked",null);body.put("position",value);write("POST",path,body).andExpect(status().isBadRequest());}
        write("POST",path,observation(1,"not_found",8)).andExpect(status().isBadRequest());
        var future=observation(1,"ranked",8);future.put("observedAt",Instant.now().plusSeconds(86400).toString());write("POST",path,future).andExpect(status().isBadRequest());
        for(String url:List.of("javascript:alert(1)","https://tzme.net.evil.example/a","https://tzme.net@evil.example/")){var body=observation(1,"ranked",8);body.put("matchedUrl",url);write("POST",path,body).andExpect(status().isBadRequest());}
        assertThat(snapshots.count()).isZero();
        var valid=observation(1,"ranked",8);valid.put("matchedUrl","https://www.tzme.net/products");write("POST",path,valid).andExpect(status().isCreated());write("POST",path,valid).andExpect(status().isConflict());assertThat(snapshots.count()).isEqualTo(1);
    }
    @Test void immutableScopeAndArchivingRetainHistoryAndCanBeRestored()throws Exception {
        String id=create();record(id,1,"ranked",4);
        var update=read(write("PUT","/api/seo/rankings/keywords/"+id,Map.of("keyword","另一个词","device","mobile","searchDepth",10,"notes","业务重点","enabled",false)).andExpect(status().isOk()));
        assertThat(update.path("keyword").path("keyword").asText()).isEqualTo("港口设备");assertThat(update.path("keyword").path("device").asText()).isEqualTo("desktop");
        write("DELETE","/api/seo/rankings/keywords/"+id,Map.of()).andExpect(status().isNoContent());assertThat(snapshots.count()).isEqualTo(1);assertThat(keywords.findById(id).orElseThrow().archived).isTrue();
        write("PUT","/api/seo/rankings/keywords/"+id,Map.of("archived",false,"enabled",true)).andExpect(status().isOk());assertThat(keywords.findById(id).orElseThrow().enabled).isTrue();
    }
    @Test void collectionErrorsRetainLastValidRankAndComparisons()throws Exception {
        String id=create();record(id,3,"ranked",24);record(id,2,"ranked",10);
        when(provider.check(any())).thenThrow(new RankProvider.CollectionFailure("接口暂不可用"));
        write("POST","/api/seo/rankings/keywords/"+id+"/check",Map.of()).andExpect(status().isBadGateway());
        var row=keywords.findById(id).orElseThrow();assertThat(row.latestRank).isEqualTo(10);assertThat(row.previousRank).isEqualTo(24);assertThat(row.bestRank).isEqualTo(10);assertThat(row.snapshotCount).isEqualTo(3);assertThat(row.lastError).isEqualTo("接口暂不可用");assertThat(row.checkingUntil).isNull();
        assertThat(snapshots.findTop200ByKeywordIdOrderByObservedAtDescIdDesc(id).get(0).status).isEqualTo("error");
        write("POST","/api/seo/rankings/keywords/"+id+"/check",Map.of()).andExpect(status().isConflict());verify(provider,times(1)).check(any());
    }
    @Test void noCredentialNeverCallsProviderOrFabricatesRanking()throws Exception {
        String id=create();when(provider.configured()).thenReturn(false);write("POST","/api/seo/rankings/keywords/"+id+"/check",Map.of()).andExpect(status().isConflict());verify(provider,never()).check(any());assertThat(snapshots.count()).isZero();
        collector.scheduled();verify(provider,never()).check(any());
    }
    @Test void successfulCollectionStoresSourceAndSafeAuditMetadata()throws Exception {
        String id=create();record(id,1,"ranked",17);when(provider.check(any())).thenReturn(new RankProvider.Observation("ranked",9,10,"https://www.tzme.net/products"));
        var result=read(write("POST","/api/seo/rankings/keywords/"+id+"/check",Map.of()).andExpect(status().isOk()));assertThat(result.path("change").path("label").asText()).isEqualTo("上升 8 位");assertThat(result.path("keyword").path("latestSource").asText()).isEqualTo("serpapi");
        var log=logs.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,"id")).get(0);assertThat(log.module).isEqualTo("rankings");assertThat(log.action).isEqualTo("check_rank");assertThat(log.targetName).isEqualTo("港口设备");
    }
    @Test void csvImportIsAtomicAndPreservesObservationSource()throws Exception {
        String id=create();var first=observation(2,"ranked",22);first.put("keywordId",id);var invalid=observation(1,"ranked",999);invalid.put("keywordId",id);
        write("POST","/api/seo/rankings/import",List.of(first,invalid)).andExpect(status().isBadRequest());assertThat(snapshots.count()).isZero();assertThat(keywords.findById(id).orElseThrow().latestStatus).isEmpty();
        var second=observation(1,"ranked",11);second.put("keywordId",id);write("POST","/api/seo/rankings/import",List.of(first,second)).andExpect(status().isOk());assertThat(snapshots.count()).isEqualTo(2);assertThat(keywords.findById(id).orElseThrow().latestSource).isEqualTo("import");assertThat(keywords.findById(id).orElseThrow().latestRank).isEqualTo(11);
    }
}
