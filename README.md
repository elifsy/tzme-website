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
| 咨询 | `GET/POST /api/inquiries`，`PUT /api/inquiries/{id}` |
| 图片 | `POST /api/uploads/images`，`GET /api/uploads/images/{filename}` |

管理后台现阶段沿用原有内容管理功能，尚未实现登录和权限控制。
