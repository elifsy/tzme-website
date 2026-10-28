// One registry for navigation, page headings, related tasks and public previews.
export const adminModules = {
  accounts: {
    label: "账号管理",
    group: "system",
    icon: "Setting",
    description:
      "维护后台管理员账号、启用状态与登录密码。其他网站维护功能对所有管理员保持一致。",
    superAdminOnly: true,
  },
  overview: {
    label: "运营工作台",
    group: "workspace",
    icon: "DataBoard",
    description:
      "维护产品、新闻和企业资料，检查首页展示、客户咨询与搜索收录设置。",
  },
  analytics: {
    label: "访问分析",
    group: "workspace",
    icon: "TrendCharts",
    description: "查看真实访问、内容点击与咨询转化。",
  },
  partners: {
    label: "合作伙伴",
    group: "company",
    icon: "Collection",
    description:
      "维护合作伙伴标志、名称、顺序与展示位置；首页和关于我们复用同一份资料。",
    steps: ["栏目文案与展示位置", "标志、名称与顺序", "预览并保存"],
    related: ["home", "about"],
    preview: "/#partners",
  },
  seo: {
    label: "搜索与 AI 展示",
    group: "pages",
    icon: "Document",
    description:
      "维护国内网站的搜索标题、摘要、公开问答和站长验证信息；已发布的企业与产品资料自动生成可读取页面。",
    steps: ["确认正式域名与企业资料", "标题、摘要与问答", "平台验证与站点地图"],
    related: ["products", "about", "contact"],
    preview: "/",
  },
  industries: {
    label: "行业分类",
    group: "content",
    icon: "Grid",
    description:
      "维护行业名称、图标与排序，再将产品关联到行业；产品中心会显示有已发布产品的行业。",
    steps: ["维护行业", "关联产品", "配置行业展示"],
    related: ["products", "product-showcase", "home"],
    preview: "/solutions",
  },
  products: {
    label: "产品资料",
    group: "content",
    icon: "Box",
    description:
      "集中维护产品介绍、图片、所属行业和首页推荐；场景文案与热点在产品中心展示中配置。",
    steps: ["名称与行业", "介绍、图片与参数", "发布与首页推荐"],
    related: ["industries", "product-showcase", "solutions"],
    preview: "/solutions",
  },
  "product-showcase": {
    label: "产品中心展示",
    group: "pages",
    icon: "Box",
    description:
      "配置产品中心首屏与各行业的标题、场景图片、设备热点和优先展示产品，实时预览桌面与手机效果。",
    steps: ["首屏全景与产品顺序", "行业文案与场景热点", "切换预览并保存"],
    related: ["industries", "products"],
    preview: "/solutions",
  },
  projects: {
    label: "项目资料",
    group: "archive",
    icon: "Collection",
    archived: true,
    description:
      "官网项目模块暂未展示。此处保留项目资料、编辑和原有展示设置，保存不会恢复官网入口。",
    steps: ["维护项目资料", "检查图片与供货范围", "保存保留资料"],
  },
  articles: {
    label: "新闻资讯",
    group: "content",
    icon: "Document",
    description:
      "维护公司新闻、展会活动与下载中心三个固定类型，保留自定义类别。下载中心支持上传资料附件，封面与发布日期必填。",
    steps: ["标题、类型与日期", "封面、正文与下载附件", "预览与发布"],
    related: ["seo"],
    preview: "/insights",
  },
  home: {
    label: "首页配置导航",
    group: "pages",
    icon: "OfficeBuilding",
    description:
      "按照官网从上到下的顺序找到配置入口，查看桌面与手机端的已保存效果。",
    preview: "/",
  },
  solutions: {
    label: "首页方案文案",
    group: "pages",
    icon: "Grid",
    description:
      "先在产品资料中选择首页推荐，再填写对应的方案标题、介绍和行业按钮。",
    steps: ["选择推荐产品", "填写方案文案", "预览行业按钮"],
    related: ["products", "industries", "home"],
    preview: "/#solutions",
  },
  capabilities: {
    label: "制造与质量流程",
    group: "pages",
    icon: "Tools",
    description: "维护栏目文案、工序名称和说明；预览支持与官网相同的工序切换。",
    steps: ["栏目标题与说明", "工序、图标与顺序", "切换预览并保存"],
    related: ["certifications", "home"],
    preview: "/#capabilities",
  },
  global: {
    label: "全球业务",
    group: "pages",
    icon: "Location",
    description:
      "维护首页与关于我们共用的业务地图、统计数据和中文介绍；中国出发点与航线沿用官网展示。",
    steps: ["业务文案与统计", "国家、城市与点位", "预览地图并保存"],
    related: ["home"],
    preview: "/",
  },
  about: {
    label: "企业介绍",
    group: "company",
    icon: "OfficeBuilding",
    description:
      "分别维护首页企业简介和关于我们页；每处文案、统计和图片独立配置。",
    steps: ["选择展示页面", "文案、统计与图片", "预览并保存"],
    related: ["contact", "certifications", "home"],
    preview: "/about",
  },
  certifications: {
    label: "资质与质量体系",
    group: "company",
    icon: "Medal",
    description: "维护证书图片或 PDF、名称及有效期，发布后展示在关于我们页面。",
    steps: ["名称与有效期", "证书图片或 PDF", "预览并发布"],
    related: ["capabilities", "about"],
    preview: "/about#certificates-title",
  },
  contact: {
    label: "企业与联系方式",
    group: "company",
    icon: "Setting",
    description:
      "维护总部、下属企业的照片及对应联系方式，联系页与页脚共用联系资料；社交链接在同页单独维护。",
    steps: ["总部与下属企业", "照片、地址与联系方式", "联系页及页脚预览"],
    related: ["about", "forms"],
    preview: "/contact",
  },
  inquiries: {
    label: "客户咨询",
    group: "communication",
    icon: "ChatDotRound",
    description: "查看客户留言与附件，更新跟进状态，并检查邮件通知结果。",
    steps: ["查看留言与附件", "跟进客户需求", "更新处理状态"],
    related: ["forms", "mail"],
  },
  forms: {
    label: "咨询表单与附件",
    group: "communication",
    icon: "Document",
    description:
      "维护表单文案、必填项、显示位置和附件限制；预览不会发送咨询或上传附件。",
    steps: ["表单文案与必填项", "显示位置与附件", "预览并保存"],
    related: ["inquiries", "mail", "contact"],
    preview: "/contact",
  },
  mail: {
    label: "邮件通知",
    group: "communication",
    icon: "Message",
    description: "填写发件设置，选择通知收件人，再启用客户咨询邮件通知。",
    steps: ["发件邮箱设置", "通知收件人", "启用并保存"],
    related: ["inquiries", "forms"],
  },
};

export const adminGroups = [
  {
    key: "workspace",
    label: "工作台",
    icon: "DataBoard",
    items: ["overview", "analytics"],
  },
  {
    key: "content",
    label: "内容管理",
    icon: "Collection",
    items: ["products", "industries", "articles"],
  },
  {
    key: "pages",
    label: "页面展示",
    icon: "Setting",
    items: [
      "home",
      "product-showcase",
      "solutions",
      "capabilities",
      "global",
      "seo",
    ],
  },
  {
    key: "company",
    label: "企业资料",
    icon: "OfficeBuilding",
    items: ["about", "certifications", "partners", "contact"],
  },
  {
    key: "communication",
    label: "客户咨询",
    icon: "ChatDotRound",
    items: ["inquiries", "forms", "mail"],
  },
  {
    key: "archive",
    label: "保留功能",
    icon: "Collection",
    items: ["projects"],
  },
  {
    key: "system",
    label: "系统管理",
    icon: "Setting",
    items: ["accounts"],
    superAdminOnly: true,
  },
].map((group) => ({
  ...group,
  items: group.items.map((key) => ({ key, ...adminModules[key] })),
}));

export const adminPath = (key) =>
  key === "overview" ? "/admin" : `/admin/${key}`;
export const publicPreviewPath = (path) => {
  const url = new URL(path || "/", window.location.origin);
  url.searchParams.set("admin-preview", "1");
  return url.pathname + url.search + url.hash;
};
