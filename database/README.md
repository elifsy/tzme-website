# 数据库部署与基础数据

## 文件

| 文件 | 用途 |
| --- | --- |
| `00-create-database.sql` | 创建默认数据库，由有建库权限的账号执行 |
| `install.sql` | 完整建表和基础数据，可直接导入目标数据库 |
| `../server/src/main/resources/db/01-schema.sql` | Java 服务使用的建表脚本 |
| `../server/src/main/resources/db/02-data.sql` | Java 服务使用的初始化数据脚本 |
| `../server/src/main/resources/db/03-comments.sql` | Java 服务使用的中文备注迁移脚本 |
| `migrations/2026-10-column-comments.sql` | 已有数据库单独补充中文表和字段备注 |
| `baseline/records.json` | 可阅读的基础业务数据，包含现有 MySQL 的修改 |
| `baseline/site-settings.json` | 官网图片地址、统计数字和联系方式等基础配置 |
| `snapshots/` | 本机备份，已从 Git 排除 |

业务数据包含 9 个产品、4 篇新闻、5 个行业、4 项资质、3 个项目、全球业务配置，以及中英文官网内容和 241 个地图位置选项。咨询记录使用数据库中的实际记录，没有生成示例咨询。

初始化以已有数据库记录为优先来源。相同 ID 的数据保留现有非空字段；旧产品缺失的 NULL 字段会在首次初始化时补齐。脚本不清空数据库。

所有表和字段均有 MySQL `COMMENT` 中文备注，包含字段用途、状态值、行业关联和排序规则。新数据库直接导入 `install.sql` 即可；已有数据库可以单独执行备注迁移：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/database.ps1 -Action import -SqlFile database/migrations/2026-10-column-comments.sql
```

Java 默认也会在启动时执行备注迁移。`app_migrations` 中的 `2026-10-column-comments-v1` 标记确保该迁移只执行一次。备注迁移保持原有字段类型、长度、空值约束、默认值和索引定义。

## 新环境部署

使用 MySQL 8，先执行 `00-create-database.sql`，再选择目标数据库执行 `install.sql`。也可以使用数据库管理工具导入，文件编码为 UTF-8。

MySQL 命令行示例，在项目根目录执行：

```sh
mysql -u root -p --default-character-set=utf8mb4 --execute="source database/00-create-database.sql"
mysql -u root -p --default-character-set=utf8mb4 tzme_corporate --execute="source database/install.sql"
```

应用账号由部署环境创建并授权，不在 SQL 中预置账号密码。设好 Java 的 `TZME_DB_URL`、`TZME_DB_USER`、`TZME_DB_PASSWORD` 后启动后端。

Java 默认也会执行相同的建表和初始化脚本，所以创建好数据库并配置账号后，可以直接启动 Java 完成初始化。若已由部署工具导入 SQL，允许设置 `TZME_SQL_INIT_MODE=never` 关闭应用初始化。Hibernate 使用 `validate` 检查表结构。

## 当前 Windows 环境

脚本会读取当前进程的环境变量；缺失时从 Windows 用户环境变量补充，不会显示密码。

```powershell
# 导入基础数据，保留现有修改
powershell -ExecutionPolicy Bypass -File scripts/database.ps1 -Action import

# 导出当前数据库
powershell -ExecutionPolicy Bypass -File scripts/database.ps1 -Action export
```

`export` 生成 `snapshots/export.sql` 和 `snapshots/current.json`。SQL 是当前数据库的完整备份，用于迁移到空数据库；JSON 用于更新基础数据。备份文件名固定，再次导出前请另外保留需要长期保存的备份。

本次初始化前的数据库 SQL 另存为 `snapshots/before-baseline.sql`；补充中文备注前的数据库 SQL 另存为 `snapshots/before-comments.sql`。

## Linux / 其他环境

需要安装 Node.js 和 MySQL 命令行工具。导入、导出脚本不需要 npm 依赖。

```sh
export TZME_DB_HOST=127.0.0.1
export TZME_DB_PORT=3306
export TZME_DB_NAME=tzme_corporate
export TZME_DB_USER=tzme_app
export TZME_DB_PASSWORD='替换为部署环境密码'
node scripts/import-database.mjs
node scripts/export-database.mjs
```

客户端不在 PATH 时，设置 `TZME_MYSQL_CLI` 和 `TZME_MYSQLDUMP_CLI` 为对应程序的完整路径。数据库脚本使用 host / port / name 变量；Java 使用 JDBC 地址 `TZME_DB_URL`，请将两者配置为同一个数据库。

## 重复执行和后续修改

`app_migrations` 中的 `2026-10-database-baseline-v1` 表示基础数据初始化完成。只有没有此标记时才导入基础数据。

- 再次导入或重启 Java 不覆盖后台修改，不恢复删除记录。
- 已有数据的初始化不是数据恢复操作。恢复完整备份请使用空数据库。
- 后续表结构变更应提供新的迁移 SQL；默认不会使用 Hibernate 自动修改生产表。
- 基础数据脚本内字符串以 UTF-8 十六进制保存，避免富文本、引号和换行在不同 SQL 模式下损坏。可阅读内容保存在 `baseline/` 和语言配置文件中。

重新生成可部署的 SQL：

```sh
npm run db:build
```

这会读取 `baseline/records.json`、`baseline/site-settings.json`、`src/i18n/locales/en.js`、`zh.js` 和地图选项文件，生成 `install.sql` 及 Java 的 SQL 资源。

需要将后台后续保存的数据更新为新的基础数据时，先导出数据库，再执行：

```sh
node scripts/build-database.mjs --refresh-baseline
```

此命令会更新基础 JSON 和 SQL 文件，应在提交前检查内容。它不会修改数据库，已有数据库也不会因重新生成 SQL 而被覆盖。完整备份和上传图片用于迁移已有站点；基础 SQL 用于初始化新站点。

## 旧版浏览器修改和图片

旧版可能只将修改存入浏览器。用原浏览器打开管理后台，发现未同步记录时会出现迁移提示，可以查看、导出 JSON，再导入 MySQL。失败记录继续保留以便重试；页面展示和普通保存均不使用浏览器业务缓存。迁移完成后再导出数据库，即可将这些修改包含在 SQL 备份中。

数据库保存图片地址，图片文件需一起部署：内置图片在 `public/assets/`，后台上传图片在 `TZME_UPLOAD_DIR` 对应目录。默认通过 `server/run.ps1` 启动时为 `server/uploads/`。请保留数据库备份和该目录。
