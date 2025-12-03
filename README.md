# find_jobs

基于 Go + Playwright 的 BOSS 直聘自动投递工具，内置前端管理页，支持 AI 自动招呼、黑名单与企业微信通知。目标是“拿到源码即可跑起来”。

## 特性
- 自动化投递：关键词 × 城市组合批量搜索与沟通；每日上限（`boss.max`）与循环间隔（`boss.interval`）。
- 登录凭证：
  - 默认后台静默运行，直接读取 `data/boss/cookie.json` 或 `data/boss/browser_cookie.txt`。
  - 若需扫码，请在本地浏览器登录后导出 Cookie 写入上述文件，再同步到服务器启动。
- 管理界面：前端 UI 首屏仅展示；修改后 ~0.8s 自动保存到 `config.yaml`。
- AI 与通知：可选调用兼容 OpenAI 的接口生成招呼语，并通过企业微信 Webhook 推送。

## 工作流程（Overview）
1. 启动：后端监听 `:38888`，提供静态页面与 `/api/config`。
2. 配置：前端拉取配置，仅展示；用户改动后 `POST /api/config`，后端合并写入 `config.yaml`。
3. 登录：优先加载 `browser_cookie.txt` → `cookie.json`；若二者皆空将直接报错退出，请先在本地写入 Cookie 文件。
4. 投递：按城市与关键词搜索 → 过滤黑名单/不活跃 HR →（可选）AI 生成招呼 → 发起沟通 → 记录与推送 → 达到 `max` 或耗尽后休眠 `interval` 小时再跑下一轮。

## 原理（简述）
- Playwright 自动化：Chromium 无头/有头运行，注入反检测脚本与常见请求头。
- 配置归一：`internal/config` 将可读选项映射为接口编码（学历/薪资/经验/行业/城市等），并设置默认值与边界。
- 后端 API：`GET/POST /api/config` + 静态资源服务（`front/dist`），禁用缓存确保自动保存稳定。

## 前端页面
- 布局：右侧主内容区域在 ≥xl 屏幕宽度下约占可用区域的 2/3，左右留白更易读；全局使用 Inter 字体与 Material Symbols 图标。
- 模块：基础设置（关键词、地域、学历/经验、期望薪资等）、高级设置（最大次数、间隔、窗口/调试、过滤不活跃 HR 等）、AI 设置（介绍与招呼语模板）。
- 交互：
  - 自动保存：任意改动后 ~0.8s 去抖写回 `config.yaml`；首屏仅展示不落盘。
  - 多值输入：关键词/地域采用 Chip 样式，支持 Enter/逗号添加、Backspace 删除；地域支持“全国/不限”互斥逻辑。
  - 表单基线：统一圆角/描边/焦点态与过渡动画，Checkbox/Switch/Select 等风格一致。
- 指示：右下角显示“正在保存…/已自动保存”。

![配置页面预览](images/config.png)

## 部署与启动
- 优先使用 Docker 一键脚本；亦支持源码快速启动、前后端分离开发、本地二进制。详见：`deploy.md`。

## 目录结构（要点）
- `main.go`：入口；加载 `config.yaml` 与 `.env`，启动 API/静态服务与投递主循环。
- `internal/api/`：后端路由与静态资源（`/api/config`、SPA 回退到 `front/dist/index.html`）。
- `internal/boss/`：投递核心逻辑（搜索、过滤、聊天、AI 招呼、计数与推送）。
- `internal/config/`：YAML 加载、选项编码映射、城市码解析、`.env` 读取。
- `internal/play/`：Playwright 封装、反检测、Cookie 读写与浏览器缓存路径处理。
- `internal/ai/`：AI Chat 客户端（兼容 OpenAI 风格接口，读取 `.env`）。
- `internal/bot/`：企业微信 Markdown 推送（读取 `.env` 与模板）。
- `front/`：Vite + React 前端；开发端口 3000，生产构建产物在 `front/dist`。
- `assets/`：静态资源（城市/行业编码、示例简历等）。
- `data/`：运行期数据（黑名单、Cookie、统计）。
- `Dockerfile` / `scripts/start.sh`：可选的单镜像运行与一键脚本。

## 配置文件
- `config.yaml`：业务配置（关键词、城市、筛选、开关、上限与间隔等）。
- `.env`：敏感信息（例如 `HOOK_URL`、`BASE_URL`、`API_KEY`、`MODEL`）。
- `data/boss/cookie.json` / `data/boss/browser_cookie.txt`：登录凭据（其一即可）。

更多部署与常见问题请阅读 `deploy.md`。
