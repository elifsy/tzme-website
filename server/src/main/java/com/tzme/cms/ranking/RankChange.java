package com.tzme.cms.ranking;

public record RankChange(String kind,Integer places,String label) {
    public static RankChange compare(String current,Integer position,String previous,Integer oldPosition) {
        if(current==null||current.isBlank())return new RankChange("pending",null,"待采集");
        if(previous==null||previous.isBlank())return new RankChange("first",null,"首次记录");
        if(current.equals("ranked")&&previous.equals("ranked")&&position!=null&&oldPosition!=null){
            int delta=oldPosition-position;
            return new RankChange(delta>0?"up":delta<0?"down":"same",Math.abs(delta),delta>0?"上升 "+delta+" 位":delta<0?"下降 "+(-delta)+" 位":"持平");
        }
        if(current.equals("ranked")&&previous.equals("not_found"))return new RankChange("entered",null,"新进榜");
        if(current.equals("not_found")&&previous.equals("ranked"))return new RankChange("left",null,"跌出监测范围");
        return new RankChange("same",null,"仍未检出");
    }
}
