-- MySQL 8.0+. No DROP or TRUNCATE: safe for an existing deployment.
-- 表和字段使用数据库级中文 COMMENT；已有表通过 03-comments.sql 补齐备注。
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS app_migrations (
  id VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '迁移标识，记录已执行的初始化或升级脚本',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '迁移执行时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库初始化与版本迁移记录';

CREATE TABLE IF NOT EXISTS site_content (
  db_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '数据库自增主键',
  id VARCHAR(255) NOT NULL UNIQUE COMMENT '内容业务标识，用于接口和详情页地址',
  type VARCHAR(255) NOT NULL COMMENT '内容类型：products 产品，articles 新闻',
  title VARCHAR(255) NOT NULL COMMENT '标题，兼容旧版英文数据',
  title_en VARCHAR(255) COMMENT '英文标题',
  title_zh VARCHAR(255) COMMENT '中文标题',
  category VARCHAR(255) COMMENT '分类名称，兼容旧版英文数据',
  category_en VARCHAR(255) COMMENT '英文分类名称，用于分类展示和新闻筛选',
  category_zh VARCHAR(255) COMMENT '中文分类名称',
  industry VARCHAR(255) COMMENT '首选行业标识，关联 industries.id，兼容旧版单行业数据',
  industry_ids VARCHAR(2000) COMMENT '产品关联行业标识列表，以逗号分隔，支持多个行业',
  summary VARCHAR(3000) COMMENT '摘要，兼容旧版英文数据',
  summary_en VARCHAR(3000) COMMENT '英文摘要或产品简介',
  summary_zh VARCHAR(3000) COMMENT '中文摘要或产品简介',
  image VARCHAR(255) COMMENT '封面图片地址，可使用站内路径或完整网址',
  status VARCHAR(255) COMMENT '发布状态：published 已发布，draft 草稿，deleted 已删除',
  date DATE COMMENT '发布日期，新闻列表按此日期倒序展示',
  content LONGTEXT COMMENT '正文，兼容旧版英文数据',
  content_en LONGTEXT COMMENT '英文详情正文，新闻使用富文本 HTML',
  content_zh LONGTEXT COMMENT '中文详情正文，新闻使用富文本 HTML',
  features_en TEXT COMMENT '英文产品特点，每行一条',
  features_zh TEXT COMMENT '中文产品特点，每行一条',
  specifications_en TEXT COMMENT '英文产品参数，每行一项，参数名与数值用冒号分隔',
  specifications_zh TEXT COMMENT '中文产品参数，每行一项，参数名与数值用冒号分隔',
  show_on_home BIT(1) COMMENT '产品是否在首页解决方案展示：1 是，0 否',
  home_order INT COMMENT '产品首页展示顺序，数值越小越靠前'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品信息与新闻资讯，中英文内容';

CREATE TABLE IF NOT EXISTS industries (
  id VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '行业业务标识，供产品关联和官网筛选使用',
  title_en VARCHAR(255) NOT NULL COMMENT '英文行业名称',
  title_zh VARCHAR(255) NOT NULL COMMENT '中文行业名称',
  subtitle_en VARCHAR(1000) COMMENT '英文行业简短说明',
  subtitle_zh VARCHAR(1000) COMMENT '中文行业简短说明',
  icon VARCHAR(500) DEFAULT '' COMMENT '首页服务行业图标图片地址，中英文共用，支持预设图标或上传图片，空值使用通用图标',
  sort_order INT NOT NULL COMMENT '行业展示顺序，数值越小越靠前',
  status VARCHAR(255) NOT NULL COMMENT '发布状态：published 已发布，draft 草稿，deleted 已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务行业，关联首页行业展示和产品筛选';

CREATE TABLE IF NOT EXISTS certifications (
  id VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '资质认证业务标识',
  title_en VARCHAR(255) NOT NULL COMMENT '英文资质认证名称',
  title_zh VARCHAR(255) NOT NULL COMMENT '中文资质认证名称',
  issuer_en VARCHAR(255) COMMENT '英文颁发机构名称',
  issuer_zh VARCHAR(255) COMMENT '中文颁发机构名称',
  summary_en VARCHAR(3000) COMMENT '英文资质认证说明',
  summary_zh VARCHAR(3000) COMMENT '中文资质认证说明',
  certificate_no VARCHAR(255) COMMENT '证书编号',
  issued_at DATE COMMENT '证书颁发日期',
  expires_at DATE COMMENT '证书到期日期',
  image VARCHAR(500) COMMENT '证书图片地址，可使用站内路径或完整网址',
  status VARCHAR(255) NOT NULL COMMENT '发布状态：published 已发布，draft 草稿，deleted 已删除',
  sort_order INT NOT NULL COMMENT '资质认证展示顺序，数值越小越靠前'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业资质认证，中英文证书信息';

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '项目业务标识，用于接口和项目详情页地址',
  title_en VARCHAR(255) NOT NULL COMMENT '英文项目名称',
  title_zh VARCHAR(255) NOT NULL COMMENT '中文项目名称',
  industry_en VARCHAR(255) COMMENT '英文项目行业标签',
  industry_zh VARCHAR(255) COMMENT '中文项目行业标签',
  location_en VARCHAR(255) COMMENT '英文项目所在国家或地区',
  location_zh VARCHAR(255) COMMENT '中文项目所在国家或地区',
  image_alt_en VARCHAR(255) COMMENT '英文封面图片替代文字，供屏幕阅读器使用',
  image_alt_zh VARCHAR(255) COMMENT '中文封面图片替代文字，供屏幕阅读器使用',
  summary_en VARCHAR(3000) COMMENT '英文项目摘要',
  summary_zh VARCHAR(3000) COMMENT '中文项目摘要',
  content_en LONGTEXT COMMENT '英文项目详情正文，使用富文本 HTML',
  content_zh LONGTEXT COMMENT '中文项目详情正文，使用富文本 HTML',
  capacity_label_en VARCHAR(255) COMMENT '英文处理能力指标名称',
  capacity_label_zh VARCHAR(255) COMMENT '中文处理能力指标名称',
  capacity_en VARCHAR(255) COMMENT '英文处理能力数值及单位',
  capacity_zh VARCHAR(255) COMMENT '中文处理能力数值及单位',
  technology_label_en VARCHAR(255) COMMENT '英文技术方案指标名称',
  technology_label_zh VARCHAR(255) COMMENT '中文技术方案指标名称',
  technology_en VARCHAR(255) COMMENT '英文技术方案或设备名称',
  technology_zh VARCHAR(255) COMMENT '中文技术方案或设备名称',
  scope_label_en VARCHAR(255) COMMENT '英文供货范围指标名称',
  scope_label_zh VARCHAR(255) COMMENT '中文供货范围指标名称',
  scope_en VARCHAR(255) COMMENT '英文供货范围说明',
  scope_zh VARCHAR(255) COMMENT '中文供货范围说明',
  image VARCHAR(500) COMMENT '项目封面图片地址，可使用站内路径或完整网址',
  status VARCHAR(255) NOT NULL COMMENT '发布状态：published 已发布，draft 草稿，deleted 已删除',
  sort_order INT NOT NULL COMMENT '项目列表展示顺序，数值越小越靠前',
  show_on_home BIT(1) NOT NULL COMMENT '项目是否在首页精选项目展示：1 是，0 否',
  home_order INT NOT NULL COMMENT '项目首页展示顺序，数值越小越靠前'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='真实项目，中英文卡片信息与富文本详情';

CREATE TABLE IF NOT EXISTS site_inquiries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '咨询记录自增主键',
  name VARCHAR(255) COMMENT '联系人姓名',
  company VARCHAR(255) COMMENT '客户公司名称',
  country VARCHAR(255) COMMENT '客户所在国家或地区',
  email VARCHAR(255) COMMENT '联系人邮箱',
  phone VARCHAR(255) COMMENT '联系人电话',
  industry VARCHAR(255) COMMENT '客户填写的所属行业',
  requirements VARCHAR(6000) COMMENT '客户提交的项目需求',
  status VARCHAR(255) COMMENT '咨询处理状态：new 待联系，contacted 已联系，closed 已完成',
  created_at DATETIME(6) COMMENT '咨询提交时间',
  locale VARCHAR(20) NOT NULL DEFAULT 'en' COMMENT '咨询提交时的界面语言',
  notes TEXT COMMENT '后台维护的内部跟进备注，最多 6000 字符',
  mail_status VARCHAR(32) NOT NULL DEFAULT 'disabled' COMMENT '通知状态：disabled 关闭，pending 待发送，sending 发送中，sent 已发送，failed 失败',
  mail_recipients TEXT COMMENT '本条咨询创建或重试时选中的通知收件邮箱，逗号分隔',
  mail_attempts INT NOT NULL DEFAULT 0 COMMENT '本轮邮件通知已尝试发送次数，最多自动尝试三次',
  mail_error VARCHAR(2000) NOT NULL DEFAULT '' COMMENT '通知发送失败说明，不包含账号密码',
  mail_sent_at DATETIME(6) COMMENT '邮件通知成功发送时间',
  mail_next_attempt_at DATETIME(6) COMMENT '下次发送时间，发送中表示任务锁定的截止时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网客户咨询与处理状态';

CREATE TABLE IF NOT EXISTS inquiry_attachments (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT '附件随机 UUID，同时用于附件下载地址',
  inquiry_id BIGINT COMMENT '关联的咨询主键，未提交咨询时为空',
  original_name VARCHAR(255) COMMENT '上传文件的原始名称，用于后台展示及下载',
  extension VARCHAR(20) COMMENT '经过校验的文件扩展名',
  size BIGINT NOT NULL COMMENT '附件大小，单位为字节',
  created_at DATETIME(6) COMMENT '附件上传时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询附件元数据，文件保存在上传目录的 inquiries 子目录';

CREATE TABLE IF NOT EXISTS home_global_settings (
  id BIGINT NOT NULL PRIMARY KEY COMMENT '全球业务配置主键，当前固定为 1',
  configuration LONGTEXT NOT NULL COMMENT '全球业务配置 JSON，包含中英文文案、地图点位、统计和跳转按钮'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='首页与关于我们共用的全球业务配置';

CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR(100) NOT NULL PRIMARY KEY COMMENT '官网配置标识，website 为网站基础配置，contact 为联系与咨询配置',
  configuration LONGTEXT NOT NULL COMMENT '配置 JSON；contact 包含中英文联系方式、下属企业、咨询表单、附件限制及私有邮件配置'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网多语言文案与基础展示配置';
