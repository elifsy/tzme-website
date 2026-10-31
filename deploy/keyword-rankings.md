# 百度关键词排名

后台入口：**工作台 → 关键词排名**（`/admin/rankings`）。所有已登录管理员可用，操作写入人员操作日志。

监测针对 SEO 配置的正式站点域名，按关键词、电脑/手机、检查深度分别保存。现有记录的监测条件不允许改写；更换条件时新建监测，旧条件可归档、恢复。不会预置虚构的实际排名。

## 部署

新装数据库已包含两张表；已有数据库只执行 `database/migrations/2026-10-30-keyword-rankings.sql`。此脚本可重复执行，不修改新闻、产品、账号或询单。备份工具会自动包含这两张表。

本机可以直接编辑 `server/config/keyword-rankings.properties`，无需设置系统环境变量：

```properties
TZME_SERPAPI_KEY=填写你的真实APIKey
TZME_RANK_AUTO_ENABLED=false
```

Key 填在等号后面，不添加引号。`false` 表示手动点击查询；需要每日自动采集时改为 `true`。保存后重启 Java，无需重新构建前端。在项目根目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\server\run.ps1 -Restart
```

该命令只替换已确认属于本项目的后端。平时运行不带 `-Restart` 的同一脚本时，如果后端已经启动，会提示已有服务并退出，避免重复占用 8080；如果端口由其他程序占用，会停止启动并提示，不结束其他程序。

该本地文件已被 Git 忽略，放在 Java 源码资源目录之外，不会打进 JAR。其他电脑可将同目录的 `keyword-rankings.example.properties` 复制为 `keyword-rankings.properties` 后填写。支持从项目根目录或 `server` 目录启动；生产服务器以 `server` 作为工作目录时，将本地文件放在该工作目录的 `config` 文件夹内。读取方式使用 Spring Boot 的[外部配置导入](https://docs.spring.io/spring-boot/3.3/reference/features/external-config.html#features.external-config.files.importing)。

也可以继续使用 Java 进程环境变量，系统环境变量优先于本地文件（不要放入 `VITE_*` 或提交真实值）：

```text
TZME_SERPAPI_KEY=<your-server-side-api-key>
TZME_RANK_AUTO_ENABLED=false
```

重启后后台会显示接口已接入，可以对启用的关键词点击“立即采集”。开启每日自动采集需设置 `TZME_RANK_AUTO_ENABLED=true` 并重启。每 15 分钟处理最多 10 个到期条件，每个条件间隔至少 24 小时；手工采集有 60 秒冷却。调度依赖 Java 服务持续运行。

自动采集使用 [SerpApi 百度搜索接口](https://serpapi.com/baidu-search-api)，查询简体中文自然搜索结果，区分 `desktop` / `mobile`。接口默认地区，不支持在此版本指定城市。每页查询 10 条，检查前 100 名最多消耗 10 次请求；电脑、手机分别计费。新鲜查询使用 `no_cache=true`，额度和费用以自己的接口账户为准。

无 Key 时，自动查询会明确提示未接入，不会生成排名。仍可录入真实查询结果或通过下载的 UTF-8 CSV 模板导入，模板本身不含名次。采集时间需含时区，例如 `2026-10-30T09:00:00+08:00`。

## 排名口径

- 名次为自然搜索结果中第一次出现目标域名的位置；排除广告位，不使用平均排名。`www` 与根域视为同一站点，其他子域独立。
- 升降与同一监测条件的上一次有效结果相比，按采集时间排序；历史补录不会打乱比较。
- 未检出只表示在设置范围内未出现，不编造范围外的具体名次。新进榜和跌出范围单独标记。
- 接口错误、无法确认结果域名、分页异常保留错误记录，但不覆盖最近有效排名或误报下降。曲线对错误断开。
- 导入按整批事务处理，任一记录校验失败则整批不入库。相同监测编号和采集时间不允许重复。历史只追加，不覆盖。
- 搜索结果可能因地区、时刻、终端和个性化不同而有差异；比较时保持查询条件一致。

外网只读预览使用标注“演示”的数据，不读取真实关键词历史或接口凭据。

验证：`node --test scripts/check-keyword-rankings.mjs`；`cd server` 后执行 `mvn -o test`。接口测试使用 H2 和模拟供应商，不访问付费搜索接口。
