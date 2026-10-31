package com.tzme.cms.ranking;

public interface RankProvider {
    boolean configured();
    Observation check(RankKeyword keyword) throws CollectionFailure;
    record Observation(String status,Integer position,int checkedDepth,String matchedUrl) {}
    class CollectionFailure extends Exception { public CollectionFailure(String message){super(message);} }
}
