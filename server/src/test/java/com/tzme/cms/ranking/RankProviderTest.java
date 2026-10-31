package com.tzme.cms.ranking;

import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class RankProviderTest {
    final ObjectMapper json=new ObjectMapper();
    RankKeyword keyword(){var item=new RankKeyword();item.keyword="港口机械";item.targetHost="www.tzme.net";item.device="mobile";item.searchDepth=20;return item;}
    JsonNode page(int offset,boolean relative,int match) {
        var root=json.createObjectNode();root.putObject("search_metadata").put("status","Success");var rows=root.putArray("organic_results");
        for(int n=1;n<=10;n++){var row=rows.addObject();row.put("position",relative?n:offset+n);row.put("link",offset+n==match?"https://www.baidu.com/link?url=redirect":"https://example.org/page/"+(offset+n));row.put("displayed_link",offset+n==match?"www.tzme.net › products":"example.org");}
        return root;
    }
    SerpApiRankProvider provider(JsonNode... pages){return new SerpApiRankProvider(json,"test-key-never-sent") {int index=0;@Override protected JsonNode fetchPage(RankKeyword item,int offset){return pages[index++];}};}
    @Test void relativeAndAbsolutePaginationFindRealNaturalRank() throws Exception {
        for(boolean relative:List.of(true,false)){
            var observation=provider(page(0,relative,13),page(10,relative,13)).check(keyword());
            assertThat(observation.status()).isEqualTo("ranked");assertThat(observation.position()).isEqualTo(13);
        }
    }
    @Test void exactHostMatchingNeverAcceptsLookalikeDomains() throws Exception {
        var first=page(0,true,1);((com.fasterxml.jackson.databind.node.ObjectNode)first.path("organic_results").get(0)).put("displayed_link","tzme.net.evil.example");
        var result=provider(first,page(10,true,-1)).check(keyword());assertThat(result.status()).isEqualTo("not_found");assertThat(result.position()).isNull();
        assertThat(SerpApiRankProvider.host("https://tzme.net@evil.example/")).isEmpty();
    }
    @Test void incompleteAndUnresolvedResultsAreFailuresRatherThanRankDrops() throws Exception {
        var unresolved=page(0,true,1);((com.fasterxml.jackson.databind.node.ObjectNode)unresolved.path("organic_results").get(0)).remove("displayed_link");
        assertThatThrownBy(()->provider(unresolved,page(10,true,-1)).check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class);
        assertThatThrownBy(()->provider(json.readTree("{\"search_metadata\":{\"status\":\"Error\"},\"error\":\"provider-secret-error\"}")).check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class).hasMessageNotContaining("provider-secret-error");
        assertThatThrownBy(()->provider(json.readTree("{\"search_metadata\":{\"status\":\"Success\"}}")).check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class);
    }
    @Test void repeatedPagesAndInvalidPositionsAreRejected() {
        var first=page(0,true,-1);assertThatThrownBy(()->provider(first,first).check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class);
        for(double value:List.of(0.0,1.5,11.0)){
            var invalid=page(0,true,1);((com.fasterxml.jackson.databind.node.ObjectNode)invalid.path("organic_results").get(0)).put("position",value);
            assertThatThrownBy(()->provider(invalid).check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class);
        }
    }
    @Test void emptySuccessfulResultsAreUnrankedAndMissingCredentialsAreExplicit() throws Exception {
        var empty=json.readTree("{\"search_metadata\":{\"status\":\"Success\"},\"organic_results\":[]}");
        var result=provider(empty).check(keyword());assertThat(result.status()).isEqualTo("not_found");assertThat(result.position()).isNull();
        var noKey=new SerpApiRankProvider(json,"");assertThat(noKey.configured()).isFalse();assertThatThrownBy(()->noKey.check(keyword())).isInstanceOf(RankProvider.CollectionFailure.class);
    }
    @Test void allChangeStatesUseOnlyTheTwoValidObservations() {
        assertThat(RankChange.compare("",null,"",null).kind()).isEqualTo("pending");
        assertThat(RankChange.compare("ranked",8,"",null).kind()).isEqualTo("first");
        assertThat(RankChange.compare("ranked",8,"ranked",14).places()).isEqualTo(6);
        assertThat(RankChange.compare("ranked",14,"ranked",8).label()).isEqualTo("下降 6 位");
        assertThat(RankChange.compare("ranked",8,"ranked",8).kind()).isEqualTo("same");
        assertThat(RankChange.compare("ranked",8,"not_found",null).kind()).isEqualTo("entered");
        assertThat(RankChange.compare("not_found",null,"ranked",8).kind()).isEqualTo("left");
        assertThat(RankChange.compare("not_found",null,"not_found",null).kind()).isEqualTo("same");
    }
}
