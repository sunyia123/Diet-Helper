# 食由己 · WebView 版本留档

食由己是面向 HarmonyOS 手机的本地优先饮食管理应用。本仓库保存 **2.4 版 HTML／CSS／JavaScript 工作台及 ArkTS WebView 容器**，作为产品设计、交互实现与原生 ArkUI 迁移前的可复现留档。当前原生重构继续在原项目 `Diet-Helper` 中进行；这里不再作为新功能主线。

[查看产品展示页](./index.html) · [打开 Web 演示](./design-demo/calm-path-v1/index.html)

## 产品能做什么

| 场景 | 实现内容 |
| --- | --- |
| 今日记录 | 训练／休息日目标、按餐记录与打卡、食物快加、拍照、每日分享 |
| 食物与菜肴 | 食材库、拼音搜索、生熟与可食重量换算、菜肴配方与辅料 |
| 备餐 | 周期套餐、原料采购量、食材成本估算、勾选备餐清单 |
| 趋势与复盘 | 热量及三大营养素趋势、月历、体重记录、目标调整 |
| 采购记账 | 单笔采购、渠道、历史均价和单次／渠道比价 |
| 个性化 | 饮食方法、训练／休息日目标、四套主题、可选功能与体重单位 |

数据默认保存在设备本地，不依赖账号或云端服务。网页运行时的浏览器数据和 HarmonyOS WebView 中的设备数据互不自动同步。截图使用演示记录，不包含真实用户账目或照片。

## 界面展示

本仓库的 [`showcase/screenshots`](./showcase/screenshots) 保存七张从 2.4 页面在隔离浏览器中渲染的功能截图：今日、食物、备餐、趋势、日历、热量缺口法、采购。它们是产品展示素材，**不是鸿蒙真机截屏**。展示页直接使用这些截图，不重绘手机系统边框。

## 运行 Web 演示

在仓库根目录运行：

```bash
python -m http.server 5178 --directory design-demo/calm-path-v1
```

浏览器打开 `http://127.0.0.1:5178/`。建议用独立浏览器配置文件试用，避免把演示记录与日常浏览数据混在一起。页面为纯前端；饮食记录主要存于 `localStorage`，餐食照片存于 `IndexedDB`，关闭服务后浏览器数据仍由该浏览器配置文件管理。

## HarmonyOS 工程

使用 DevEco Studio 打开仓库根目录。`entry/src/main/ets/pages/Index.ets` 是 WebView 容器，加载 `entry/src/main/resources/rawfile/calm-path-v1/index.html`；`entry/src/main/ets/services/` 提供系统避让区、数据传输、体重及桌面卡片等桥接能力。`design-demo/calm-path-v1/` 是对应的 Web 开发主源。

本留档仓库只保留不含密钥的 `build-profile.json5`。若要在自己的设备上构建和安装，需在 DevEco Studio 中配置自己的签名材料；本仓库不包含原项目私钥、签名证书、真实用户备份或发行包。应用包名及 App ID 属于历史工程元数据，实际分发须使用自己的应用身份。

```text
AppScope/                         HarmonyOS 应用资源
design-demo/calm-path-v1/         Web 主源，可直接在浏览器运行
entry/src/main/ets/pages/Index.ets
entry/src/main/ets/services/      Web ↔ 原生桥接
entry/src/main/resources/rawfile/ 包内 Web 副本
showcase/screenshots/             2.4 功能演示截图
index.html                        产品展示页
```

## 技术与设计选择

- 前端采用原生 HTML、CSS、JavaScript；不依赖远端 API 才能完成核心记录。
- HarmonyOS 使用 ArkTS WebView 容器，原生桥处理窗口安全区、体重数据接口、数据传输和桌面营养卡片。
- 营养快照与食物资料分开保存，尽量让历史记录不因后来编辑食物而被回写。
- 采用紧凑的手机信息密度、语义化营养颜色和可选主题；页面在逻辑视口中适配，而不是按物理像素等比放大。

本仓库记录的是已实现的 WebView 产品，而不是原生迁移成果。原生 ArkUI／ArkTS 版本会重新梳理数据与交互，不把此处的 HTML 直接嵌入新主界面。

## 第三方素材

本仓库自有代码采用 [MIT License](./LICENSE)。这项许可不覆盖第三方图标、照片及其他有独立许可的素材。

食物图标含 OpenMoji、Twemoji 与像素素材。来源、署名和各自许可见 `design-demo/calm-path-v1/assets/food-icons/` 下的说明与许可证。第三方资源不因本仓库后续为自有代码选择的许可而改变授权条件；尤其不要把像素食材包独立拆出再分发。

## 归档状态

留档基于 2026-10-08 本地 2.4 Web 主源与 WebView 工程，未加入正在开发的 `Native*Pilot` 试用页面。展示页和 README 是归档说明，不改变原应用功能。无真机运行验收记录的部分不在本仓库中冒充为真机验证。
