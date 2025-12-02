# 快速部署（Docker 优先）

推荐用 Docker 一键启动；仅在需要二次开发或无 Docker 环境时，再使用“基于源码”的方式。

> 端口与静态资源：后端默认监听 `http://localhost:38888`，并直接提供 `front/dist` 作为静态资源目录。

---

## 1) Docker 一键启动（推荐）

前置要求：已安装并启动 Docker 守护进程。

### 1.1 准备配置
- `config.yaml`：业务配置（关键词、城市、开关等）。
- `.env`：敏感变量（AI/Webhook 等）。
- 登录 Cookie（二选一）：
  - `data/boss/browser_cookie.txt`（推荐，直接导出浏览器 Cookie 文本）；或
  - `data/boss/cookie.json`（Playwright cookies JSON）。

> 提醒：容器内默认无头运行；若缺少 Cookie 将直接退出。首次可在本机用“可视化扫码”方式生成 Cookie（见第 3 节），再把文件挂载给容器。

### 1.2 一键脚本

```bash
./start.sh
```

- 脚本会：构建前端 → 构建镜像 → 以 `boss-runner` 名称启动容器并映射 38888 端口。
- 配置挂载：`config.yaml`、`.env`、`data/` 会被映射到容器 `/app/…`。

查看日志/校验：

```bash
docker logs -f boss-runner
# 出现 “投递完成 | 岗位：…” 表示已正常投递
```

### 1.3 手动命令（可替代脚本）

```bash
docker build -t get_jobs-boss .
docker run -d --name boss-runner --restart unless-stopped \
  -p 38888:38888 \
  -v "$PWD/config.yaml:/app/config.yaml" \
  -v "$PWD/.env:/app/.env" \
  -v "$PWD/data:/app/data" \
  get_jobs-boss
```

---

## 2) 基于源码运行（本机）

适用于需要调试/二次开发的场景。

### 2.1 前置依赖
- Go ≥ 1.25（见 `go.mod`）
- Node.js ≥ 20 与 npm

### 2.2 一键启动

```bash
(cd front && npm ci && npm run build)

go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium

go run .
```

访问 UI：`http://localhost:38888`。配置改动会在 ~0.8s 内自动保存到 `config.yaml`。

---

## 3) 开发模式（前后端分离热更新）

两个终端并行：

```bash
# 后端 + API（端口 38888）
go run .

# 前端（端口 3000，已代理 /api -> 38888）
(cd front && npm ci && npm run dev)
```

首次可将 `config.yaml` 的 `boss.openWindows: true`，弹窗扫码登录并生成 `data/boss/cookie.json`；随后可切回无头模式。

---

## 4) 常见问题

- 容器启动即退出：多为 Cookie 缺失。优先提供 `data/boss/browser_cookie.txt` 或先在本机扫码生成 `data/boss/cookie.json`。
- 本机源码运行报 “please install the driver first”：执行
  ```bash
  go run github.com/playwright-community/playwright-go/cmd/playwright@v0.5200.1 install chromium
  ```
- 端口冲突：默认硬编码 38888；源码模式可改 `main.go` 后重编译；Docker 可仅改宿主映射端口 `-p <host>:38888`。
- AI 401/403：检查 `.env` 的 `BASE_URL`、`API_KEY`、`MODEL`。

---

## 5) 目录/文件速查

- `front/` 前端源码（Vite + React + Tailwind）；生产构建输出 `front/dist`
- `internal/api/server.go` 后端 API 与静态资源服务
- `internal/boss/*` 投递自动化流程（Playwright）
- `internal/config/*` 配置加载/映射、`.env`
- `internal/ai/*` AI 客户端；`internal/bot/*` 企业微信推送
- `config.yaml` 业务配置；`.env` 敏感变量；`data/boss/*` 登录与状态文件

更多细节与高级用法，见 `README.md`。
