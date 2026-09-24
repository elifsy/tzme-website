export const products = [
  {
    id: "material-handling",
    title: "Material handling",
    summary:
      "Heavy duty conveying, reclaiming and bulk material handling systems.",
    category: "Conveying",
    image: "/assets/p-convey-1.jpg",
    status: "published",
  },
  {
    id: "mining-equipment",
    title: "Mining equipment",
    summary: "Reliable engineered systems for demanding mining operations.",
    category: "Mining",
    image: "/assets/p-mining-1.jpg",
    status: "published",
  },
  {
    id: "conveying",
    title: "Conveying",
    summary: "Belt, tubular and pipe conveyors for bulk materials.",
    category: "Conveying",
    image: "/assets/p-convey-1.jpg",
    status: "published",
  },
  {
    id: "port-machinery",
    title: "Port machinery",
    summary: "Efficient ship loading and unloading equipment for modern ports.",
    category: "Ports",
    image: "/assets/p-port-1.jpg",
    status: "published",
  },
  {
    id: "bridge-equipment",
    title: "Bridge equipment",
    summary: "Purpose built heavy machinery for bridge construction projects.",
    category: "Bridges",
    image: "/assets/p-bridge-1.jpg",
    status: "published",
  },
  {
    id: "metallurgy",
    title: "Metallurgy systems",
    summary: "Custom industrial equipment for metal production and processing.",
    category: "Metallurgy",
    image: "/assets/p-metal-1.jpg",
    status: "published",
  },
  {
    id: "environmental",
    title: "Environmental systems",
    summary: "Integrated systems supporting responsible industrial operations.",
    category: "Environmental",
    image: "/assets/p-env-1.jpg",
    status: "published",
  },
  {
    id: "custom-engineering",
    title: "Custom engineering",
    summary: "From early concept and fabrication to commissioning and service.",
    category: "Engineering",
    image: "/assets/p-other-1.jpg",
    status: "published",
  },
  {
    id: "tourism",
    title: "Tourism equipment",
    summary: "Specialized large scale engineering for public attractions.",
    category: "Other",
    image: "/assets/p-tour-1.jpg",
    status: "published",
  },
];
export const articles = [
  {
    id: "quality-system",
    title: "Engineering quality into every stage of delivery",
    category: "Company news",
    date: "2026-08-18",
    summary:
      "A closer look at the quality system behind complex industrial projects.",
    status: "published",
    image: "/assets/n-1.jpg",
  },
  {
    id: "port-project",
    title: "Supporting efficient operations at a major port",
    category: "Project update",
    date: "2026-07-12",
    summary: "Our team completed equipment integration and commissioning.",
    status: "published",
    image: "/assets/n-2.jpg",
  },
  {
    id: "global-partnership",
    title: "Building long term partnerships through engineering",
    category: "Industry insights",
    date: "2026-06-21",
    summary:
      "Collaboration and lifecycle support across international markets.",
    status: "published",
    image: "/assets/n-3.jpg",
  },
  {
    id: "manufacturing",
    title: "Inside our heavy equipment manufacturing capability",
    category: "Company news",
    date: "2026-05-05",
    summary: "A view of the people and processes behind reliable delivery.",
    status: "published",
    image: "/assets/n-4.png",
  },
];

const productChinese = {
  'material-handling': ['物料搬运', '输送设备', '重载输送、堆取料和散料搬运系统。'],
  'mining-equipment': ['矿山设备', '矿山', '适用于严苛矿山工况的可靠工程系统。'],
  'conveying': ['输送设备', '输送设备', '适用于散料的带式、管状及管带输送机。'],
  'port-machinery': ['港口机械', '港口', '服务现代港口的高效装卸船设备。'],
  'bridge-equipment': ['桥梁设备', '桥梁', '为桥梁建设项目定制的重型机械。'],
  'metallurgy': ['冶金系统', '冶金', '用于金属生产与加工的定制工业装备。'],
  'environmental': ['环保系统', '环保', '支持负责任工业运营的集成系统。'],
  'custom-engineering': ['定制工程', '工程设计', '从方案设计、制造到调试与服务。'],
  'tourism': ['旅游设施', '其他', '面向公共景区的大型专用工程装备。'],
}
const articleChinese = {
  'quality-system': ['将工程质量融入交付的每个阶段', '公司新闻', '了解复杂工业项目背后的质量管理体系。'],
  'port-project': ['助力大型港口高效运营', '项目动态', '我们的团队完成了设备集成与调试。'],
  'global-partnership': ['以工程实力建立长期合作伙伴关系', '行业洞察', '跨国际市场的协作与全生命周期支持。'],
  'manufacturing': ['走进我们的重型装备制造能力', '公司新闻', '了解可靠交付背后的人员与流程。'],
}
for (const product of products) {
  const [titleZh, categoryZh, summaryZh] = productChinese[product.id]
  Object.assign(product, { titleEn: product.title, titleZh, categoryEn: product.category, categoryZh, summaryEn: product.summary, summaryZh })
}
for (const article of articles) {
  const [titleZh, categoryZh, summaryZh] = articleChinese[article.id]
  Object.assign(article, { titleEn: article.title, titleZh, categoryEn: article.category, categoryZh, summaryEn: article.summary, summaryZh, contentEn: article.content || '', contentZh: '' })
}
