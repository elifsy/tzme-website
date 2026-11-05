const step = (title, description, target = '.admin-heading', options = {}) => ({ title, description, target, ...options });

// Each sidebar function owns a short course. Steps stay within that function.
export const adminTutorials = {
  overview: [
    step('从工作台开始', '这里汇总内容维护与待处理事项，可按当天的工作选择入口。教程只介绍当前功能，不会一次带你走遍后台。', '.admin-welcome'),
    step('关注待处理事项', '先查看客户咨询、待完善的产品与新闻资料，再进入对应功能处理。数字来自当前网站的数据。', '.admin-workbench-stats'),
    step('随时选择教程', '右上角的新手教程可以选择任意功能重新学习。每个功能首次进入时会单独开启一次；完成或跳过后不再自动开启。', '[data-admin-tour="tutorial-entry"]'),
  ],
  analytics: [
    step('选择统计范围', '先选择日期范围，查看网站在这段时间内的真实访问情况。没有数据时，先确认官网已有实际访问。', '.analytics-filters'),
    step('查看访问与转化', '结合页面访问、内容点击和咨询提交，了解访客关注的内容。不同指标的统计口径可以在页面说明中核对。', '.admin-content .el-tabs'),
    step('维护采集设置', '顶部开关控制是否记录访问与行为，切换后立即生效。关闭采集会保留历史数据，切换统计日期也不会改变历史记录。', '.analytics-collection'),
  ],
  rankings: [
    step('添加监测关键词', '为需要观察的词分别设置百度电脑端、手机端和目标网站，可以从产品名称与业务词开始。'),
    step('查看排名升降', '排名变化与上一次有效结果比较，并保留历史趋势。尚未查询、查询失败和未进入监测范围的结果会分别显示。', '.admin-content .el-table'),
    step('查询与录入结果', '自动查询需要服务端配置数据接口。也可以录入实际结果，先核对日期、设备和命中页面，再保存。', '.keyword-rank-toolbar'),
  ],
  products: [
    step('查找或新增产品', '通过名称、行业与发布状态找到产品，点击编辑维护资料。下一步会打开一份未保存的草稿，认识填写位置。', '.admin-actions .el-button--primary'),
    step('填写名称、类型与行业', '填写中文名称、产品类型，并关联适用行业。同一产品可以关联多个行业，供产品中心筛选使用。', '[data-admin-tour="content-basics"]', { editor: 'products', tips: ['教程不会自动保存或发布这份草稿。'] }),
    step('上传图片并设置发布', '添加封面和设备展示图，选择适合设备外形的详情页布局。资料未完成时保存为草稿；确认预览后再发布或设置首页推荐。', '[data-admin-tour="content-publish"]', { editor: 'products' }),
  ],
  industries: [
    step('维护行业信息', '这里配置行业名称、图标、介绍和顺序。行业负责分类，具体设备在产品资料中维护。'),
    step('关联已有产品', '新增行业后，还需在产品资料中关联该行业。官网只展示有已发布产品的行业，空行业不会出现在筛选入口。', '.admin-content .el-table'),
    step('发布与核对顺序', '检查行业状态和排序，再通过查看已保存网页核对官网入口。行业首屏标题与热点在产品中心展示中配置。', '.admin-workflow-guide'),
  ],
  articles: [
    step('管理新闻与下载资料', '公司新闻、展会活动和下载中心是常驻类型。下一步会打开下载资料草稿，展示主要填写位置。', '.admin-actions .el-button--primary'),
    step('填写标题、类型与日期', '选择内容类型，填写中文标题和实际发布日期。新闻正文与摘要分别填写；下载资料可以只填写必要的中文说明。', '[data-admin-tour="content-basics"]', { editor: 'downloads' }),
    step('为下载中心上传附件', '选择下载中心类型后，在资料附件中上传手册或其他下载文件。附件与封面分别上传，上传完成后仍需保存这条资讯。', '[data-admin-tour="article-attachments"]', { editor: 'downloads' }),
    step('补齐封面再发布', '资讯封面为必填。可先预览排版，保存为草稿或发布；教程不会代替你保存正文或附件。', '[data-admin-tour="content-publish"]', { editor: 'downloads' }),
  ],
  home: [
    step('按首页顺序找到入口', '这里按照官网从上到下排列配置入口，方便找到首屏、企业简介、行业方案、制造流程、资质与全球业务。', '.admin-homepage-banner'),
    step('进入对应功能维护', '每个模块标明管理入口。点击后在对应功能内编辑，避免在多个地方重复填写相同资料。', '.admin-homepage-modules'),
    step('核对已保存的效果', '查看已保存网页可检查官网实际效果，并切换电脑与手机视图。未保存的表单修改不会自动应用到官网。', '.admin-homepage-preview'),
  ],
  'product-showcase': [
    step('选择全景或具体行业', '先选择正在配置的场景，全景与各行业分别维护标题、说明、按钮和展示内容。', '.showcase-editor-toolbar'),
    step('设置场景与设备热点', '配置对应行业图片、热点与优先展示产品。热点应关联真实产品，位置在预览中核对。', '.admin-content .cms-editor-panel'),
    step('检查两端效果并保存', '切换电脑和手机预览，核对标题、热点与产品顺序后保存。设备自身的图片和介绍仍在产品资料中维护。', '.admin-save-bar'),
  ],
  solutions: [
    step('确认首页推荐来源', '首页方案与首页推荐产品、所属行业关联。先确认产品资料中的推荐设置，再维护此处文案。'),
    step('填写标题、介绍与按钮', '按行业填写方案标题、简洁介绍和按钮文字，描述实际制造与供货能力。', '.admin-content .cms-editor-panel'),
    step('预览对应关系', '核对图片、文案和行业按钮是否匹配，确认后保存当前配置。', '.admin-save-bar'),
  ],
  capabilities: [
    step('维护制造与质量栏目', '填写栏目标题和说明，围绕产品质量、客户图纸与技术要求介绍制造和交付。', '.admin-content .cms-editor-panel'),
    step('配置各环节说明', '逐项维护需求确认、材料准备、焊接加工等环节的名称、顺序和说明。预览可切换查看各环节。', '.capabilities-step-list'),
    step('核对并保存', '确认每个环节的描述准确，再保存配置。资质文件在资质与质量体系中维护。', '.admin-save-bar'),
  ],
  global: [
    step('维护业务文案与统计', '首页与关于我们共用这份全球业务资料，标题、说明和统计数据在这里维护。', '.admin-content .cms-editor-panel'),
    step('配置国家与城市', '添加真实业务地点并核对位置和中文名称。地图以中国天津附近为出发点，向其他地点显示航线。', '.global-editor-aside .cms-editor-panel'),
    step('预览地图并保存', '检查点位、名称与统计信息在电脑和手机上的效果，确认后保存。', '.admin-save-bar'),
  ],
  seo: [
    step('确认域名与企业资料', '中文站正式域名为 www.tzme.net。先核对企业名称、网站地址和公开联系资料。', '.admin-content .el-tabs'),
    step('填写搜索展示内容', '维护页面标题、摘要和公开问答，确保与实际产品和业务一致。具体产品与资讯也可以单独配置搜索信息。', '.seo-page-grid'),
    step('保存并检查公开页面', '平台验证与站点地图帮助搜索引擎发现网站。保存后核对公开展示，收录和排名需要后续持续观察。', '.admin-save-bar'),
  ],
  about: [
    step('先选择展示页面', '首页企业简介和关于我们首屏分别维护，先确认当前选择的是哪一个页面。', '.about-settings-tabs'),
    step('填写介绍与统计', '维护中文标题、公司介绍和统计数据。数字与单位分别填写，完整公司介绍可以分段展示。', '[data-admin-tour="about-text"]'),
    step('使用视频或图片', '关于我们首屏支持 MP4 / WebM 视频，最大 100 MB。有视频时优先静音自动播放，没有视频则显示图片；图片同时作为备用画面。', '.video-upload', { to: '/admin/about?page=about', tips: ['上传完成后还需要保存当前配置。'] }),
    step('预览后保存', '核对电脑与手机排版，再保存当前配置。查看已保存网页可确认官网最终效果。', '.admin-save-bar'),
  ],
  certifications: [
    step('新增或编辑资质', '维护证书名称、有效期、顺序和发布状态，可上传 PDF 或图片文件。', '.cert-manager .card-heading'),
    step('补齐证书文件', '待补充文件的资质需要先上传对应文件，再发布或设置首页展示。列表状态会提示需要完善的内容。', '.cert-manager .cert-table-actions'),
    step('选择首页展示资质', '只有已发布且文件完整的资质才能开启首页展示。改回草稿会自动取消首页展示，关于我们仍按发布状态展示资质。', '.cert-manager .el-switch'),
  ],
  partners: [
    step('维护栏目与展示位置', '合作伙伴在首页和关于我们复用同一份资料，先确认栏目文案和展示位置。', '.admin-content .cms-editor-panel'),
    step('上传标志并排序', '为每个伙伴填写名称并上传清晰标志，核对显示比例、顺序和启用状态。', '.partner-settings-list'),
    step('预览后保存', '切换电脑与手机预览，检查标志的清晰度和排列后保存。', '.admin-save-bar'),
  ],
  contact: [
    step('维护总部与企业资料', '联系页和页脚共用联系方式，先选择总部或对应企业，再编辑照片和联系信息。', '.admin-content .el-tabs'),
    step('让照片与联系方式匹配', '填写名称、地址、电话、邮箱与说明，核对照片对应的基地或总部。社交链接在本页单独维护。', '.admin-content .cms-editor-panel'),
    step('检查联系页和页脚', '预览联系页与页脚，确认资料准确后保存。咨询表单与邮件通知在各自功能中配置。', '.admin-save-bar'),
  ],
  inquiries: [
    step('筛选客户咨询', '按状态与关键词找到客户留言，先查看新提交的需求。'),
    step('查看需求与附件', '打开咨询详情，核对客户联系方式、项目需求和上传附件。客户资料仅在管理后台查看。', '.admin-content .el-table'),
    step('更新跟进状态', '根据实际沟通进度更新处理状态，并检查通知结果，避免遗漏客户需求。', '.admin-workflow-guide'),
  ],
  forms: [
    step('配置咨询表单', '这里维护咨询表单字段、提示和提交后的说明，首页与联系页共用同一份配置。', '.admin-content .el-tabs'),
    step('核对必填与上传说明', '按实际需要设置字段，检查必填项、行业选择和附件提示，避免让客户重复填写。', '.admin-content .cms-editor-panel'),
    step('预览并保存', '检查电脑和手机上的填写效果，再保存配置。客户提交的记录在客户咨询中处理。', '.admin-save-bar'),
  ],
  mail: [
    step('配置邮件通知', '先填写发送服务与接收通知的邮箱。邮箱密码属于服务端私密配置，请使用实际可用的授权信息。', '.mail-settings-grid'),
    step('检查接收人与发送服务', '核对新咨询通知的接收人、启用状态和 SMTP 配置。修改后需要保存才会生效，已保存的密码无需重复填写。', '.admin-save-bar'),
    step('查看通知记录', '保存后切换到通知记录，核对实际咨询邮件的发送结果。若失败，按错误提示核对服务地址、端口与授权信息，再处理重发。', '.mail-manager-tabs'),
  ],
  projects: [
    step('保留项目资料', '官网真实项目模块目前隐藏，此处用于维护和保留资料。保存不会自动恢复官网项目入口。'),
    step('完善项目内容', '维护项目名称、所属行业、图片与供货范围，确保与实际交付一致。', '.admin-content .el-table'),
    step('检查后保存', '核对图片和描述后保存资料，未完成内容可以保留为草稿。', '.admin-workflow-guide'),
  ],
  logs: [
    step('查看人员操作记录', '日志记录后台人员的登录和维护操作，便于了解何人何时进行了哪些修改。'),
    step('按条件查找操作', '使用操作人、时间、模块与结果筛选，打开详情查看对应记录。', '.operation-log-filters'),
    step('核对操作结果', '结合时间、对象与结果排查问题。日志只供查看，不提供编辑或删除。', '.admin-content .el-pagination'),
  ],
  accounts: [
    step('管理维护人员账号', '只有超级管理员可以使用此功能，普通管理员的其他网站维护权限保持一致。'),
    step('添加或修改账号', '填写用户名、显示名称与初始密码。新账号首次登录需要修改初始密码。', '.admin-content .el-table'),
    step('停用与重置密码', '可根据人员变化停用、删除账号或重置密码。相关变更会使原有会话失效，操作记录可在日志中查看。', '.admin-accounts-note'),
  ],
};
