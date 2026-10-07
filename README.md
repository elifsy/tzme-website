# TZME 官网与管理后台

Vue 3 + Vite + Element Plus，Java 17 + Spring Boot 3 + MySQL。官网页面按页面分文件，公共导航组件为 `src/components/SiteNav.vue`。

## 数据来源

官网与后台的产品、新闻、行业、资质、项目、全球业务配置、咨询记录全部通过 Java API 读取 MySQL。官网中英文文案、图片地址、公司统计和联系方式存入 `site_settings`，先从数据库加载，再注入 vue-i18n，模板继续使用 `$t`。

读取失败会显示错误和重新加载按钮。写入失败保留表单，只有服务器保存成功才显示成功。浏览器只保存语言偏好；旧版业务缓存仅用于后台的迁移入口，不作为页面数据或保存回退。

基础数据包含当前数据库中已保存的修改及此前页面的初始内容，保存在 `database/install.sql`。本次已导入本机数据库，初始化前的 SQL 备份位于 `database/snapshots/before-baseline.sql`，备份目录不会提交 Git。

## 本机启动

在项目根目录启动前端：

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
4. 部署前端构建文件，代理 `/api` 到 Java 服务，并保留上传图片目录。

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

部署 `dist/` 到静态服务器。Nginx 示例在 [deploy/nginx.conf](deploy/nginx.conf)，包含 Vue 路由刷新支持和 API 代理。数据库保存图片地址；`public/assets/` 包含内置图片，后台上传目录需随站点备份和迁移。

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

- 产品：中英文详情、特点、参数、多行业关联、首页展示及排序，首页最多 5 个。
- 行业：维护中英文名称和说明，同步官网首页与产品筛选。
- 新闻：中英文富文本、分类、发布日期、图片和发布状态；详情目录由正文标题生成。
- 资质：名称、说明、颁发机构、证书编号、有效期、图片、排序及发布状态。
- 项目：卡片全部字段、中英文富文本详情、图片、排序，首页最多 3 个。
- 全球业务：官网首页和关于我们共用配置，支持图片或点亮地图，中英文位置名称，最多 100 个位置。
- 咨询：客户提交到数据库，后台查看并维护处理状态。
- 联系与咨询配置：维护中英文总部信息、联系邮箱、下属企业及排序，统一更新首页、联系我们与关于我们；下属企业可分别选择“在联系我们显示”和“在关于我们显示”；配置咨询表单显示位置、开关、必填项、按钮文案和提交提示。
- 咨询附件：官网真实上传和下载，允许类型、单个文件大小（1～50 MB）、数量（1～10 个）及开关均由后台配置；后台只读查看客户信息和附件，仅修改处理状态，服务端也拒绝修改客户提交内容。
- 邮件通知：独立入口 `/admin/mail`，配置 SMTP 发件邮箱及最多 20 个收件邮箱，可分别启用。咨询先保存，通知异步发送并最多自动尝试 3 次；在发送记录中查看状态并再次通知。

地图轮廓为本地 SVG 渲染资源。位置选项初始化后由数据库提供，运行时不依赖第三方地图服务。增加语言时，在 `src/i18n/locales/` 新增语言文件并注册，同时为数据库业务字段和 `site_settings.translations` 增加相应语言内容。

## 图片上传

后台的产品、新闻、资质、项目和地图图片通过点击选择或拖放上传，支持预览、替换，并显示当前图片尺寸。新闻与项目的富文本正文通过工具栏的图片上传按钮插入图片。

支持 JPG / PNG / GIF / WebP，单张不超过 5 MB。下列尺寸也显示在各个上传位置，供准备图片时参考；其他尺寸可以上传，不会强制拉伸或裁切上传文件。

| 图片用途 | 推荐尺寸（像素） | 建议 |
| --- | --- | --- |
| 产品封面 | 1200 × 800 | 横图，主体居中，留出裁切空间 |
| 新闻封面 | 1600 × 900 | 16:9 横图，避免边缘文字 |
| 项目封面 | 1600 × 900 | 展示设备与现场，主体居中 |
| 资质证书 | 1240 × 1754 | A4 竖图，保留原始比例、文字清晰 |
| 全球业务地图 | 1600 × 700 | 横向地图，推荐透明 PNG |
| 富文本正文 | 1200 × 800 | 保持原始比例，高度按内容调整 |

已有图片会继续显示。上传完成后需要保存当前表单，图片才会应用到官网；移除图片只会清空表单中的图片引用。图片文件通过 Java 上传接口保存在 `TZME_UPLOAD_DIR`，数据库保存图片地址。部署与备份时需同时保留上传目录，单独导入 SQL 不包含上传的图片文件。

## 行业图标

在后台“行业管理”的新增或编辑弹窗中上传行业图标，左侧维护内容与图片，右侧预览首页行业条目。图标显示在首页“服务行业”的名称左侧，中英文共用；原有行业点击跳转和产品筛选仍使用行业 ID。

推荐 128 × 128 px 的透明浅色 PNG，支持 JPG / PNG / GIF / WebP，最大 5 MB。上传完成后保存才会应用到官网；可替换或清除图片，清除后使用通用行业图标。现有五个行业提供随项目部署的默认图标。

图标地址保存在 `industries.icon`，带中文字段备注。Java 重启时自动执行 `06-industry-icons.sql`，已有数据库也可单独导入 `database/migrations/2026-10-industry-icons.sql`。迁移只在首次升级时补充缺失的默认图标，保留自定义图片及之后的清除操作；全量部署 SQL 已同步更新。

## 首页能力配置

入口为 `/admin/capabilities`（侧栏“首页能力配置”）。可分别维护中英文栏目小标题、两行主标题、说明和步骤名称；支持区域显示开关、背景图片上传，以及最多 8 个流程步骤的新增、删除、排序和隐藏。展示编号按可见步骤的顺序自动生成。新增步骤默认隐藏，填写中英文名称后开启展示；区域开启时至少保留一个可见步骤。

步骤可选择内置图标或上传自定义图片，图标与展示状态中英文共用。推荐图标 128 × 128 px 的透明深色或蓝色 PNG，背景图推荐 1600 × 900 px，上传最大 5 MB。左侧配置、右侧实时预览，切换编辑语言会同步切换预览；上传完成后保存才会应用到首页。

配置通过 `/api/home-capabilities` 读写 MySQL `site_settings` 中 `id='capabilities'` 的独立 JSON，不影响联系和邮件配置。基础数据保存在 `database/baseline/home-capabilities.json`，保留现有六个流程步骤。Java 重启时自动执行 `07-home-capabilities.sql`，也可单独导入 `database/migrations/2026-10-home-capabilities.sql`；首次初始化优先沿用数据库中首页原有文案与图片，重复执行保留后台修改。全量部署 SQL 已更新。

## 联系与咨询配置

联系配置：`/admin/contact`；咨询管理：`/admin/inquiries`；邮件通知：`/admin/mail`。初始配置沿用目前官网信息，保存在 `database/baseline/contact-settings.json`，运行时读取 MySQL 中的 `site_settings`，标识为 `contact`。

在“联系与咨询配置 → 社交链接”中，切换编辑语言分别配置各语言官网页脚的图标、提示名称、跳转地址、顺序和显示状态，右侧提供实时预览。每种语言最多 8 个链接，支持 LinkedIn、YouTube、X、微信、微博、哔哩哔哩、Facebook、Instagram 和其他链接。官网仅展示当前语言中已开启且 URL 有效的条目；每种语言可以使用完全不同的平台和地址。初始链接及新增链接默认关闭，填写真实的完整 HTTP/HTTPS 地址并开启后保存即可展示。

选择“其他链接”后可填写自定义链接名称，并上传自定义图标；名称用于鼠标提示与无障碍标签。推荐 128 × 128 px 的透明浅色 PNG，也支持 JPG / GIF / WebP，最大 5 MB。中英文可以使用不同的名称、图标和地址。开启展示时名称必填；图标选填，未上传或加载失败时使用默认链接图标。上传期间暂停保存，完成后保存配置才会应用到官网。

社交链接保存在 `site_settings.contact` 配置的 `contact.socialLinks` 中，语言代码对应独立列表。`database/migrations/2026-10-social-links.sql` 只补充缺失的社交链接配置，保留已保存的联系方式、社交链接与 SMTP 设置；Java 重启时也会自动执行。

联系方式与通知收件邮箱分别维护。联系邮箱公开展示在网站；在独立的“邮件通知”功能中配置 SMTP 服务器、端口、连接安全方式、发件邮箱、账号和密码或授权码，再选择收件邮箱并启用通知。保存后的密码不回显，留空保留已有密码，也可以勾选清除。两处配置分别保存，保留对方已保存的内容。

通知每 15 秒从数据库队列处理，失败最多尝试 3 次；关闭通知不会影响咨询入库。邮件正文包含客户原始咨询内容与附件名称，附件通过后台下载。在“邮件通知 → 发送记录”中点击“再次通知”，发送给当前启用的邮箱。SMTP 尚未配置时默认不发送邮件。发送结果只更新通知字段，允许同时维护咨询的处理状态。

附件通过 `/api/inquiry-attachments` 上传，文件保存在 `TZME_UPLOAD_DIR/inquiries/`，元数据保存在 `inquiry_attachments`。服务器核对文件扩展名、格式特征、大小与关联数量。上传目录需与数据库一起备份。Java 和 Nginx 的请求上限设为 51 MB；普通后台图片仍限制为 5 MB。

已有数据库升级脚本为 `database/migrations/2026-10-contact-inquiries.sql`，可重复执行并保留已保存配置。Java 启动时也会自动执行迁移；修改后请重新启动 Java 服务。本机迁移前的备份为 `database/snapshots/before-contact.sql`。

## 官网埋点与数据分析

后台入口：`/admin/analytics`（侧栏“网站数据分析”）。默认开启官网采集，可以在分析页暂停或恢复，已有数据始终保留。官网每分钟更新一次采集开关。

- 自动采集官网页面浏览、前台可见停留时间、最大滚动深度、导航与主要按钮点击、内容详情点击、行业与新闻分类筛选、翻页、社交及联系方式点击、语言切换。
- 咨询表单记录开始填写、发起提交和失败；成功咨询由 Java 在咨询入库事务提交后记录，后台修改处理状态不会改变成功数。不会记录表单内容、邮箱、电话或 IP。
- 支持近 7 / 30 / 90 天、自定义日期（最多 366 天）、语言和设备筛选；展示 PV、UV、访问次数、平均停留、跳出率、咨询数与转化率。
- 趋势图支持鼠标和键盘查看每天的数据、切换表格和导出 CSV；同时展示咨询转化路径、热门页面与操作、来源域名、语言及设备分布。事件明细使用 Element Plus 分页，每页 20 条。

访客按浏览器本地匿名标识去重；会话按标签页标识、30 分钟无操作划分。统计按北京时间汇总，以服务器接收时间为准。筛选、翻页和同页切换语言不额外增加 PV；平均停留只计算已上报的页面前台可见时间。浏览器禁止跟踪或网络中断可能导致少计，统计口径在分析页有说明。

数据保存到 MySQL `site_analytics_events`，字段均带中文备注，采集开关保存于 `site_settings` 的 `analytics` 配置。Java 默认启动时执行 `08-analytics.sql` 创建表及索引，部署 SQL 已同步更新；若关闭了应用自动初始化，请先执行 `database/migrations/2026-10-analytics.sql`。分析只显示实际采集数据，没有模拟历史访问。修改后重新启动 Java 并刷新官网及后台。

## API

| 数据 | 接口 |
| --- | --- |
| 产品 | `GET/POST /api/products`，`PUT/DELETE /api/products/{id}` |
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
| 埋点上报 | `POST /api/analytics/events`，每批最多 20 条，按事件 ID 去重 |
| 采集开关 | `GET/PUT /api/analytics/config` |
| 分析报告 | `GET /api/analytics/report?from=YYYY-MM-DD&to=YYYY-MM-DD&locale=zh&device=desktop` |
| 事件明细 | `GET /api/analytics/events`，支持报告筛选条件、`page` 和事件名称 `name` |

管理后台现阶段沿用原有内容管理功能，尚未实现登录和权限控制。
