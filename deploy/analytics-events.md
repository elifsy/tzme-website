# 官网埋点维护

入口：后台“访问分析”。采集开关沿用数据库配置，代码更新不会自动开启或关闭，也不会清理历史统计。

前端事件注册表：`src/data/analyticsEvents.js`。后端接收白名单：`AnalyticsService.CLIENT_EVENTS`。`scripts/check-analytics-contract.mjs` 校验两者一致、后台名称完整、合作伙伴素材齐全。

| 交互 | 事件 | 目标与口径 |
| --- | --- | --- |
| 页面进入 / 离开与定时停留 | `page_view` / `page_engagement` | 公开页面路径；同页筛选与控制场景不增加 PV；包含 `/site-map` |
| 行业筛选 | `industry_filter` | 行业 ID 或 `all`；原有首页行业入口继续兼容 |
| 产品类型多选 | `product_type_filter` | `add:类型`、`remove:类型`、`all`；自动修正无效筛选不计为主动操作 |
| 3D 标签与设备点选 | `model_select` | 行业 ID；实际改变列表筛选时另有一次 `industry_filter`，分别表示场景选择与筛选动作 |
| 3D 悬停 | `model_hover` | 区域持续悬停 800ms；同一挂载场景每个行业最多一次，不按模型细杆、鼠标移动或渲染帧记录 |
| 3D 控制 | `model_control` | `reset`、`zoom-in`、`zoom-out`、`inspect:行业`、`equipment:行业`；程序自动复位及相机动画不重复记录 |
| 新闻类别 | `news_filter` | 当前中文类别名称；后台兼容历史英文类别标识 |
| 查看资质详情 | `certificate_view` | 证书 ID；打开详情或切换上一项、下一项时记录，关闭不记录 |
| 制造质量工序 | `quality_step` | 工序 ID；点击、键盘方向选择，自动选中和鼠标滑过不记录 |
| 全球地图点位 | `map_location` | 点位 ID；主动打开说明时记录，航线/船只动画不记录 |
| 英文官网跳转 | `language_outbound` | `en`；不将跳出本站算为本站英文页面访问，保留旧 `language_change` 历史记录 |
| 公开附件 | `download_click` | 同站公开文件路径，外站域名与文件路径；去掉查询参数及片段，只表示点击，不确认文件下载完成 |
| 合作伙伴手机展开 / 收起 | `cta_click` | `partners-expand` / `partners-collapse`；无外链的品牌标志不伪装成可点击按钮 |
| 航拍视频入口 / 页脚联系 / 产品加载更多 | `cta_click` / `pagination` | 独立固定目标；后台有对应中文名称 |

咨询继续采用开始填写、提交、失败和服务端保存成功的统计链路。`inquiry_success` 仅在服务端保存成功后记录，客户端不可伪造此事件。事件不携带咨询表单内容、搜索词、邮箱、电话或附件内容。

后台路由和带 `admin-preview=1` 的公开预览不采集。浏览器禁止跟踪设置继续生效。页面中不存在的模块不会自动生成点击；保留项目的历史记录仍可查看。

本次浏览器核验拦截了测试埋点和合作伙伴保存请求，没有把模拟访问或改名写入真实统计、产品、新闻或合作伙伴资料。
