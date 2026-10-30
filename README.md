# TZME 官网与管理后台

Vue 3 + Vite + Element Plus，Java 17 + Spring Boot 3 + MySQL。官网页面按页面分文件，公共导航组件为 `src/components/SiteNav.vue`。

## 数据来源

官网与后台的产品、新闻、行业、资质、项目、全球业务配置、咨询记录全部通过 Java API 读取 MySQL。官网中文文案、图片地址、公司统计和联系方式存入 `site_settings`，先从数据库加载，再注入 vue-i18n，模板继续使用 `$t`。

读取失败会显示错误和重新加载按钮。写入失败保留表单，只有服务器保存成功才显示成功。浏览器仅保存界面偏好；旧版业务缓存仅用于后台的迁移入口，不作为页面数据或保存回退。

基础数据包含当前数据库中已保存的修改及此前页面的初始内容，保存在 `database/install.sql`。本次已导入本机数据库，初始化前的 SQL 备份位于 `database/snapshots/before-baseline.sql`，备份目录不会提交 Git。

## 后台填写与预览

后台按工作任务分为工作台、内容管理、页面展示、企业资料、客户咨询；超级管理员另有“系统管理 → 账号管理”。入口 `/admin` 提供常用任务、真实资料数量和待跟进咨询；`/admin/home` 按官网顺序列出配置入口，并提供已保存首页的完整预览。菜单、页面说明、填写步骤和关联入口统一维护于 `src/data/adminWorkspace.js`。

推荐路径为：维护行业 → 录入产品并选择所属行业 → 设置首页推荐及顺序 → 填写对应方案文案 → 完善企业与质量资料。产品列表支持搜索、发布状态和首页推荐筛选，`/admin/products?home=1` 可直接查看已选推荐产品。新增产品与资讯默认草稿，填写后可预览，再选择保存草稿或发布。

企业图文和联系方式在 `/admin/contact` 维护；咨询表单文案、必填项、展示位置及附件限制移至独立入口 `/admin/forms`。表单与联系方式仍使用原有联系配置 API 和数据库结构，切换入口时会提醒未保存修改。

首页方案、制造与质量、企业介绍、全球业务、企业资料、咨询表单及产品/资讯编辑支持填写内容预览。预览可切换 1440 px 桌面视口和 390 px 手机视口并放大查看，按视口应用官网响应式样式；产品与资讯为填写内容预览。配置页使用底部固定保存入口；关闭编辑、刷新数据、切换模块和离开页面时保护未保存内容。图片上传完成后仍需保存。

后台嵌入的已保存页面携带 `admin-preview=1`，不会采集访问统计；预览内链接、提交及文件选择被拦截，咨询表单预览也独立停用提交、上传和咨询埋点。各处“查看已保存网页”可在新标签页核对官网。此次整理无需新增数据库迁移。

## 产品详情展示

产品详情根据设备形态使用三种浅色布局：A 左文右景、B 开放式展台、C 宽幅场景；默认按透明设备图中主体的长宽比例自动匹配。高瘦及低矮宽厚设备使用 A，方正设备使用 B，细长设备及索道系统使用 C。取消产品周围的围框和装饰轨道，采用渐隐地面与柔和接地阴影；桌面鼠标移动时有小幅设备、投影及地面视差，手机与减少动态效果设置下静止，后台预览使用相同规则。现有 33 款产品已配置主体边界数据；新增或更换图片后在加载时识别主体，并缓存结果。仅在页面中等比排版。索道展示图已补充缆绳、支撑塔、轮组及多节轿厢，为参考现有项目照片制作的系统示意，原始项目照片继续保留。产品介绍、编号特点、技术参数和相关设备继续共用；章节导航支持固定定位及直接链接，电脑和手机均只显示一个咨询入口。文案和参数沿用后台产品记录，未填写的特点、参数及对应目录自动隐藏；案例参数保留“项目案例”等限定说明。

在 `/admin/products` 编辑产品，“封面与发布”中分别维护列表封面和可选的“详情页设备展示图”。展示图建议使用透明背景 PNG / WebP，未填写或加载失败时使用现有封面原图；点击设备图仍可查看原始现场照片。后台桌面、手机实时预览与官网使用同一展示组件，未保存修改不会应用到官网。

同一区域的“详情页布局”可选择“自动匹配设备比例”或手动指定 A／B／C，右侧实时预览随选择变化，保存后应用到官网。布局字段为 `site_content.detail_layout`，API 对应 `detailLayout`：`auto` 为自动、`vertical` 为 A、`exhibit` 为 B、`panorama` 为 C。兼容历史 `platform` 值，前台及编辑器均按 A 展示，不需要改动已有记录；旧客户端不传该字段时保留现有选择，显式传空字符串重置为自动。升级脚本为 `database/migrations/2026-10-20-product-layout.sql`，Java 启动时自动执行 `21-product-layout-schema.sql`，保留现有产品内容和之后的布局选择；全量安装 SQL 已同步。生成脚本为 `node scripts/build-product-layout-migration.mjs`。主体数据位于 `src/data/equipmentPresentationImages.json`，索道素材位于 `public/assets/tzme-j/products/presentation/ropeway-cutout.webp`，运行与构建不依赖 `docs/`。

独立图片字段为 `site_content.presentation_image`，API 字段为 `presentationImage`。升级脚本为 `database/migrations/2026-10-19-product-presentation.sql` 与 `database/migrations/2026-10-20-product-cutouts.sql`，Java 启动自动执行 `17-product-presentation-schema.sql`、`18-product-presentation.sql` 和 `19-product-cutouts.sql`；完整安装 SQL 和生成脚本已同步。官网目录中的 33 款产品均配置透明设备展示图，保存在 `public/assets/tzme-j/products/presentation/`，来源映射见 `database/baseline/product-presentation-images.json`。原始现场照片继续用于列表封面和大图预览。旧版客户端不传该字段时保留现有配置，显式传空字符串可清除；迁移仅执行一次，保留之后的后台替换或清除操作。

## 本机启动

前端使用 Node.js 22.13 或更新版本，在项目根目录启动：

```powershell
npm install
npm run dev
```

默认地址：http://localhost:5173 ，管理后台：http://localhost:5173/admin 。

另开一个 PowerShell 窗口启动 Java：

```powershell
powershell -ExecutionPolicy Bypass -File server/run.ps1
```

Java 默认使用 8080 端口，连接默认数据库 `tzme_corporate`。脚本优先使用当前进程环境变量，缺失时读取之前保存的 Windows 用户环境变量。

本机 MySQL 未注册为 Windows 服务时，启动命令：

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe' "--defaults-file=$env:LOCALAPPDATA\MySQL84\my.ini" --console
```

如 Java 改用其他端口，请同时设置前端 `.env.local` 中的 `VITE_API_TARGET`，例如 `http://127.0.0.1:8081`，再重启 Vite。本次修改后需要重新启动 Java 和前端。

## 数据库初始化与部署

完整说明见 [database/README.md](database/README.md)。

1. 使用 MySQL 8 执行 `database/00-create-database.sql` 建库。
2. 配置部署环境账号、密码和 JDBC 地址。
3. 执行 `database/install.sql`，或直接启动 Java 由应用执行相同初始化脚本。
4. 部署前端构建文件，设置 Java 的 `TZME_FRONTEND_DIR` 指向该目录，按 `deploy/nginx.conf` 代理 HTML 页面与 API，并保留上传图片目录。

基础 SQL 有初始化标记：重复导入、重启服务均不会覆盖后台修改或恢复删除数据。Hibernate 默认使用 `validate`，后续表结构升级通过新增 SQL 迁移完成。

| 环境变量 | 用途 / 默认值 |
| --- | --- |
| `TZME_DB_URL` | Java JDBC 连接地址，默认 `127.0.0.1:3306/tzme_corporate` |
| `TZME_DB_USER` | Java / 数据库脚本账号，Java 默认 `tzme_app` |
| `TZME_DB_PASSWORD` | 必须由部署环境提供 |
| `SERVER_PORT` | Java 端口，默认 `8080` |
| `TZME_SQL_INIT_MODE` | 默认 `always`；手动完成初始化后可设为 `never` |
| `TZME_UPLOAD_DIR` | 上传图片持久目录，默认相对启动目录的 `./uploads` |
| `TZME_DB_HOST / PORT / NAME` | 导入导出脚本使用，默认 `127.0.0.1 / 3306 / tzme_corporate` |
| `VITE_API_TARGET` | Vite 开发 / 预览 API 代理地址，默认 `http://127.0.0.1:8080` |

`.env.example` 提供配置示例。Vite 自动加载前端的 `.env.local`；Java 与数据库脚本需要进程环境变量，不能仅将密码写进前端配置文件。

生产构建：

```sh
npm ci
npm run build
cd server
mvn -DskipTests package
java -jar target/tzme-cms-1.0.0.jar
```

部署 `dist/` 到 Nginx 静态资源目录，同时让 Java 通过 `TZME_FRONTEND_DIR` 读取其中的 `index.html`。Nginx 示例在 [deploy/nginx.conf](deploy/nginx.conf)：静态资源由 Nginx 提供，公开 HTML、robots、站点地图和 API 由 Java 提供；不存在的页面保留真实 404。Java 进程从 `server` 目录启动时，开发默认目录为 `../dist`；生产示例为 `/var/www/tzme`。数据库保存图片地址；`public/assets/` 包含内置图片，后台上传目录需随站点备份和迁移。国内 SEO/GEO 的完整发布步骤见 [deploy/seo-launch.md](deploy/seo-launch.md)。

## 国内 SEO / GEO

正式中文版域名为 `https://www.tzme.net`。服务器从当前 MySQL 中读取已发布资料，直接返回中文标题、摘要、主体内容、真实链接及结构化资料，Vue 加载后接管交互。相同 URL 对普通访客、百度、360、搜狗等抓取程序返回相同内容。后台保存产品、企业介绍、联系方式或搜索配置后，新请求立即使用最新资料。

后台入口为 **页面展示 → 搜索与 AI 展示**（`/admin/seo`），所有管理员均可维护。基础页面可分别填写标题与摘要；产品、资讯及有已发布产品的行业自动生成，也可单独覆盖。制造服务问答支持增删、排序、分段回答及显示开关，显示在关于我们、产品中心、产品详情和联系页面；问题与回答同步用于 FAQ 结构化资料。ICP备案号仅在填写真实号码后显示工信部查询链接。百度、必应、360、搜狗提供的标签验证 `content` 值在同一入口填写，保存后出现在初始 HTML 中。

公开入口：`/robots.txt`、`/sitemap.xml`、`/site-map`、`/llms.txt`。站点地图只列出已发布产品、资讯、基础页面和有产品的行业；隐藏的项目模块、后台、草稿、已删除及不存在的详情页不进入地图。不存在或未发布的详情页返回 404；旧产品分类路径和尾斜杠路径重定向至规范地址。搜索、筛选、分页及 `admin-preview` 页面不建立重复索引；产品返回路径与常见推广参数保留交互，规范链接指向干净的产品地址。

元数据通过 `/api/seo/page` 供 Vue 路由切换使用，公开基础配置通过 `/api/seo/settings` 提供；完整配置使用受登录保护的 `GET/PUT /api/seo/settings/admin`。配置保存在 `site_settings` 的 `seo` 记录，默认源为 `server/src/main/resources/seo-defaults.json`。升级脚本 `26-seo-settings.sql` 仅初始化缺失配置，保留后续后台修改；`node scripts/build-seo-settings-migration.mjs` 同步生成升级 SQL，`npm run db:build` 同时包含完整安装 SQL。结构化资料包含企业、网页、面包屑、产品、资讯与可见问答，价格、评价和修改日期不做补造。

公开 HTML 嵌入的数据只来自公开配置与已发布记录，沿用公开联系资料并排除邮件通知配置。管理账号、密码、客户咨询及附件均不进入页面或资料索引。Java 使用前端构建的模板标记生成页面，模板缺失或旧版构建不满足要求时返回 503，避免把空白页面作为正常内容收录。开发服务器和 `npm run preview` 使用相同资料接口生成首屏 HTML；首屏资料复用于 Vue 初始化，减少重复读取。图片、字体、PDF 资源和既有三维设备素材继续使用项目本地资源。

SEO 集成测试位于 `server/src/test/java/com/tzme/cms/seo/SeoIntegrationTest.java`，运行 `mvn test` 使用 H2 内存数据库验证源码可读性、发布状态、规范链接、真实 404、问答、权限和脚本转义。前端正常构建命令仍为 `npm run build`；可用 Maven 属性 `-Dtzme.package-name=tzme-cms-seo` 生成独立包名，方便在现有服务运行时准备验证包。

## 导入、备份、更新基础数据

当前 Windows 环境，在项目根目录：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/database.ps1 -Action import
powershell -ExecutionPolicy Bypass -File scripts/database.ps1 -Action export
npm run db:build
```

导出生成 `database/snapshots/export.sql` 和 `current.json`。SQL 备份用于恢复到空数据库。更新基础 JSON 和 SQL 的步骤见数据库说明。源码中的初始数据文件仅用于生成基础 SQL，运行时不参与业务数据读取。

旧版浏览器有未同步修改时，管理后台会显示迁移入口，可先查看并导出 JSON 备份，再将修改导入 MySQL。失败记录保留供重试。迁移后导出数据库即可在 SQL 中保存这些修改。

## 管理功能

- 产品：中文详情、特点、参数、多行业关联、首页展示及排序，首页最多 5 个。
- 行业：维护中文名称和说明，同步官网首页与产品筛选。
- 新闻：中文富文本、分类、发布日期、图片和发布状态；保留独立资讯列表与详情页，首页不展示新闻模块；详情目录由正文标题生成。
- 资质：名称、说明、颁发机构、证书编号、有效期、图片、排序及发布状态。
- 项目：保留卡片字段、中文富文本详情、图片、排序及原首页展示设置；官网首页项目模块和公共导航/页脚入口暂隐藏，项目数据及独立页面保留，首页不再加载项目列表。
- 全球业务：官网首页和关于我们共用配置，支持图片或点亮地图，中文位置名称，最多 100 个位置。
- 咨询：客户提交到数据库，后台查看并维护处理状态。
- 企业与联系方式：维护中文总部信息、联系邮箱、下属企业及排序，统一更新首页、联系我们与关于我们；下属企业可分别选择“在联系我们显示”和“在关于我们显示”。咨询表单与附件在独立入口维护。
- 咨询附件：官网真实上传和下载，允许类型、单个文件大小（1～50 MB）、数量（1～10 个）及开关均由后台配置；后台只读查看客户信息和附件，仅修改处理状态，服务端也拒绝修改客户提交内容。
- 邮件通知：独立入口 `/admin/mail`，配置 SMTP 发件邮箱及最多 20 个收件邮箱，可分别启用。咨询先保存，通知异步发送并最多自动尝试 3 次；在发送记录中查看状态并再次通知。

地图轮廓为本地 SVG 渲染资源。位置选项初始化后由数据库提供，支持搜索国家、地区和城市，已补充阿布扎比、迪拜，台湾名称统一为“中国台湾”。两个城市沿用地图投影，并在公共地图的邻近标记提示中一并显示；后台仍单独编辑各个位置。中国标点以天津附近为位置，连线与轮船出发点跟随该标点。`src/data/mapLocations.js` 维护城市预设与中国标点坐标，`scripts/build-map-locations-migration.mjs` 生成 `22-global-map-locations.sql` 及 `23-china-map-tianjin.sql`，Java 启动和完整安装脚本均已接入。迁移只执行一次，保留既有地点、自定义文案与统计配置。运行时不依赖第三方地图服务。本站固定使用中文；英文访问入口跳转到独立英文官网。

## 图片上传

后台的产品、新闻、资质、项目和地图图片通过点击选择或拖放上传，支持预览、替换，并显示当前图片尺寸。新闻与项目的富文本正文通过工具栏的图片上传按钮插入图片。

支持 JPG / PNG / GIF / WebP，单张不超过 5 MB。下列尺寸也显示在各个上传位置，供准备图片时参考；其他尺寸可以上传，不会强制拉伸或裁切上传文件。

| 图片用途 | 推荐尺寸（像素） | 建议 |
| --- | --- | --- |
| 产品封面 | 1200 × 800 | 横图，主体居中，留出裁切空间 |
| 产品详情设备展示图 | 1600 × 1600 | 可选，透明背景 PNG / WebP，保持完整设备与原始比例 |
| 新闻封面 | 1600 × 900 | 16:9 横图，避免边缘文字 |
| 项目封面 | 1600 × 900 | 展示设备与现场，主体居中 |
| 资质证书 | 1240 × 1754 | A4 竖图，保留原始比例、文字清晰 |
| 全球业务地图 | 1600 × 700 | 横向地图，推荐透明 PNG |
| 富文本正文 | 1200 × 800 | 保持原始比例，高度按内容调整 |

已有图片会继续显示。上传完成后需要保存当前表单，图片才会应用到官网；移除图片只会清空表单中的图片引用。图片文件通过 Java 上传接口保存在 `TZME_UPLOAD_DIR`，数据库保存图片地址。部署与备份时需同时保留上传目录，单独导入 SQL 不包含上传的图片文件。

## 行业图标

在后台“行业分类”的新增或编辑弹窗中上传行业图标，左侧维护内容与图片，右侧预览首页行业条目。图标显示在首页“服务行业”的名称左侧，各页面共用；原有行业点击跳转和产品筛选仍使用行业 ID。

推荐 128 × 128 px 的透明浅色 PNG，支持 JPG / PNG / GIF / WebP，最大 5 MB。上传完成后保存才会应用到官网；可替换或清除图片，清除后使用通用行业图标。现有五个行业提供随项目部署的默认图标。

图标地址保存在 `industries.icon`，带中文字段备注。Java 重启时自动执行 `06-industry-icons.sql`，已有数据库也可单独导入 `database/migrations/2026-10-industry-icons.sql`。迁移只在首次升级时补充缺失的默认图标，保留自定义图片及之后的清除操作；全量部署 SQL 已同步更新。

## 首页能力配置

入口为 `/admin/capabilities`（侧栏“制造与质量流程”）。可维护中文栏目小标题、两行主标题、区域说明、步骤名称及每个步骤的工序说明；支持区域显示开关、背景图片上传，以及最多 8 个流程步骤的新增、删除、排序和隐藏。展示编号按可见步骤的顺序自动生成。新增步骤默认隐藏，填写中文名称后开启展示；区域开启时至少保留一个可见步骤。

官网“制造与质量”流程支持鼠标悬停、点击及手机触摸切换说明，支持键盘方向键、Home / End 切换，选中状态与说明对应同一步骤。进入视口时逐项轻量呈现；系统启用减少动态效果时停用动效。工序说明最多 600 字，留空时展示步骤标题和资质入口，后台预览支持相同交互。

说明存储于 `site_settings` 的 `capabilities.steps[].description.zh`，按稳定步骤 ID 关联。基础数据为 `database/baseline/capability-process-details.json`，生成脚本为 `node scripts/build-capability-process-migration.mjs`；Java 自动执行 `15-capability-process.sql`，也可导入 `database/migrations/2026-10-16-capability-process.sql`。首次迁移仅为名称仍匹配的原步骤补充缺失说明；重复执行保留后台修改。旧客户端省略说明时按步骤 ID 保留已保存内容，显式清空则保留为空。完整安装 SQL 已同步。

步骤可选择内置图标或上传自定义图片，图标与展示状态各页面共用。推荐图标 128 × 128 px 的透明深色或蓝色 PNG，背景图推荐 1600 × 900 px，上传最大 5 MB。左侧配置、右侧实时预览，可切换桌面和手机视口；上传完成后保存才会应用到首页。

配置通过 `/api/home-capabilities` 读写 MySQL `site_settings` 中 `id='capabilities'` 的独立 JSON，不影响联系和邮件配置。基础数据保存在 `database/baseline/home-capabilities.json`，保留现有六个流程步骤。Java 重启时自动执行 `07-home-capabilities.sql`，也可单独导入 `database/migrations/2026-10-home-capabilities.sql`；首次初始化优先沿用数据库中首页原有文案与图片，重复执行保留后台修改。全量部署 SQL 已更新。

## 联系与咨询配置

企业与联系方式：`/admin/contact`；咨询表单与附件：`/admin/forms`；咨询管理：`/admin/inquiries`；邮件通知：`/admin/mail`。初始配置沿用目前官网信息，保存在 `database/baseline/contact-settings.json`，运行时读取 MySQL 中的 `site_settings`，标识为 `contact`。

“总部与下属企业”页签统一维护企业照片、展示标题、简介、图片说明及对应的地址、电话、邮箱与网站。关于我们页面每家企业使用一张完整卡片，总部在前，其余按后台顺序展示；企业图片与联系方式随同一条记录排序、隐藏或删除，新增企业也可配置。展示标题留空使用企业名称，照片留空显示文字资料。右侧可切换关于我们和联系我们的实时预览，保存后更新官网。

照片资料分别保存在 `contact.facility` 和 `subsidiaries[].facility`，下属企业按稳定 ID 关联。初始资料位于 `database/baseline/contact-facilities.json`，使用现有 `public/assets/tzme-j/factories/` 中的图片；替换图片使用后台上传。Java 启动自动执行 `13-contact-facilities.sql`；已有数据库也可导入 `database/migrations/2026-10-16-contact-facilities.sql`。首次升级只补充缺失的照片与介绍，保留联系方式、顺序、显示开关、已有配置及邮件通知；重复执行保留后台修改与清除操作。生成脚本为 `node scripts/build-contact-facilities-migration.mjs`，全量安装 SQL 已同步。

在“企业与联系方式 → 社交链接”中维护中文官网页脚的图标、提示名称、跳转地址、顺序和显示状态，右侧提供实时预览。最多 8 个链接，支持 LinkedIn、YouTube、X、微信、微博、哔哩哔哩、Facebook、Instagram 和其他链接。官网仅展示已开启且 URL 有效的条目。初始链接及新增链接默认关闭，填写真实的完整 HTTP/HTTPS 地址并开启后保存即可展示；历史英文配置保留。

选择“其他链接”后可填写自定义链接名称，并上传自定义图标；名称用于鼠标提示与无障碍标签。推荐 128 × 128 px 的透明浅色 PNG，也支持 JPG / GIF / WebP，最大 5 MB。开启展示时名称必填；图标选填，未上传或加载失败时使用默认链接图标。上传期间暂停保存，完成后保存配置才会应用到官网。

社交链接保存在 `site_settings.contact` 配置的 `contact.socialLinks` 中，语言代码对应独立列表。`database/migrations/2026-10-social-links.sql` 只补充缺失的社交链接配置，保留已保存的联系方式、社交链接与 SMTP 设置；Java 重启时也会自动执行。

联系方式与通知收件邮箱分别维护。联系邮箱公开展示在网站；在独立的“邮件通知”功能中配置 SMTP 服务器、端口、连接安全方式、发件邮箱、账号和密码或授权码，再选择收件邮箱并启用通知。保存后的密码不回显，留空保留已有密码，也可以勾选清除。两处配置分别保存，保留对方已保存的内容。

通知每 15 秒从数据库队列处理，失败最多尝试 3 次；关闭通知不会影响咨询入库。邮件正文包含客户原始咨询内容与附件名称，附件通过后台下载。在“邮件通知 → 发送记录”中点击“再次通知”，发送给当前启用的邮箱。SMTP 尚未配置时默认不发送邮件。发送结果只更新通知字段，允许同时维护咨询的处理状态。

附件通过 `/api/inquiry-attachments` 上传，文件保存在 `TZME_UPLOAD_DIR/inquiries/`，元数据保存在 `inquiry_attachments`。服务器核对文件扩展名、格式特征、大小与关联数量。上传目录需与数据库一起备份。Java 和 Nginx 的请求上限设为 51 MB；普通后台图片仍限制为 5 MB。

已有数据库升级脚本为 `database/migrations/2026-10-contact-inquiries.sql`，可重复执行并保留已保存配置。Java 启动时也会自动执行迁移；修改后请重新启动 Java 服务。本机迁移前的备份为 `database/snapshots/before-contact.sql`。

## 官网埋点与数据分析

后台入口：`/admin/analytics`（侧栏“访问分析”）。默认开启官网采集，可以在分析页暂停或恢复，已有数据始终保留。官网每分钟更新一次采集开关。

- 自动采集官网页面浏览、前台可见停留时间、最大滚动深度、导航与主要按钮点击、内容详情点击、行业与新闻分类筛选、翻页、社交及联系方式点击、语言切换。
- 咨询表单记录开始填写、发起提交和失败；成功咨询由 Java 在咨询入库事务提交后记录，后台修改处理状态不会改变成功数。不会记录表单内容、邮箱、电话或 IP。
- 支持近 7 / 30 / 90 天、自定义日期（最多 366 天）、语言和设备筛选；展示 PV、UV、访问次数、平均停留、跳出率、咨询数与转化率。
- 趋势图支持鼠标和键盘查看每天的数据、切换表格和导出 CSV；同时展示咨询转化路径、热门页面与操作、来源域名、语言及设备分布。事件明细使用 Element Plus 分页，每页 20 条。

访客按浏览器本地匿名标识去重；会话按标签页标识、30 分钟无操作划分。统计按北京时间汇总，以服务器接收时间为准。筛选、翻页和同页切换语言不额外增加 PV；平均停留只计算已上报的页面前台可见时间。浏览器禁止跟踪或网络中断可能导致少计，统计口径在分析页有说明。

数据保存到 MySQL `site_analytics_events`，字段均带中文备注，采集开关保存于 `site_settings` 的 `analytics` 配置。Java 默认启动时执行 `08-analytics.sql` 创建表及索引，部署 SQL 已同步更新；若关闭了应用自动初始化，请先执行 `database/migrations/2026-10-analytics.sql`。分析只显示实际采集数据，没有模拟历史访问。修改后重新启动 Java 并刷新官网及后台。

## 官网产品与行业资料（2026-10-20）

资料来源：[TZME 官网产品目录](https://www.tzmeglobal.com/products)。已逐页核对全部 6 页，现保留与官网一一对应的 33 款产品，输送机沿用 `conveying` 记录。早期概括性产品及官网目录中没有的条目共 11 项，已按后台删除状态剔除，不再出现在前台和产品管理列表；首页推荐位及方案文案转移至对应官网产品，3D 展示产品引用同步更新。保留现有 10 个有产品数据的行业，首页 Banner 下的行业入口及方案页筛选继续读取数据库。

本次核对清单位于 `database/baseline/product-catalog-sync.json`；运行 `node scripts/build-product-catalog-sync-migration.mjs` 生成 `database/migrations/2026-10-20-product-catalog-sync.sql` 和 Java 启动迁移 `20-product-catalog-sync.sql`。迁移只执行一次，保留产品名称、中文文案、原图、行业关联和后续后台编辑；重复启动不会恢复已剔除条目，也不会阻止以后在后台新增产品。历史种子保留，新安装按顺序应用迁移后得到同样的 33 款产品目录。

中文产品名称、介绍与特点由对应官网资料翻译整理，英文资料一并保存。来源链接、原分类、与现有产品的对应关系及资料缺项说明位于 `database/baseline/official-products.json`。未公开的数值规格不补写；奥斯麦特熔炼炉原页面重复企业简介，因此只采用已确认的名称、分类与图片。

官网实拍图片保存于 `public/assets/tzme-products/`，行业图标沿用 `public/assets/industry-icons/`。运行和构建均不依赖官网 CDN 或被忽略的 `docs/` 目录。

`node scripts/build-official-products-migration.mjs` 生成增量迁移 `database/migrations/2026-10-15-official-products.sql` 和 Java 的 `11-official-products.sql`；`npm run db:build` 同时更新完整安装 SQL。Java 启动会自动执行该迁移。迁移仅补入缺失记录及行业关联，保留已编辑内容、删除标记与首页推荐，重复执行不会重复添加。本机导入前的备份保存在 Git 忽略的 `database/snapshots/before-official-products-2026-10-15/`。

## 官网宣传定位

中文官网宣传以产品质量、制造工艺、检验与交付为核心，避免将独立设计、概念方案或研发作为服务承诺。首页能力流程默认为“需求确认、材料准备、焊接加工、装配试装、质量检验、包装交付”，仍可在首页能力配置中编辑；企业介绍、全球业务、方案文案与企业卡片仍通过原后台入口维护。

本次文案调整记录于 `database/baseline/quality-positioning.json`，生成脚本为 `node scripts/build-quality-positioning-migration.mjs`。Java 自动执行 `14-quality-positioning.sql`；现有数据库也可导入 `database/migrations/2026-10-16-quality-positioning.sql`。迁移仅首次更新仍等于已知原文案的中文字段，流程按稳定 ID 关联，保留自定义文案、英文资料、图片、排序、显示状态及邮件配置，重复执行保留后台修改。完整安装 SQL 已包含该迁移。历史基础种子保持原状，新安装按顺序应用迁移后使用新的文案。

## 首页方案文案配置

后台入口：`/admin/solutions`（页面配置 → 首页方案）。可以分别编辑中文模块小标题、模块主标题、全部方案按钮文字，以及每个产品的小标题、主标题和描述；主标题支持换行。产品的首页展示开关、顺序与图片仍在产品管理中维护。

产品专用文案优先显示，留空时沿用对应语言的行业默认文案，再使用产品名称与简介。按钮跳转只能选择产品关联的已发布行业，按钮文字使用该行业的副标题或名称，在行业管理中修改。后台同时提供选中方案的效果预览。

配置通过 `GET/PUT /api/home-solutions` 读写 MySQL `site_settings` 的 `home-solutions` 记录。前端 `src/data/homeSolutions.js` 仅保留数据校验和展示逻辑，不再存放固定业务文案。初始配置保存在 `database/baseline/home-solutions.json`，沿用改版后的现有文案。

`node scripts/build-home-solutions-migration.mjs` 生成 `database/migrations/2026-10-15-home-solutions.sql` 与 Java 的 `12-home-solutions.sql`；完整安装 SQL 和 Java 自动初始化已接入。迁移只在配置缺失时写入初始值，重复执行及重启保留后台修改。上线时部署新的前后端文件，并先执行迁移或重启新版 Java 服务。

## API

产品中心页面位于 `/solutions`，采用可点选的行业场景与产品目录。配置入口为后台 **页面展示 → 产品中心展示**（`/admin/product-showcase`），在此维护中文首屏文案、场景图片、设备热点、各行业专属展示和优先展示产品；行业名称、图标、发布状态和排序仍在行业分类中维护，产品及行业关联仍在产品资料中维护。编辑时可预览桌面、手机、行业切换与热点，草稿行业可在后台预览，官网仅展示已发布且有已发布产品的行业。

场景配置存储于 MySQL `site_settings` 的 `product-showcase` 记录，初始值在 `server/src/main/resources/product-showcase-defaults.json`。执行 `node scripts/build-product-showcase-migration.mjs` 可生成增量初始化 SQL；Java 启动自动执行 `16-product-showcase.sql`，重复启动保留已有后台修改。`npm run db:build` 会将其包含在完整安装 SQL 中。三维选项保存在 `overview.threeD`，已有配置在读取时补入缺失的默认选项，旧客户端保存时保留已存的三维设置。

产品中心使用 Three.js 绘制可交互的行业设备全景，所有已发布且有已发布产品的行业同时展示。目前根据设备照片搭建了港口卸船机、堆取料机、冶金电炉、能源钢结构、架桥机、摩天轮、门式起重机、沉淀设备传动装置、钢结构厂房和质量扫描仪十组示意模型。设备融入连续工业岛，采用港湾、船舶、道路、堆场、护岸和不同标高的场地连接，按主次与前后关系错落布置；设备标签跟随空间位置并自动避让。支持拖动环绕和设备特写中的自由旋转，进入特写时隐藏岛体环境。全景和特写中的鼠标滚轮均滚动网页，缩放使用右上角加减按钮，保留双指和键盘加减缩放；按钮缩放受各自视角的距离限制。“复位”旁的缩放操作不会切换行业或改变筛选。点击三维设备或行业标签直接切换对应行业，同步下方行业筛选和产品目录，标签显示选中状态；产品资料可通过目录卡片进入，图片展示保留产品热点。“复位”同时恢复工业岛全景、全部设备、行业、产品分类、搜索词和分页。没有单独配置热点的行业自动关联代表产品。三维模块按需加载，静止及离开可视区域时停止持续绘制，离开页面时清理 WebGL 资源；缺少 WebGL2、上下文丢失或关闭三维功能时使用从实际工业岛渲染导出的备用图片，产品目录保持可用。

后台 **产品中心展示 → 首屏行业全景 → 行业设备全景** 可开关三维功能、为各个有产品资料的行业上传 GLB 2.0 模型。已移除自由漫游、镜头巡游和全屏入口，旧配置中的巡游字段兼容保留但不再使用。模型需自包含贴图及缓冲数据，单文件不超过 40 MB，导出时取消几何与贴图压缩；也可使用正常项目路径 `/assets/.../*.glb`。替换模型自动居中并按展示范围缩放，加载失败时保留内置示意模型。上传模型保存在已有上传目录下的 `models/` 中，受现有 Git 忽略规则保护。三维场景建模及渲染逻辑在 `src/three/`，新增行业尚无专属模型时先显示钢结构模块，可在后台替换。原场景图片位于 `public/assets/tzme-j/scenes/`；原始素材与效果预览保存在被 Git 忽略的 `docs/` 中。

本地服务运行时，`node scripts/check-product-showcase.mjs` 检查行业、搜索、筛选、详情返回、移动端布局和配置保存。保存验证会恢复原配置，不发送咨询；报告与截图输出到被 Git 忽略的 `docs/product-showcase-2026-10-17/`。

鼠标悬停三维设备或行业标签时，对应设备会高亮并展示小幅运行动作：斗轮和摩天轮转动、吊机与架桥机小车往返、电炉电极升降、检测头移动及沉淀设备刮臂转动。静态钢结构与后续上传的模型使用检验扫光，不改变设备地基与场地位置。移开后平稳恢复，拖动、复位、滚出视野或离开页面时清理交互状态；键盘焦点也可预览，减少动画偏好下仅保留静态高亮。手机端沿用触摸旋转和点击行业，不触发悬停循环。

悬停与点击采用按设备缓存的整体空间区域，覆盖细杆、桁架与部件间隙，边界保留小幅退出缓冲；设备动作不会改变感应区域，替换 GLB 后重新计算。特写的鼠标和触摸拖动持续请求刷新。小部件动作复用静态投影，阴影仅在模型和展示模式变化时更新；摩天轮吊舱与玻璃合并为三组实例绘制，保持吊舱竖直，特写限制像素密度以控制绘制开销。

`node scripts/check-industrial-motion.mjs` 验证部件动作、复位、相邻设备材质隔离、减少动画偏好与模型替换资源清理；`node scripts/check-industrial-layout.mjs` 验证设备的道路和海岸间距。

`node scripts/check-industrial-regions.mjs` 验证桁架空隙、边界缓冲、遮挡、隐藏状态、模型替换、实例模型与空间变换下的感应区域；设备特写中的区域检测不需要逐个检测模型三角面。

`node scripts/check-three-showcase.mjs` 额外验证实际 WebGL2 绘制、旋转、设备特写、标签与行业筛选联动、键盘复位、手机布局、GLB 上传及替换、故障回退与资源清理。测试使用软件 WebGL，完成后恢复场景配置并清理上传的测试模型；报告位于 `docs/product-showcase-3d-2026-10-17/`。

`node scripts/check-three-scroll.mjs` 验证鼠标在实际三维画布上时滚轮仍滚动网页，全景和特写镜头保持不变；同时检查缩放按钮、键盘加减、复位及手机布局，不修改后台配置。结果与截图位于 `docs/three-scroll-2026-10-24/`。

| 数据 | 接口 |
| --- | --- |
| 产品 | `GET/POST /api/products`，`PUT/DELETE /api/products/{id}` |
| 首页方案文案 | `GET/PUT /api/home-solutions` |
| 产品中心场景与展示 | `GET/PUT /api/product-showcase` |
| 新闻 | `GET/POST /api/articles`，`PUT/DELETE /api/articles/{id}` |
| 行业 | `GET/POST /api/industries`，`PUT/DELETE /api/industries/{id}` |
| 资质 | `GET/POST /api/certifications`，`PUT/DELETE /api/certifications/{id}` |
| 项目 | `GET/POST /api/projects`，`PUT/DELETE /api/projects/{id}` |
| 全球业务 | `GET/PUT /api/home-global` |
| 官网内容 | `GET /api/site-settings` |
| 咨询 | `GET/POST /api/inquiries`，`PUT /api/inquiries/{id}` 仅接受 `{ "status": "new/contacted/closed" }` |
| 咨询再次通知 | `POST /api/inquiries/{id}/notify` |
| 联系配置 | `GET /api/contact-settings`，`GET/PUT /api/contact-settings/admin` |
| 邮件通知配置 | `GET/PUT /api/mail-settings`，密码不回显 |
| 咨询附件 | `POST /api/inquiry-attachments`，`GET /api/inquiry-attachments/{id}` |
| 图片 | `POST /api/uploads/images`，`GET /api/uploads/images/{filename}` |
| 资质证书 | `POST /api/uploads/certificates`，`GET /api/uploads/certificates/{filename}`；PDF 最大 20 MB，JPG / PNG / GIF / WebP 图片最大 5 MB；上传需登录及 CSRF，原件支持在线预览 |
| 三维模型 | `POST /api/uploads/models`，`GET /api/uploads/models/{filename}`；自包含 GLB 2.0，最大 40 MB |
| 埋点上报 | `POST /api/analytics/events`，每批最多 20 条，按事件 ID 去重 |
| 采集开关 | `GET/PUT /api/analytics/config` |
| 分析报告 | `GET /api/analytics/report?from=YYYY-MM-DD&to=YYYY-MM-DD&locale=zh&device=desktop` |
| 事件明细 | `GET /api/analytics/events`，支持报告筛选条件、`page` 和事件名称 `name` |

管理后台需要登录。入口 `/admin/login`，未登录访问后台时返回登录页，登录后恢复原访问路径。超级管理员与普通管理员拥有完全相同的现有网站维护功能，仅超级管理员可进入 `/admin/accounts` 并调用 `/api/admin/accounts` 管理其他账号。新增账号固定为普通管理员，角色不接受客户端修改；超级管理员不能被停用或删除。所有账号均可在右上角修改自己的密码、退出登录。

### 初始化管理员与登录维护

账号表由 `server/src/main/resources/db/25-admin-accounts.sql` 创建，升级脚本为 `database/migrations/2026-10-26-admin-accounts.sql`，完整安装 SQL 及生成脚本也包含该表。账号与密码不进入业务资料基线；新建数据库时不会附带默认密码。

第一次启动 Java 服务前，在服务器环境中提供 `TZME_ADMIN_USERNAME`、`TZME_ADMIN_PASSWORD`，可选 `TZME_ADMIN_DISPLAY_NAME`。账号为 4–64 位字母、数字、点、横线或下划线，保存时统一为小写。密码至少 12 个字符，最多 72 个 UTF-8 字节。首次启动仅在尚无超级管理员时初始化；已有账号及密码不被后续启动覆盖。未提供初始化信息时，官网继续工作，后台保持锁定。`server/run.ps1` 支持读取这些 Windows 用户环境变量；生产环境由部署系统提供，禁止将真实密码写入代码、SQL 或 Git。

初始超级管理员、新建账号及被重置密码的账号，登录后必须先修改个人密码。密码采用 BCrypt（强度 12）单向哈希，接口只返回账号资料，不回传哈希或密码。登录由 Spring Security 的服务端 Session 维护，Cookie 为 HttpOnly、SameSite=Lax，默认两小时无请求过期。生产环境必须通过 HTTPS 访问并设置 `TZME_SESSION_COOKIE_SECURE=true`。当前部署为单实例，服务重启后需要重新登录。

修改密码、停用、删除、重置密码、修改登录账号都会撤销该账号所有旧登录；姓名更新不需要重新登录。账号和 IP 的失败次数分别限制，账号连续 5 次失败或同一来源 30 次失败后暂停登录十分钟。账号列表支持搜索、状态筛选、新增、修改、启停、重置密码和删除，删除账号保留已维护的网站内容。后台过期重登窗口保留当前页面内存中的编辑内容；重新登录后由用户再次点击保存，刷新或主动退出会丢弃未保存内容。

超级管理员忘记密码时，由服务器维护人员临时提供匹配现有超级管理员的 `TZME_ADMIN_USERNAME`、新的 `TZME_ADMIN_PASSWORD`，设置 `TZME_ADMIN_RESET_PASSWORD=true` 后重启 Java。恢复后立即移除此开关；该方式仅在服务器启动时执行，不能通过 HTTP 请求启用。恢复同时撤销旧登录，下次登录强制改密。

官网读取接口在匿名状态下仅返回已发布的产品、资讯、行业、项目及资质；登录且完成改密后可读取完整后台记录。官网内容配置、已发布素材、咨询提交、咨询附件上传及匿名访问采集继续公开。内容写入、图片 / 模型上传、客户咨询及附件下载、邮件配置和访问分析报表均需登录；未知 `/api/` 接口默认需登录。`admin-preview=1` 不提供认证豁免。登录、账号管理及后台修改请求使用 CSRF 校验，JSON、图片、模型和分析设置共用会话请求封装；客户咨询及匿名采集的指定 POST 接口按原流程使用。

后端认证集成测试：进入 `server` 后执行 `mvn test`，使用独立的 H2 内存数据库，不修改本机 MySQL 中的网站内容。

## 风格 J 改版（2026-10-15）

官网已采用浅色港口工业风，首页固定展示第一张港口 Banner 及其中文翻译，包含基地航拍、企业文化、产品分类与搜索、图片放大及证书 PDF。产品、项目、新闻、联系与首页模块继续使用原有 API 和后台配置；咨询提交、附件上传、邮件通知与分析流程保留。

首页 Banner 使用已确认的港口俯视角图，正式素材为 `public/assets/tzme-j/banners/harbor-overhead-v2.webp`，由 `src/data/jDesign.js` 的 `jAssets.harbor` 引用；第二版稍微缩小右下角主体、增加海面留白，并提高 WebP 保存画质。保留原中文文案与布局，后台首页示意及预览共用该配置。图片基于原照片生成，为构图示意。生成资料与预览保存在被 Git 忽略的 `docs/`，运行与构建不依赖该目录。

Banner 下的行业导航由 `src/components/HomeIndustryNavigation.vue` 展示：电脑端（宽于 1000px）将全部行业排成一行；手机采用已确认的 B 方案，五列两行展示现有十个行业，区域约 197px 高；平板也采用五列。栏目上方保留“应用行业”及“全部产品”入口。名称、图标、顺序及行业跳转继续读取后台已发布行业；说明保留为链接提示及辅助阅读标签。支持悬停、键盘焦点反馈与减少动态效果设置。样式封装在组件内，原行业条的全局样式已移除。

电脑端首页由 `src/style/home-first-screen.css` 控制首屏高度：Banner 与行业区置于同一纵向布局，按浏览器可视高度减去导航高度限制总高，行业区保留自然高度，Banner 在空间不足时自动收缩。较矮窗口同步压缩文案区间距及字号，保持标题与按钮完整可见。导航仍在该布局外保持固定滚动行为，手机布局不变。

官网公共布局由 `src/style/site-layout.css` 统一配置，导航、正文、页脚及首页 Banner 文案块共用内容对齐线。电脑端内容宽度为页面的 87.6%，最大 1660px；平板两侧各留 36px，手机两侧各留 18px。1440px 及以上屏幕统一使用“联系我们”页的 114px 导航高度、品牌字号和菜单间距，较小屏幕使用 96px 导航，手机为 74px。公共样式仅作用于官网，后台管理布局独立。

公共页脚由 `src/components/SiteFooter.vue` 渲染，采用浅色俯视海岸背景 `public/assets/tzme-j/backgrounds/footer-coast.webp`，通过渐变覆盖保留文字阅读区域；桌面将品牌、网站导航、联系方式分为三列，手机将导航收为三列两行。邮箱、电话、地址及社交链接继续读取后台联系设置；英文入口仍跳转独立英文官网。首页及联系我们页保持关闭重复咨询入口。图片使用内置 imagegen 原创生成，完整提示词、原图、截图及检查记录位于被 Git 忽略的 `docs/footer-coast-2026-10-20/`，网站运行不依赖该目录。

新闻资讯列表采用已确认的俯视货轮方案：`src/components/NewsIntro.vue` 显示浅色标题与海面渐变，右下角不附加文字；正式图片为 `public/assets/tzme-j/news/news-intro-ocean.webp`，手机 Intro 约 337px 高。`src/style/news-list.css` 控制细线分类栏、大图重点新闻及日期/缩略图列表，原列表的全局覆盖规则已移除，资讯详情与项目页继续使用原样式。新闻内容及分类仍由后台读取，标题和联系入口保留整站文案配置。每页按 6 篇分页，第一页的首篇以重点新闻展示，列表展示其余 5 篇；后续页展示 6 篇，不重复重点新闻。分类、页码与详情返回继续通过 URL 参数保存。生成提示词及原图见被忽略的 `docs/news-ocean-preview-2026-10-20/`，正式页面截图及验证记录见 `docs/news-ocean-implementation-2026-10-20/`。

联系我们首屏由 `src/components/ContactIntro.vue` 渲染，采用 B 版图文交叠排版：左侧两行标题“下一项制造需求，从交流开始。”与正文左边界对齐，右侧保留原生 SVG 多层线条 Z 和设备线条组成的 ME，淡化为背景，不再显示回复时限提示。中文介绍和“设备制造 / 质量要求 / 交付计划”在该组件中维护；导航与表单仍使用原有配置。电脑、手机和触摸设备在图形至少四分之一进入视野时，自动沿上横线、斜线、底横线描出 Z，单条描线为 1.6 秒，ME 稍后淡入；每次进入页面播放一次，完成后保留完整图形。描线完成后，桌面鼠标移动产生轻微位移和倾斜，并局部提亮邻近线条；移出后平滑回位。系统“减少动态效果”模式直接显示完整图形；离开页面后清理动画与监听，无需新增数据库迁移。联系我们页关闭页脚重复联系入口，咨询表单和常规页脚导航保持可用。

ME 设备线稿由 `src/components/PortEquipmentMonogram.vue` 绘制：两台港机与悬吊抓斗组成 M，设备塔及三层独立横梁组成 E；底横梁与 Z 保持间距。线稿使用 SVG，随整体标识淡入与鼠标移动，手机上隐藏较细的栏杆等细节并加强主要轮廓。

新增资料由 `database/migrations/2026-10-15-j-design.sql` 一次性导入。Java 启动及完整 `database/install.sql` 均包含该迁移；重复执行不会覆盖后续后台修改，旧默认值仅在仍与基础数据一致时更新。生成脚本为 `node scripts/build-j-design-migration.mjs`。

选用素材位于 `public/assets/tzme-j/`。原始 `public/素材照片/`、`public/网站资料/` 已被 Git 忽略，Vite 生产构建也排除这两个目录。本机迁移前备份位于被忽略的 `database/snapshots/j-before-2026-10-15/`。

改版说明、实际截图和浏览器检查结果见 [风格 J 实现记录](docs/j-implementation-2026-10-15/README.md)。

## 中文站与英文官网入口（2026-10-16）

本站及后台固定使用中文，忽略浏览器中旧的英文语言偏好。桌面导航和页脚的 EN 链接跳转到 `https://www.tzmeglobal.com/`；手机顶部不显示语言入口，手机菜单中仍可访问英文官网。

后台的产品、新闻、行业、资质、项目及页面配置仅编辑中文，前后端均取消英文必填要求。历史英文数据继续保留以兼容既有记录；保存中文时无需补写英文，新内容可只填中文。英文官网独立维护。

## 全站页面细化

首页推荐方案采用可切换面板，产品推荐数量、顺序及文案继续在原后台维护；面板支持点击与键盘切换。关于我们以基地实景、独立统计、完整公司介绍和基地联系方式组织内容。公司介绍直接展示三段正文，由后台“关于我们”的简介、补充介绍字段维护，空行分段；2026-10-24 的中文文案通过 `24-company-overview.sql` 一次性同步，后续编辑保留。资质卡片显示对应 PDF 的第一页或原始图片，保留原件查看、完整资料与分页。内置 PDF 优先使用预先生成的 WebP 第一页图片，进入可视区域附近才加载，展示卡片时不下载整份 PDF 和解码器。`npm run dev` 与 `npm run build` 自动执行 `scripts/build-certificate-previews.mjs`，按内置 PDF 内容哈希增量生成 `public/assets/tzme-j/certificates/previews/` 和 `src/data/certificatePreviews.json`，修改 PDF 后重新构建会生成新的图片地址。后台换成其他 PDF、图片加载失败时自动回退到最多两项并行的 PDF 渲染；解码器和字体资源随构建部署，不依赖外部 CDN。生产预览的加载对比与功能检查位于 `docs/certificate-loading-2026-10-22/`。

关于我们首屏与完整介绍统一由 `AboutCompanyIntro.vue` 渲染，后台“关于我们”预览复用同一组件。电脑端将标题和四项统计放在左侧，右侧展示厂区实景；手机端按标题、图片、数据排列。介绍按企业沿革、制造布局、产品与全球业务组织阅读层次，原文及空行分段仍读取现有两个介绍字段，全部直接显示；后续增加的段落也会继续展示。页面下方保留制造与质量、基地、资质和全球业务的章节跳转。此次排版调整不增加数据库字段。

资质卡片移除独立“查看大图”按钮，保留封面点击和详情入口。卡片采用紧凑宽度：1280px 起为 6 列、1000px 起为 4 列、600px 起为 3 列，更小屏幕为 2 列；每页两行，分页与列数使用同一状态，宽屏可一次展示现有 12 份证书。详情由 `CertificateDetailsDialog.vue` 展示，电脑采用证书预览与信息两栏，手机上下排列；默认显示轻量第一页，选择“完整文档”后才加载 PDF 阅读器。可在弹窗内浏览上一项、下一项，或在新窗口打开完整原件；编号、机构和日期只显示后台已填写的内容。截图、21 项详情交互及 18 项卡片布局检查记录位于 `docs/certificate-details-2026-10-22/`。

产品目录和相关设备统一使用 `EquipmentImage`，优先展示透明底图片，并按照设备主体边界计算大小，保留索道与细缆结构；手机保持双列。`ManufacturingQuality` 复用制造与质量配置，在关于我们及产品详情显示实际制造照片、说明与工序，关闭配置时同步隐藏。产品详情原有三种首屏布局、参数、原图预览和章节导航继续可用。

3D 工业岛中，点击行业标签、设备或底部设备选择后，当前设备持续播放机构动作，鼠标移开、拖动镜头及进入设备特写不会中断；切换设备会停止上一台设备的持续动作，返回行业全景或复位会清除持续动作。鼠标悬停其他设备仍可单独触发动作。场景离开可视区域或页面隐藏时暂停绘制，重新可见后继续；系统减少动态效果时保留静态提示。动作检查使用 `node scripts/check-industrial-motion.mjs`，浏览器验证记录位于 `docs/selected-equipment-motion-2026-10-22/`。

产品中心的产品类型随当前行业和关键词联动，仅展示有已发布产品的类型，并支持多选合并结果。切换条件时保留仍有匹配产品的已选类型，自动取消无匹配的类型；点击“全部产品”只清空类型，“清除筛选”和三维复位清空全部筛选。多选通过重复的 `cat` 查询参数保存，兼容原有单选链接，刷新和产品详情返回可恢复全部选择。浏览器检查与截图位于 `docs/product-category-filters-2026-10-22/`。

三维交互采用自适应渲染：持续动作和拖动时根据帧耗时调整 WebGL 缓冲分辨率，普通像素密度屏幕保持原生分辨率，进入特写恢复该模式的清晰度，停止动作后恢复静态清晰度；HTML 标签始终保持清晰。固定结构的局部变换、设备边界及全景取景点复用缓存，标签投影最多每秒更新 30 次并在镜头停稳后同步最终位置，阴影仅在展示内容变化时刷新。切换特写、行业和复位延续当前镜头目标并使用平滑加减速。`node scripts/check-industrial-quality.mjs` 检查质量调节和恢复策略；性能对比记录位于 `docs/interaction-performance-2026-10-22/`。

资讯详情的标题与封面在 Vue 模板中并排展示，正文缩窄阅读宽度；新闻列表保留俯视货轮 Intro。联系页保留 Z / ME 动效，直接联系和表单重新编排，手机优先显示表单，基础字段双列；咨询校验、附件和提交流程沿用原功能。共享版式见 `src/style/site-refinement.css`，本地截图及验证记录见 `docs/site-refinement-implementation-2026-10-20/`。

## 原站 Newsroom 内容同步

当前后台维护入口、填写规则和展示位置见 `deploy/admin-maintenance.md`。工作台提供新闻与搜索设置快捷入口，以及产品行业、新闻封面和日期的必填资料检查；新闻列表支持类别、状态、完整度筛选，并明确展示列表顺序和发布日期。官网暂未展示的项目资料移至“保留功能”，编辑能力及原选择保留。草稿仅提供编辑器预览，已发布资料可直接查看公开页；新闻预览与官网共用 `NewsArticlePresentation.vue`，桌面与手机视口沿用正式版式。企业介绍、联系方式和搜索模块的已保存页面链接随当前编辑对象切换。

国内新闻按后台填写的中文类别归组，去除名称首尾空格；相同中文名称合并为一个筛选项，不同名称分别筛选。导入文章和新建中文文章使用相同规则，修改一篇的类别仅改变这一篇的归属。仅缺少中文名称的旧记录回退使用原类别；历史 `category=News` 等链接兼容当前中文类别。分类按钮、列表筛选与详情前后篇采用同一标识。可执行 `node --test scripts/check-article-categories.mjs` 检查分类兼容和改名隔离。

新闻封面图片为必填，保存草稿和发布时均需填写。后台显示必填标记，缺图时提示并定位至上传区域；新增和更新新闻的 API 同样拒绝空封面。移除图片后须补充图片才能保存，正文插图不替代封面。

`database/baseline/newsroom.json` 记录 2026-10-27 核对的原站 7 篇内容、完整中文译文、英文原文、发布时间、原文地址和媒体哈希：4 篇新闻、1 篇展会活动、2 篇产品手册。19 张原始配图和 2 份 PDF 使用项目资源路径 `public/assets/tzme-newsroom/`，页面不依赖原站图片外链。PDF 保留原文件，在点击正文链接时打开，列表和详情初次展示不下载整份手册。

`node scripts/build-newsroom-migration.mjs` 校验媒体并生成 `27-newsroom.sql`；部署后由 Java 启动时执行，或单独导入 `database/migrations/2026-10-27-newsroom.sql`。迁移只执行一次，更新两篇已有真实新闻、新增五篇内容，并将四篇旧示例新闻标为删除；后续后台修改和新增内容不会被启动迁移覆盖。原站年会文章发布日期为 2026-01-21，正文写 2 月 3 日，两者均按原站保留。资讯顺序使用现有 `home_order` 字段，后台新闻编辑新增“列表顺序”，API、前台和搜索文档采用相同顺序；产品排序不受影响。后续原站更新需重新核对和翻译后同步，本次没有启用定时覆盖后台内容的任务。
