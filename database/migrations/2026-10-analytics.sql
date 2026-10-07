-- 官网访问埋点：新增匿名事件表，默认开启采集，不生成模拟访问数据。
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS site_analytics_events (
  id CHAR(36) NOT NULL PRIMARY KEY COMMENT '埋点事件唯一标识，重复上报按此标识去重',
  visitor_id CHAR(36) NOT NULL COMMENT '匿名访客标识，同一浏览器本地保存，不包含客户身份',
  session_id CHAR(36) NOT NULL COMMENT '匿名访问会话标识，连续三十分钟无操作后重新生成',
  event_name VARCHAR(32) NOT NULL COMMENT '事件名称，包含浏览、停留、点击、筛选和咨询转化',
  page_path VARCHAR(500) NOT NULL COMMENT '官网页面路径，不保存查询参数和锚点',
  page_key VARCHAR(32) NOT NULL COMMENT '页面类型，首页、列表页及产品项目新闻详情页',
  locale VARCHAR(20) NOT NULL COMMENT '事件发生时的页面语言代码',
  device VARCHAR(16) NOT NULL COMMENT '设备类型：desktop 桌面、tablet 平板、mobile 手机',
  referrer_host VARCHAR(255) NOT NULL COMMENT '首次访问来源域名，直接访问记录为 direct，不保存完整链接',
  target VARCHAR(255) NOT NULL COMMENT '操作目标业务标识，不保存咨询内容及联系方式',
  duration_seconds INT NOT NULL DEFAULT 0 COMMENT '页面在前台可见的累计停留秒数，停留事件重复上报取最大值',
  scroll_depth TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '页面最大滚动深度百分比，范围零至一百',
  occurred_at DATETIME(3) NOT NULL COMMENT '服务端接收事件时间，按 UTC 保存，后台按北京时间汇总',
  KEY idx_analytics_time_event (occurred_at, event_name),
  KEY idx_analytics_session (session_id, event_name, occurred_at),
  KEY idx_analytics_page_time (page_key, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网匿名访问埋点和咨询转化分析记录';
INSERT INTO site_settings (id,configuration) SELECT 'analytics','{"enabled":true}' WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id='analytics');
INSERT INTO app_migrations (id) SELECT '2026-10-analytics-v1' WHERE NOT EXISTS (SELECT 1 FROM app_migrations WHERE id='2026-10-analytics-v1');
