# AGENTS.md（find_jobs）

## 项目内约定
- MCP 工具：遇到新的框架/不熟悉内容，优先用 `context7` 获取官方用法。
- 日志：优先使用英文。
- 注释：优先使用中文，简洁有效，关键处补充，不要泛滥。
- 对话：优先使用中文。
- 信息同步：每次修复后更新本文件，记录坑点与更新历史；并在对话里同步改动思路、原因与方案。
- 明令禁止：任何时候都不可以 `git add` / `git commit` 任何代码。

---

## 2025-12-02 UI 对齐与主页面宽度（2/3）

- 背景：前端页面与 `ui/` 下 HTML 原型存在差异；主页面内容区域过窄。
- 结论：主内容宽度按可用区域 2/3 显示；字体与图标与原型对齐；移除模板样式对整体宽度的限制。

### 关键改动（第一步）
1) 布局容器（主页面宽度）
- 文件：`front/src/components/Layout/Layout.tsx`
- 变更：去除固定 `max-w-[960px]`，改为 `w-full xl:w-2/3`（≥xl 时占可用区域 2/3）。
- 同时收敛两侧 padding：`px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24`。

2) 字体与图标（与 ui 原型一致）
- 文件：`front/index.html`
- 增加：Google Fonts `Inter` 与 `Material Symbols Outlined`；`<html lang="zh-CN">`；标题改为“find_jobs”。

3) 全局字体族
- 文件：`front/src/index.css`
- 变更：`body` 使用 `@apply font-display`，与原型一致（原为 `font-sans`）。

4) 移除根节点宽度限制
- 文件：`front/src/App.css`
- 变更：删除 Vite 模板默认的 `#root { max-width:1280px; margin:auto; padding:2rem; text-align:center; }`，改为不限制宽度并左对齐。

### 问题原因（坑点）
- 固定 `max-w-[960px]` 导致大屏过窄，无法达到“2/3 页面宽度”。
- Vite 模板 `#root` 的 `max-width:1280px` 与居中样式额外限制了整体布局。
- 未引入 `Inter` 与 `Material Symbols`，导致和 `ui/` 原型显示差异（图标、字重、字距）。

### 对比历史实现
- 旧：`max-w` 固定 + 模板样式限制；字体/图标缺失。
- 新：响应式按比例（≥xl 为 2/3），移除模板限制，补齐字体/图标，视觉更接近原型。

### 验证
- 构建：`(cd front && npm run build)` 成功，产物位于 `front/dist`，由后端 `internal/api/server.go` 通过 `./front/dist` 提供静态资源。
- 浏览器验证：在 ≥1280px 宽度下，主内容区域约为可用宽度的 2/3；小屏保持自适应占满。

### 影响范围
- 仅前端展示层（`front/`）。后端 `main.go`/接口不受影响。

### 后续可选优化
- 如需“严格以视口宽度的 2/3（含侧边栏）”可将内部容器改为 `w-[66.6667vw]` 并相应调整外层 padding；当前实现以“去除侧边栏后的可用区域”为参考。

## 2025-12-02 UI 细节二次对齐（行高/阴影/间距/图标/表单）

- 目标：在保留“主内容 2/3 宽度”的前提下，将其余视觉细节尽量与 `ui/` 下原型保持一致，保证美观。

### 新增与调整
1) 外层边距回归原型
   - 文件：`front/src/components/Layout/Layout.tsx`
   - `px-…` 恢复为：`px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40`（与 `ui/` 原型一致）；仍保留 `xl:w-2/3` 宽度策略。

2) 图标样式统一
   - 文件：`front/src/index.css`
   - 新增 `.material-symbols-outlined` 的 `font-variation-settings` 与 `font-size:20px`，与原型一致。

3) 表单视觉基线
   - 依赖：新增 `@tailwindcss/forms`
   - 文件：`front/tailwind.config.js` 引入 `forms()` 插件；`front/package.json` devDependencies 新增 `@tailwindcss/forms`。
   - 影响：标准化 `input/select/textarea` 的基础样式与焦点态，与原型风格更一致（我们的自定义类仍在其上叠加）。

4) 阴影/行高/间距
   - 各页面卡片与 Header 统一使用 `shadow-sm`、`rounded-xl`、`p-6`、`px-4 py-3`、标题 `leading-tight`、正文 `leading-normal`，与原型一致（此前已基本一致，本次确认与补齐）。

### 坑点与说明
- `form-input`/`form-select`/`form-textarea` 类本质由 `@tailwindcss/forms` 提供；未启用插件时它们不生效（但我们仍有自定义类保障显示）。本次加入插件以完全对齐原型的表单基线。
- `ui/` 原型的 Tooltip 宽度在不同页面存在 220/240px 差异；当前全局设为 240px，视觉影响可忽略，如需严格逐页跟随可再细分类名。
- 主内容宽度继续遵循你的要求（2/3 可用区域），未回退到原型的 `max-w-[960px]`。

### 构建验证
- `cd front && npm run build` 成功，产物大小变化主要来自 `@tailwindcss/forms`。

## 2025-12-02 现代化视觉提升（无改交互）

- 目标：在现有信息架构不变前提下，整体风格更现代、轻盈、统一。

### 主要改动（以组件细节为主，不改变整体配色）
- 现代卡片基线：新增 `.card` 组件类
  - 文件：`front/src/index.css`
  - 效果：`rounded-2xl + ring-1 + shadow-sm`，悬停 `hover:shadow-md`；统一浅描边与柔和阴影。
- 全局排版微调（不改配色）
  - 文件：`front/src/index.css`
  - `body` 仅增加 `antialiased` 提升渲染，不再全局覆盖文字/选区颜色。
- 侧边栏（保留原配色）
  - 文件：`front/src/components/Layout/Sidebar.tsx`
  - 保留原背景/边框配色，仅对激活态增加轻微 `ring-1` 和 `font-semibold`，hover 保持原有色调。
- 页面容器与间距
  - 文件：`front/src/components/Layout/Layout.tsx`
  - 主体垂直间距 `py-6`；右下角新增自动保存指示器。
- 自动保存指示器
  - 新文件：`front/src/components/SaveIndicator.tsx`；在 `Layout` 中挂载。
- 语义标题级别微调
  - 各页面二级标题统一 `font-semibold tracking-tight`。

### 验证
- 前端构建：`cd front && npm run build`。
- 交互：修改任意字段，右下角会显示“正在保存…/已自动保存”。

## 2025-12-02 组件美化（Checkbox/Select/Input/Textarea）

- 目标：不改整体配色，仅用 Tailwind 提升表单组件的现代感与易读性。

### 实施
- 共享组件（统一基线样式）
  - `front/src/components/shared/Input.tsx`：圆角 `rounded-xl`、描边 `ring-1`、聚焦 `focus:ring-2 focus:ring-primary/40`、过渡 `transition-shadow`。
  - `front/src/components/shared/Textarea.tsx`：同上，`min-h-32`，保留可调整高度。
  - `front/src/components/shared/Select.tsx`：`appearance-none` + 自定义下拉箭头；和输入同一视觉基线。
  - `front/src/components/shared/CheckboxGroup.tsx`：使用 `rounded-md` + `accent-primary` + `focus:ring-2 focus:ring-primary/30`，更清晰。
  - 新增 `front/src/components/shared/Switch.tsx`：统一开关组件（替换页面内自定义 switch）。
- 页面内内联表单同步到同一风格
  - `front/src/pages/BasicSettings.tsx`：改用共享 `Input`/`Select`/`Switch` 组件（关键词、地域、经验、学历、薪资）。
  - `front/src/pages/AdvancedSettings.tsx`：改用共享 `Select`/`Input`/`Switch`（窗口方式、间隔时间、最大投递次数、简历路径、调试模式、过滤不活跃 HR）。
  - `front/src/pages/AISettings.tsx`：`Switch` 替换自动发送开关，所有 `textarea` 使用共享样式。

### 说明
- 未改动主色/背景，只在圆角、描边、焦点态与过渡上现代化；与“仅修改细节和组件”的要求一致。
- `accent-primary` 依赖 `tailwind.config.js` 中的 `colors.primary`（已存在）。

## 2025-12-02 自动保存 & 移除顶部标题/保存按钮

- 背景：需求删除各页面顶部品牌字样（原“自动化找工作机器人”）；去掉所有“保存配置/保存设置”按钮，改为自动保存；前后端同时适配。

### 前端
- 自动保存：在 `ConfigProvider` 中为 `updateConfig` 增加 800ms 去抖保存逻辑；每次表单变更后自动 POST `/api/config`。
  - 文件：`front/src/contexts/ConfigContext.tsx`
  - 变更：引入 `useRef` 定时器；新增 `scheduleAutoSave()`；`updateConfig()` 中触发去抖保存；卸载时清理定时器。
- 移除“保存”按钮与顶部品牌标题：
  - 文件：`front/src/pages/AISettings.tsx`、`front/src/pages/AdvancedSettings.tsx`
    - 删除顶部 Header（包含品牌标题与“保存配置”按钮）。
    - 删除底部“保存配置”按钮。
  - 文件：`front/src/pages/BasicSettings.tsx`
    - 删除底部“保存设置”按钮，仅保留“重置”。
- 备注：HTML `<title>` 已改为“find_jobs”，页面内顶部品牌字样已删除。

### 后端
- 为自动保存场景增加无缓存响应头：
  - 文件：`internal/api/server.go`
  - `GET /api/config` 与 `POST /api/config` 设置 `Cache-Control: no-store`，避免浏览器/代理缓存影响实时性。
- 说明：原有 `POST /api/config` 已带互斥写入与 YAML 合并；可安全承载频繁自动保存请求。

### 对比与原因
- 旧：手动点击“保存配置/保存设置”触发保存；顶部有品牌标题。
- 新：任何修改后 0.8 秒自动保存；删除所有保存按钮与页面顶部品牌标题，界面更简洁，交互更顺畅。

### 验证
- 构建：`cd front && npm run build`。
- 运行后打开前端，修改任意字段后约 0.8s 自动保存到 `config.yaml`（后端日志可见写入）。

## 2025-12-02 文档与标题命名统一为 `find_jobs`

- 需求：将文档/标题中的“自动(化)找工作机器人”统一为 `find_jobs`。
- 操作：
  - 修改浏览器标签标题：`front/index.html` 的 `<title>` 由中文改为 `find_jobs`。
  - 本文件（AGENTS.md）中涉及标题说明的内容已改写为 `find_jobs`；保留一处历史描述括注“原‘自动化找工作机器人’”。
- 说明：`ui/` 下 HTML 原型作为设计参考保留原始中文标题，不影响项目实际命名；若需要也替换，请明确是否覆盖设计稿。
## 2025-12-02 多选输入美化（Chip 展示）

- 目标：将“以逗号分隔”的多值输入美化为 Chip 标签，每个值独立展示、可一键移除；交互更直观。

### 实施
- 新增 `front/src/components/shared/ChipInput.tsx`：支持 Enter/逗号添加、Backspace 删除最后一项、失焦自动提交；保持现有配色。
- 替换使用点：
  - `BasicSettings` 中的“职位名称/关键词”“地域”均由文本输入改为 `ChipInput`，并直接更新数组字段。
  - “地域”支持特殊值“全国/不限”，与其他城市互斥。实现：`handleCityChipsChange()` 中若包含“全国/不限”则仅保留 `['全国']` 写回，后端在加载时会映射为代码 `100010000`（见 `internal/config/config.go` 的 `cityEnum`）。

### 说明
- 未引入外部库，纯 Tailwind 实现；支持键盘操作与鼠标点击移除。
- 若后续需要联动城市代码，可在 `ChipInput` 基础上扩展“建议列表/自动完成”。

## 2025-12-02 配置加载与保存行为（首屏仅展示，变更才保存）

- 需求：前端首次打开页面使用后端 `config.yaml` 展示；不修改则不更新后端；只有用户在页面上修改后才写回后端。

### 核心改动
- 兼容后端 GET 返回的大小写字段：
  - 文件：`front/src/contexts/ConfigContext.tsx`
  - `transformApiToFrontend()` 同时兼容 `Boss/AI/Bot`（大写）与 `boss/ai/bot`（小写）的 JSON 字段，避免首次加载取不到值。
- 首屏不落盘（脏检查 + 去抖保存）：
  - 新增 `lastSyncedRef` 作为“已与后端同步”的前端配置快照。
  - `fetchConfig()` 拉取并转换后，设置 `lastSyncedRef`，仅展示不保存。
  - `saveConfig()` 在真正 POST 之前用 `deepEqual()` 与 `lastSyncedRef` 比较，若无差异则直接跳过保存（打印日志 `[autosave] 配置未变化，跳过保存`）。
  - 仍保留 800ms 去抖；只有 `updateConfig()`（用户交互触发）才会调度保存。
- 城市编码最小解码：
  - 新增 `decodeCities()`，将后端编码中的 `0`→“不限”、`100010000`→“全国”，其它编码原样展示（后续可扩展完整字典）。

### 问题原因（坑点）
- 之前仅按小写字段读取后端 JSON（`apiData.boss`），而后端默认返回大写（`Boss`），导致前端首次加载得到空值，进而后续一改即“覆盖式保存”。
- 自动保存缺少“未改动”判断，容易把“仅展示”的初始数据也写回后端。

### 对比与结果
- 旧：首次加载可能显示为空/默认值；任何联动都可能触发保存。
- 新：首次加载严格来自 `config.yaml` 并仅展示；只有用户修改后才会在 0.8s 内保存到后端；未变更绝不发起 POST。

### 验证
- 构建：`cd front && npm run build` 通过。
- 行为：刷新页面→看到 `config.yaml` 的当前值；不做任何修改→无保存日志；编辑任意字段→约 0.8s 后自动保存。

### 影响范围
- 仅前端配置上下文 `front/src/contexts/ConfigContext.tsx`；接口定义与后端写盘逻辑不变。

### 后续可选
- 完整城市编码↔名称字典（前端自动完成/选择器），避免展示原始编码；当前最小解码已满足“全国/不限”的主流程。

## 2025-12-02 新增部署文档 deploy.md（源码快速启动）

- 目的：提供一份面向“从源码直接启动”的最短路径说明，覆盖本机运行、前后端分离开发、二进制运行与 Docker 可选方案。

### 新增
- 新文件：`deploy.md`
  - 前置依赖：Go ≥ 1.25、Node ≥ 20；（可选）Docker。
  - 本机启动：
    - 构建前端：`(cd front && npm ci && npm run build)`。
    - 安装 Playwright 浏览器：`go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium`。
    - 启动后端：`go run .`（服务端口 38888，提供静态资源与 `/api`）。
  - 开发模式：后端 `go run .`（38888）+ 前端 `(cd front && npm run dev)`（3000，已代理 `/api`）。
  - 生产模式：`go build -o boss ./` 后直接运行 `./boss`。
  - Docker（可选）：`./scripts/start.sh` 一键构建运行，或 `docker build` + `docker run`。
  - 首次登录两种路径：
    1) `boss.openWindows: true` 可视化扫码，生成 `data/boss/cookie.json`；
    2) 直接提供 `data/boss/browser_cookie.txt` 或 `data/boss/cookie.json`。
  - 端口说明：默认硬编码 38888，如冲突需改 `main.go` 并重新编译（或仅在 Docker 中更改宿主映射端口）。

### 坑点
- 无头模式且缺少 Cookie 会直接退出（先用可视化扫码或提供 Cookie）。
- 未安装 Playwright 浏览器会报 driver/browsers 缺失（执行安装命令）。

### 验证
- 本机：按文档步骤可启动并访问 `http://localhost:38888`；前端在 ~0.8s 自动保存配置到 `config.yaml`。
- Docker：`./scripts/start.sh` 完成构建与启动，`docker logs -f boss-runner` 可见投递日志。

## 2025-12-02 README 精简重写（介绍/流程/原理/部署入口/目录）

- 目的：将冗长说明压缩为“项目介绍 + 工作流程 + 原理 + 部署入口（指向 deploy.md）+ 目录结构”。
- 改动：
  - `README.md` 顶部标题统一为 `find_jobs`；
  - 保留核心概念（端口 38888、自动保存、Cookie 策略、AI/推送能力、循环策略）；
  - 部署细节移交到 `deploy.md`，避免两处重复；
  - 新增“目录结构（要点）”小节，定位常用源码文件夹。
- 坑点：
  - 旧 README 中的 Compose 与打包细节被移除，读者需转到 `deploy.md` 获取；
  - 保留中文说明，符合项目“对话中文”的约定。
- 验证：
  - 渲染检查：GitHub/本地均可正常渲染；链接 `deploy.md` 有效。

## 2025-12-02 部署方式顺序调整（Docker 优先）

- 目的：按你的要求，优先介绍 Docker 启动方式，源码启动放到其后；减少首次上手成本。
- 改动：
  - 重写 `deploy.md`：第 1 节为“Docker 一键启动（推荐）”，提供 `./scripts/start.sh` 与等价手动命令；
  - 将“基于源码运行/开发模式/常见问题/目录速查”置于其后；
  - `README.md` 的“部署与启动”小节改为“优先使用 Docker 一键脚本，详见 deploy.md”。
- 坑点：容器默认无头运行，必须先准备 Cookie（`data/boss/browser_cookie.txt` 或 `data/boss/cookie.json`）。
- 验证：
  - 本地执行 `./scripts/start.sh` 正常构建并启动容器；`docker logs -f boss-runner` 能看到“投递完成 | 岗位：”日志。

## 2025-12-02 README 增补“前端页面”与截图

- 目的：补充 UI 使用感知，降低首次上手成本；按你的要求把 `images/config.png` 嵌入到 README。
- 改动：
  - `README.md` 新增「前端页面」小节，说明布局、模块、交互（自动保存/Chip 输入/表单基线）与保存指示；
  - 内嵌图片：`![配置页面预览](images/config.png)`。
- 验证：GitHub/本地渲染正常，图片路径有效；与现有“部署与启动”“目录结构”内容不冲突。


## 2025-12-03 脚本迁移到 scripts/ 并修复前端依赖构建

- 目标：将仓库根的 `start.sh` 迁移到 `scripts/start.sh`，并解决一键脚本构建前端时报缺依赖/类型错误的问题，保证“开箱即用”。

### 变更
1) 脚本迁移与兼容
   - 新位置：`scripts/start.sh`（新增）。
   - 兼容入口：保留根目录 `start.sh` 作为薄包装，转发到 `scripts/start.sh`，避免历史路径失效。
   - 路径健壮性：脚本内部使用 `REPO_ROOT`（为 `scripts/..`）定位仓库根，挂载/构建均从根路径解析。
2) 前端依赖安装策略
   - 始终执行 `npm ci --no-audit --no-fund` 后再 `npm run build`，杜绝 `node_modules` 残留导致的“找不到模块/类型”。
   - 解决报错：`react-router-dom`、`axios`、`@vitejs/plugin-react-swc` 未找到；以及因类型缺失衍生的 `isActive implicitly has an 'any' type`。
3) 文档更新
   - `deploy.md`：`./start.sh` 改为 `./scripts/start.sh`。
   - `README.md`：目录速查中 `start.sh` 改为 `scripts/start.sh`。

### 原因与坑点
- 触发条件：之前脚本仅在 `node_modules` 不存在时才安装依赖；若目录存在但缺少新增依赖（例如引入了 `react-router-dom` 之后未重新安装），就会在 `npm run build` 阶段报 TS2307。
- 解决思路：以锁文件为准每次 `npm ci`，构建时间增加很少，但换来确定性与稳定性。

### 验证
- 本机验证：`(cd front && npm ci && npm run build)` 成功，产物在 `front/dist`；随后 `scripts/start.sh` 能完成镜像构建并启动容器。
- 影响范围：仅脚本与文档；后端/前端源码未改业务逻辑。


## 2025-12-03 deploy.md 明确两类一键脚本的使用场景
- 说明调整：
  - `scripts/start.sh` = 源码 + Docker 的本地启动（本机构建前端与镜像，再运行）。
  - `scripts/start-server.sh` = 纯 Docker + Hub 的服务器启动（无源码；从私有仓库拉取并运行）。
- 文档：在 `deploy.md` 顶部新增“脚本角色对比”，在第 1 节与第 6 节分别标注对应脚本，避免混淆。

