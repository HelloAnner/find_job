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
    - 删除底部“保存设置”按钮，仅保留一个恢复默认按钮（已在 2025-12-03 完全移除）。
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
  - 首次登录：请在本地浏览器完成扫码并将 Cookie 保存到 `data/boss/browser_cookie.txt`（或 `data/boss/cookie.json`）后再启动服务；服务器侧默认后台静默，不再支持弹窗切换。
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


## 2025-12-03 前端 UI 全量重写（不改功能/接口）

- 目标：在保证接口与配置流不变的前提下，重做交互与视觉。所有选择/交互类组件（Select/CheckboxGroup/Switch/Input/Textarea/ChipInput）从头实现，更现代且可达性更好。

### 关键改动
1) 布局/导航
   - `front/src/components/Layout/Layout.tsx`：容器改为 `xl:w-2/3`，边距 `px-4…xl:px-40`；整体更轻。
   - `front/src/components/Layout/Sidebar.tsx`：窄栏+图标为主；激活态高亮；底部状态提示“自动保存开启”。
2) 基础组件（完全重写）
   - `front/src/components/shared/Select.tsx`：自绘 Listbox（ARIA/键盘导航/外点关闭/滚动捕获），替换原生 `<select>`；视觉与交互全面升级。
   - `front/src/components/shared/Input.tsx`：浮动标签样式、可选图标、改进焦点与禁用态。
   - `front/src/components/shared/Textarea.tsx`：舒适行高与焦点态，保留可选图标。
   - `front/src/components/shared/Switch.tsx`：支持 Space/Enter 键；ARIA 可达性完善。
   - `front/src/components/shared/CheckboxGroup.tsx`：卡片化选项、动效、全选/反选。
   - `front/src/components/shared/ChipInput.tsx`：动画/编辑/粘贴分割优化。
3) 保持业务不变
   - 页面文件 `BasicSettings/AdvancedSettings/AISettings` 的数据流与 `useConfig.updateConfig()` 调用未变；接口仍是 `GET/POST /api/config`。

### 验证
- 构建：`(cd front && npm ci && npm run build)` 通过；产物在 `front/dist`。
- 交互：
  - Select：方向键↑↓导航、Enter 选择、Esc 关闭；点击外部关闭。
  - Switch：Space/Enter 切换；aria-checked 正确更新。
  - ChipInput：Enter/逗号添加，Backspace 删除最后一项，双击编辑，粘贴自动拆分。
  - 自动保存：任何变更 ~0.8s 内写回，首屏仅展示不落盘（由 `ConfigProvider` 保持）。

### 影响范围
- 仅 `front/` 展示层；后端与接口不变。

### 坑点
- 自绘 Select 改为受控组件，若传入值不在 `options` 内将回退到首项；页面保证传值正确即可。


## 2025-12-03 UI 再打磨（OpenAI 风格极简设置）

- 目标：整体观感向 openai.com 设置页靠拢：极简、留白、细描边；左侧标签、右侧控件的“设置行”布局；交互轻量但精致。

### 新增组件
- Section：设置分组容器（标题/描述 + 极简卡片），路径 `front/src/components/shared/Section.tsx`。
- Field：设置行（左标签右控件），路径 `front/src/components/shared/Field.tsx`。
- MultiSelect：极简多选下拉（搜索、全选/清空、键盘导航），路径 `front/src/components/shared/MultiSelect.tsx`。

### 页面改造
- BasicSettings：采用 Section/Field 重排；规模/融资改为 MultiSelect；其余保持数据流不变。
- AdvancedSettings：采用 Section/Field 重排，文案与提示精简。
- AISettings：采用 Section/Field 重排，textarea 行高与占位优化。

### 视觉细节
- .card 去除阴影，仅保留轻描边与大圆角；按钮尺寸统一为 h-10；字体权重适度下降，观感更“冷静”。

### 验证
- 构建已通过：`(cd front && npm ci && npm run build)`。
- 可达性：Select/MultiSelect/Switch 均支持键盘操作与 ARIA 语义。


## 2025-12-03 主题与交互第二轮精修（中性灰 + ChatGPT 绿；RangeSlider 等）

- 主题（tokens）
  - tailwind.config.js：primary 由 `#3994ef` 调整为 `#10a37f`；背景为 `#f8fafc` / `#0b141c`。
  - index.css：新增 CSS 变量 `--bg/--surface/--surface-2/--line/--text/--muted/--primary`，组件改用 `var(--*)`；卡片仅细描边（无阴影）。
- 组件增强
  - MultiSelect：继续极简风，首屏在按钮内展示至多 3 个选中标签，支持搜索/全选/清空。
  - RangeSlider（新增）：双滑块范围选择，文件 `front/src/components/shared/RangeSlider.tsx`；用于薪资；保留输入框双轨校正。
  - Select/Input/Textarea/Switch：统一焦点态；可达性键盘支持保持完好。
- 页面
  - BasicSettings：薪资行加入 RangeSlider；规模/阶段改用 MultiSelect；描述文案更克制。
  - AdvancedSettings/AISettings：采用 Section/Field 布局，提示语更简洁。
- 验证
  - `cd front && npm ci && npm run build` 通过；产物已更新。


## 2025-12-03 垂直表单与默认暗色（OpenAI 风格对齐）

- 方向：所有设置项改为“上下结构”（标题/描述在上、控件在下），去除左右并列；默认使用暗色主题，背景/描边/文本采用中性灰 + ChatGPT 绿点缀。

### 改动
- Field 组件：重写为垂直布局（`front/src/components/shared/Field.tsx`），标题与描述置顶，控件置底；统一内边距与分隔线。
- AISettings：自我介绍/Prompt/模板 textarea 高度提升到 `min-h-56/48`，更适合长文输入；暗色下表面色改为更纯净的深色（`#0f1922`）。
- 默认暗色：`front/index.html` 的 `<html>` 加 `class="dark"`；`index.css` 用主题变量控制 `body` 的背景与文本色。

### 说明
- 主题变量：`--bg/--surface/--surface-2/--line/--text/--muted/--primary`，组件普遍取变量而非硬编码色。
- 兼容性：保留原 2/3 主内容宽布局；接口与自动保存逻辑不变。

### 验证
- `(cd front && npm ci && npm run build)` 通过；默认进入暗色风格，设置项为上下结构，文本域高度明显增大。


## 2025-12-03 侧边栏：默认展开，文字水平展示
- 需求：左侧边栏默认展开，菜单文字水平展示，不再仅显示图标。
- 改动：`front/src/components/Layout/Sidebar.tsx`
  - 宽度由 `w-18 sm:w-20` 调整为 `w-64`；
  - 顶部品牌区改为图标 + 文本（find_jobs / 配置面板）；
  - 导航项的文字从 `hidden xl:inline` 改为常显 `text-sm font-medium truncate`。
- 验证：`(cd front && npm run build)` 通过；菜单项文字默认可见。


## 2025-12-03 浏览器 Tab 图标（favicon）更换
- 新增：`front/public/favicon.svg`（绿底简约公文包图标，#10a37f），与主题一致。
- 修改：`front/index.html` 的 `<link rel="icon" …>` 指向 `/favicon.svg`。
- 验证：`(cd front && npm run build)` 通过；刷新浏览器即可看到新图标。

## 2025-12-04 ChipInput 清空确认移除，单项删除不再误触弹窗

- 背景：反馈“职位名称/关键词”中删除某一项时会弹出“是否清空全部”的确认，影响操作流畅度。
- 变更：移除 `ChipInput` 组件的 `window.confirm`，点击右上角“清空”将直接清空，不再弹窗；单项删除（点 `×` 或 Backspace）只会删除该项。
- 文件：`front/src/components/shared/ChipInput.tsx`
  - 替换 `clearAll()`：直接 `onChange([])`，不再 `window.confirm(...)`。
- 原因：浏览器阻塞式 `confirm` 容易被误解为“删除单项”的确认；且与整个站点的“极简/即时反馈”交互风格不一致。
- 验证：`(cd front && npm ci && npm run build)` 通过；页面上
  - 点击某个 Chip 的 `×` 仅删除该项；
  - 点击“清空”直接清空，不再出现弹窗；
  - 输入框 Backspace 在为空时仅删除最后一项，不影响其它项。
- 影响范围：`BasicSettings` 下“职位名称/关键词”“地域”的 ChipInput 行为一致更新；其他组件（Select/MultiSelect/Switch/Input）不受影响。

### 交互巡检（本次一并核对）
- MultiSelect：`清空` 为即时操作，无确认；`全选/取消全选` 正常；回车选择后自动清空搜索框。
- Select：方向键/Enter/Esc 键行为符合预期；面板实体背景，暗色可读性正常。
- Switch：Space/Enter 可切换，`aria-checked` 正确；
- Input/Textarea：顶部标签布局，无浮动重叠问题；数字输入带 `min` 限制。
- 城市 Chip：`全国/不限` 与其它城市互斥逻辑保持；
- 凭证替换：保留自定义确认对话框（仅在检查通过且与当前不同才出现）。

## 2025-12-04 配置实时同步与后端一致性（POST 归一化落盘）

- 背景：前端修改后，`config.yaml` 有时未体现期望的编码值（尤其是城市等枚举），导致“前端与文件不一致/运行时读取不一致”。
- 变更：后端在 `POST /api/config` 落盘前对配置做标准化（与 `config.Load()` 一致），确保写入文件与内存中的配置完全一致。
- 具体实现：
  - 新增 `internal/config/config.go: Normalize(cfg *Root)`，内部调用 `cfg.Boss.normalize()`（城市/经验/学历/规模/阶段等全部转为平台编码；默认值填充）。
  - `internal/api/server.go`：在 `handleUpdateConfig` 中 `json.Decode` 后调用 `config.Normalize(&newCfg)`，随后再 `UpdateConfig` 与写盘。
- 结果：
  - UI 任意字段修改 → 约 0.8s 自动保存 → 服务端写入标准化后的 YAML（如城市名转为编码，学历/经验/规模/阶段为编码）。
  - `GET /api/config` 返回内存中的同一份标准化配置，前后端实时一致。
- 验证：
  - 构建后运行服务，修改“经验/学历/薪资/间隔/机器人通知”等字段，观察 `config.yaml` 相应键（`boss.experience/degree/expectedSalary/interval`、`bot.is_send/template`）即时更新；城市将保存为编码（`0/100010000/…`）。
  - Go 构建验证：`go build ./...` 通过。
- 影响范围：`internal/api/server.go`、`internal/config/config.go`；前端无改动（仅依赖原有自动保存）。

## 2025-12-04 配置“完全生效”核对与补齐（waitTime/expectedSalary）

- 背景：前端页面上的“操作等待(秒)”与“薪资(千/月)”需在运行期实际生效。
- 变更：
  - 等待时间：`internal/boss/app.go` 将 `cfg.Boss.WaitTime` 应用到通用页面跳转的前后等待（`gotoWithHumanPause`）。当 `WaitTime>0` 时，每次页面操作之间等待为 `[WaitTime, WaitTime+10]` 秒；否则维持原有人类化短延时。
  - 期望薪资：在构建搜索 URL 时，若未显式选择离散 `salary` 档位，则根据 `expectedSalary[0]` 推导 Boss 的 `salary` 区间码（402~407），从而影响搜索结果。
- 文件：
  - `internal/boss/app.go`：新增 `globalWaitTimeSec`、改造 `gotoWithHumanPause`；新增 `deriveSalaryFromExpected()` 并在 `buildSearchURL()` 中使用。
- 验证：
  - 将“操作等待(秒)”设为 5，运行时日志提示“操作等待时间设置为 5-15 秒”，页面跳转明显放缓；恢复为 0 则回到快速模式。
  - 将“薪资(千/月)”最低填 15，搜索 URL 自动带上 `salary=405`（10-20K），搜索结果与区间匹配。
- 影响范围：仅 Boss 投递流程的节奏与搜索条件；其余逻辑不变。

## 2025-12-04 前端内置城市字典（全量映射，显示中文）

- 背景：前端此前只做“全国/不限”的最小解码，其他城市会显示编码，不直观。
- 变更：
  - 新增 `front/src/data/cities.json`（由后端 `assets/boss/city-industry-code.json` 拷贝，内置约 2k 城市编码）。
  - 新增 `front/src/utils/cities.ts`：提供 `codeToName/nameToCode`、`decodeCities/encodeCities`、常量 `0(不限)/100010000(全国)`。
  - `front/src/contexts/ConfigContext.tsx`：
    - 拉取后端配置时用 `decodeCities()` 将编码→中文名；
    - 保存到后端时用 `encodeCities()` 将中文名→编码。
- 结果：
  - 页面上“地域”Chip 显示中文城市名；保存时写入编码，运行期与 YAML 一致；仍保持“全国/不限与其他城市互斥”的逻辑。
- 构建：`(cd front && npm run build)` 通过。


## 2025-12-03 前端资源本地化打包（无外网依赖）

- 自托管字体
  - Inter Variable：下载至 `front/public/fonts/inter/InterVariable(.woff2/.Italic.woff2)`；`index.css` 内以 `@font-face` 引入，`font-display: swap`。
  - Material Symbols Outlined：通过 npm 包 `material-symbols` 引入，Vite 构建时将 `material-symbols-outlined.woff2` 打包到 dist（避免 Google Fonts 远程加载）。
- 移除远程链接
  - 删除 `front/index.html` 中 Google Fonts 的 `<link>`；加入本地字体的 `<link rel="preload">`；favicon 已使用本地 `/favicon.svg`。
- 构建结果
  - `dist/assets/material-symbols-outlined-*.woff2` 已随产物打包，部署后无需外网；整体首屏加载不再请求 googleapis/gstatic。


## 2025-12-03 侧边栏固定与独立滚动
- 需求：左侧边栏与右侧内容分离，左侧在任何情况下不滚动。
- 改动：
  - `front/src/components/Layout/Sidebar.tsx`：`aside` 改为 `fixed inset-y-0 left-0 w-64 overflow-hidden`，确保完全固定。
  - `front/src/components/Layout/Layout.tsx`：右侧 `main` 使用 `ml-64 h-screen overflow-y-auto`，仅右侧区域滚动。
- 验证：`(cd front && npm run build)` 通过；滚动页面时左侧完全不动，右侧独立滚动。


## 2025-12-03 间隔/薪资输入与背景一致性

- 投递间隔：`front/src/pages/AdvancedSettings.tsx` 将原“投递间隔时间 (秒)”改为按小时的 `interval` 选择器（1/2/3/4/6/8/12/24h），与后端 `config.boss.interval` 保持一致；同时将操作等待字段收敛为单个输入（秒），避免浮动标签与值重叠。
- 薪资输入：删除 RangeSlider 组件（`front/src/components/shared/RangeSlider.tsx`），`BasicSettings` 仅保留上下限数字输入，直接映射 YAML 的 `[min, max]`；hint 文案同步为“单位千/月”。
- UI 调整：`front/src/components/Layout/Sidebar.tsx` 去掉底部“自动保存开启”提示；`front/src/components/Layout/Layout.tsx` 的右侧主区域强制使用 `bg-background-light`/`bg-background-dark`，与整体背景一致。
- 验证：`(cd front && npm run build)` 通过，自动保存逻辑不受影响；页面刷新后配置保留。


## 2025-12-03 移除恢复按钮

- 说明：后端不再支持手动恢复默认配置，前端相应按钮与确认弹窗全部移除，避免用户误以为存在该能力。
- 具体改动：
  - `front/src/pages/BasicSettings.tsx`、`AdvancedSettings.tsx`、`AISettings.tsx` 删除 reset 按钮与相关逻辑。
  - `front/src/contexts/ConfigContext.tsx` 去掉 `resetConfig` 导出，防止其他组件继续调用。
- 验证：`(cd front && npm run build)` 通过；页面不再渲染任何恢复按钮入口。


## 2025-12-03 窗口开启选项下线（默认后台静默）

- 前端：`front/src/pages/AdvancedSettings.tsx` 去掉“窗口开启方式”字段，配置类型与上下文（`front/src/types/config.ts`、`front/src/contexts/ConfigContext.tsx`）不再包含 `openWindows/showWindows`。
- 后端：`internal/config/config.go` 移除对应字段；`internal/boss/app.go` 始终以 Headless 模式启动浏览器，并在缺少/失效 Cookie 时直接报错提示本地导出 Cookie 文件；`loginWithVisibleWindow`/`scanLogin` 等可视化逻辑全部删除。
- 配置/文档：`config.yaml`、`README.md`、`deploy.md`、本文件相关段落统一说明“仅支持后台静默 + Cookie 文件”，不再提及 `boss.openWindows`。
- 验证：`(cd front && npm run build)` 与 `go test` 非必须；已执行 `cd front && npm run build`，并运行 `gofmt` 格式化 Go 代码。

## 2025-12-03 输入组件文字重叠修复

- 背景：多处输入类组件（特别是薪资上限/下限）采用浮动标签实现，聚焦/输入后标签与文字重叠；“公司规模”多选下拉在显示已选项时也会发生文字挤压，用户反馈体验较差。
- 关键改动：
  1) `front/src/components/shared/Input.tsx`：移除浮动标签逻辑，改为“顶部标签 + 普通占位符”的稳定布局；输入框仍保持圆角/描边/焦点态，彻底消除浮动标签与内容叠加问题。
  2) `front/src/components/shared/MultiSelect.tsx`：触发按钮改为 `min-h-[3rem]` + `py-2`，上方显示“已选择 N 项”，下方用可换行的 Chip 列表展示前三项（其余用 `+X` 表示），防止文本在按钮内堆叠。
- 坑点：Input 组件现在默认显示顶部标签，如需完全隐藏请传空字符串；MultiSelect 的按钮高度增加，如需更紧凑可在外层容器自行覆盖。
- 验证：`cd front && npm run build` 成功，确保改动未引入构建错误。

## 2025-12-03 公司规模/融资阶段“不限”选项补齐

- 背景：UI 约定“公司规模”与“融资阶段”的第一项需为“不限”，但选项数组缺失，导致下拉列表首项不是“不限”，同时无法单选“不限”。
- 变更：`front/src/pages/BasicSettings.tsx` 为 `scaleOptions`、`stageOptions` 追加 `{ value: '不限', label: '不限' }` 并置顶；`handleScaleChange`/`handleStageChange` 新增互斥逻辑，当选择具体选项时自动移除“不限”，仅保留一个“不限”或若干具体值，避免混合状态。
- 验证：`cd front && npm run build` 通过；前端刷新后可见两个多选下拉的首项均为“不限”，且选择具体选项会自动取消“不限”。

## 2025-12-03 下拉面板背景不透明

- 背景：默认暗色主题下，Select/MultiSelect 的下拉面板使用 `var(--surface)`（半透明），叠加正文时文字会重影；需要保持实体背景避免与页内容混合。
- 改动：
  1) `front/src/components/shared/Select.tsx`：触发按钮与面板背景统一为 `bg-white dark:bg-[#0f1922]`，并加强阴影，保证弹层视觉独立。
  2) `front/src/components/shared/MultiSelect.tsx`：按钮、面板、搜索框背景同样换成实体色，额外加 `shadow-2xl`，防止列表与底部内容融合。
- 验证：`cd front && npm run build` 通过；下拉面板完全不透明，文字不会与下层重叠。

## 2025-12-03 主题切换按钮 + 明亮模式

- 背景：只有暗色主题且默认强制 `dark`，无法切换明亮模式；需要右上角小图标快速切换，并根据系统偏好自动初始化。
- 改动：
  1) `front/src/components/ThemeToggle.tsx`（新增）——负责读取系统/本地偏好并渲染右上角浮动按钮，点击后在暗/亮之间切换并记忆选择。
  2) `front/src/components/Layout/Layout.tsx` 引入 `ThemeToggle`，保证所有页面全局可见。
  3) `front/index.html` 移除固定 `class="dark"`，加上首屏脚本在 React 启动前应用合适主题，避免闪烁。
- 验证：`cd front && npm run build` 通过；刷新后保持最近一次选择，若未手动选择则跟随系统暗/亮模式自动切换。

## 2025-12-03 企业微信机器人配置前端化

- 背景：后端 `bot` 配置控制企业微信机器人通知（`is_send` + Markdown 模板），但前端页面未明确呈现，导致无法在 UI 中编辑。
- 改动：
  1) `front/src/pages/AISettings.tsx` 新增“企业微信机器人通知”分节，展示推送开关 + 模板 textarea，并列出可用占位符（jobLink/companyName/jobArea/salary/greeting/status/timestamp）供参考；强调需在环境变量 `HOOK_URL` 配置 Webhook。
  2) 复用现有 `Switch`/textarea，保持自动保存逻辑。
- 验证：`cd front && npm run build`；在页面中切换“启用通知”、编辑模板后约 0.8s 自动保存到 `config.yaml`，并能正确展示所有占位符说明。

## 2025-12-03 明亮模式文字对比增强

- 背景：主题切换上线后，明亮模式下部分标签（Field/ChipInput）仍使用偏亮的文字颜色（#e6eef7），与白色背景对比度过低，影响可读性。
- 改动：
  1) `front/src/components/shared/Field.tsx` 的标签/提示色分别调整为 `text-[#0f172a]` 与 `text-[#5f6b76]`，暗色模式保留原样；
  2) `front/src/components/shared/ChipInput.tsx` 顶部 label 同步使用更深的文字色，确保在浅底上可读。
- 验证：`cd front && npm run build`，在明亮主题下查看设置页，字段标题/Chip 标签描述均能清晰可见。

## 2025-12-03 关键词扩展行内展示

- 背景：`BasicSettings` 中“关键词扩展”原本呈现为三行（标题、提示、开关行内再含“启用”文本），视觉冗余。
- 改动：
  1) `front/src/pages/BasicSettings.tsx` 将该项改为单独的行内卡片：左侧展示标题+提示，右侧直接放开关；
  2) `front/src/components/shared/Switch.tsx` 增加 `hideLabel`，允许隐藏开关文字但保留 ARIA label，保持统一交互。
- 验证：`cd front && npm run build`，页面中该行仅剩一段说明 + 右侧开关，再无多余“启用”字样。

## 2025-12-03 页面抬头居中与品牌配色修复

- 背景：主内容区域（基本/高级/AI/凭证）顶部标题与描述在右侧内容区仍左对齐；同时侧边栏品牌 `find_jobs` 在明亮模式下仍使用浅色文字，难以辨识。
- 改动：
  1) `front/src/pages/BasicSettings.tsx`、`AdvancedSettings.tsx`、`AISettings.tsx`、`CredentialsSettings.tsx` 的页面标题块加入 `items-center text-center`，在主区域顶部统一居中展示；
  2) `front/src/components/Layout/Sidebar.tsx` 将品牌文字改为 `text-[#0f172a] dark:text-white/90`（副标题 `text-[#5f6b76] dark:text-[#93a4b3]`），明亮模式下对比度正常。
- 验证：`cd front && npm run build`；切换至明亮主题时侧边栏标题可读，主内容顶部标题/描述居中对齐。

## 2025-12-03 README 增补许可证说明

- 背景：README 末尾缺少对仓库 LICENSE（Apache 2.0）的解释，外部读者不易了解使用限制。
- 改动：README 底部新增“许可证”小节，概述 Apache 2.0 的用途、再发行要求与免责声明，并链接到 `LICENSE` 文件。
- 验证：无需构建；Markdown 渲染正常，链接指向仓库根的 LICENSE。

## 2025-12-03 README 链接化 deploy.md

- 背景：README 中多处提到 `deploy.md` 但未提供可点击链接，阅读体验不佳。
- 改动：将“部署与启动”章节及底部“更多部署与常见问题”中的 `deploy.md` 均改为 `[deploy.md](deploy.md)`，方便直接跳转。
- 验证：无需构建，Markdown 渲染可直接点击链接。

## 2025-12-03 README 文案精修

- 背景：原 README 内容偏零散，缺少“快速上手”步骤与更清晰的模块划分。
- 改动：
  1) 重新组织 README 结构，突出“核心特性 / 运行流程 / 前端页面 / 快速上手 / 目录速查 / 配置文件 / 许可证”；
  2) 更新描述，明确自动保存、AI/通知流程、Playwright 依赖与脚本入口，并继续引用 `deploy.md` 获取详细部署方案。
- 验证：无需构建；Markdown 渲染正常，新结构更易阅读。

## 2025-12-07 凭证状态显示与成功后状态刷新

- 诉求：上传并“确认替换”成功后，前端缺少明确反馈；“当前状态”仅显示“系统正在使用默认凭证文件”，未包含文件名与上次更新时间。
- 实施：
  - 后端新增接口 `GET /api/credentials/status`，返回当前凭证文件信息：`path/fileName/exists/size/lastModified`。
  - 后端在 `POST /api/credentials/apply` 成功写入后补充返回 `lastModified`（来自落盘后的文件 `mtime`）。
  - 前端 `CredentialsSettings`：
    - 页面加载时调用 `/api/credentials/status`，在“当前状态”展示：
      - 文件：`{fileName}`；
      - 上次更新时间：`YYYY-MM-DD HH:mm:ss`（本地时区）；
      - 若不存在则提示“未找到凭证文件，请上传”。
    - 成功替换后保留顶部“登录凭证已更新成功”的提示，并自动刷新“当前状态”。
- 影响范围：
  - `internal/api/server.go`：注册 `GET /api/credentials/status`；
  - `internal/api/credentials.go`：新增 `handleCredentialStatus` 与 `credentialStatusResponse`；`handleCredentialApply` 在写入后补充 `LastModified`。
  - `front/src/pages/CredentialsSettings.tsx`：增加状态拉取、展示与应用成功后的刷新；新增本地时间格式化函数。
- 验证：`(cd front && npm run build)`、`go build ./...` 通过；替换成功后“当前状态”显示 `browser_cookie.txt` 与最新时间。

## 2025-12-07 运行期热读取配置（查看岗位前获取最新配置）

- 诉求：运行期间用户可能随时修改配置（AI 提示/招呼语、过滤条件、间隔/等待时间、通知模板等），需要在“每一次查看岗位”之前使用最新配置。
- 实施：
  - `boss.App` 增加 `getCfg func() *config.Root` 与 `env` 字段；`NewApp` 签名改为 `NewApp(cfg *config.Root, env config.Env, getCfg func() *config.Root)`。
  - 新增 `refreshConfig()`：从回调读取最新配置并更新 `a.cfg/aiCfg/maxChats`，重建 `bot.Client`，并让 `globalWaitTimeSec` 即时生效。
  - 调用点：
    - `Run()` 的城市循环开始前；
    - `postJobByCity()` 入口；
    - 每个关键词开始前；
    - 每次岗位循环（点击/查看岗位）前。
  - `main.go` 传入 `cm.GetConfig` 作为回调。
- 结果：岗位查看/筛选/招呼语生成/推送等均以“最新配置”执行；城市列表如在运行中变更，将在下一城市进入时生效。

### 2025-12-07 关键词列表“同轮热更新”

- 诉求：在同一轮城市内，关键词数组在运行中变化也要立即生效。
- 实施：`postJobByCity()` 将 `for _, keyword := range a.cfg.Keywords` 改为基于索引的循环，每次迭代调用 `refreshConfig()` 并重新读取 `a.cfg.Keywords`：
  - 若新增关键词，会在后续索引被遍历到；
  - 若减少长度，循环在索引越界时自然结束；
  - 顺序变更按最新数组顺序执行。
- 代码：internal/boss/app.go:432-440 附近。
- 验证：运行过程中在前端添加/删除关键词，下一次关键词迭代立即按新列表执行；`go build ./...` 通过。

### 2025-12-07 登录信息热加载（每个关键词结束后）

- 诉求：用户在运行中替换 `data/boss/browser_cookie.txt` 后，无需重启即可被后续请求使用。
- 实施：在 `postJobByCity()` 的每个关键词完成后，调用 `a.loadBrowserCookies(page)` 重新注入浏览器 Cookie；日志会提示成功与否：
  - 成功：“已重新加载登录信息文件，后续请求将使用最新 Cookie”；
  - 失败（如文件不存在/格式问题）仅记录日志并继续投递，不中断流程。
- 代码：internal/boss/app.go（关键词循环尾部）。
- 验证：
  1) 运行中替换 `data/boss/browser_cookie.txt`；
  2) 等待当前关键词结束，日志出现“已重新加载登录信息文件”；
  3) 下一关键词导航/请求按新 Cookie 生效（若 Cookie 失效会在登录检测阶段报错）。
- 验证：`go build ./...` 通过；运行过程中在前端修改 AI 文案/等待时间/筛选条件，下一次岗位点击前日志与行为即时体现（例如等待区间更改、AI 招呼语变化、过滤条件变更等）。

## 2025-12-11 浏览器解耦与低内存部署（browserless/chrome + docker-compose）

- 目标：将原“一体镜像（内置浏览器）”改为“两容器解耦”。
  - 浏览器：`browserless/chrome`（端口 3000，开启 `PLAYWRIGHT_CHROMIUM`，提供 `/playwright` WS 端点）。
  - 应用：本项目镜像仅包含 Go 程序与前端静态资源，通过 `pw.Chromium.Connect` 连接浏览器。

### 改动
- 代码：`internal/play/playwright.go`
  - 新增 `BROWSERLESS_URL`（ws 地址，如 `ws://browserless:3000/playwright?launch=1`）、`BROWSERLESS_MODE`（playwright/cdp，默认 playwright）、`PW_SLOWMO_MS`。优先用 `Connect`，失败自动回退 `ConnectOverCDP`，均带重试；未配置时回退本地 `Launch`（仅开发）。
- Docker：`Dockerfile`
  - 构建阶段预装 Playwright driver（仅 driver，不下载浏览器），运行时复制到 `/opt/playwright/driver`；删除本地浏览器系统依赖安装，减小镜像与运行内存。
  - 运行时设置 `PLAYWRIGHT_DRIVER_PATH` 与 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`。
- Entrypoint：`docker/boss-entrypoint.sh` 去除本地浏览器/driver 强校验，增加外接浏览器提示。
- Compose：新增 `docker-compose.yml` 与 `scripts/up-compose.sh`，默认启动 `browserless` + `boss` 两服务。
- 文档：更新 `README.md`、`deploy.md`，将“docker compose 双容器”设为推荐方案；源码模式给出 `BROWSERLESS_URL` 示例。

### 验证
- `go build ./...` 通过；
- `docker compose up -d --build` 后：
  - `http://localhost:38888` 可访问；
  - 日志含 `[playwright] 使用外接浏览器: ws://browserless:3000/...`；
  - 投递流程、AI/推送、自动保存一致；单机内存占用相较单镜像明显降低。

### 迁移
- 保留旧 `scripts/start.sh`（单镜像）以兼容历史，但不再推荐；优先使用 `./scripts/up-compose.sh`。
