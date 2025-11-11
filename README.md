# BOSS 自动投递（Go 版）

该版本将原 Java 项目的 BOSS 直聘自动投递逻辑完整迁移到 Go，可通过 Playwright 模拟浏览器登录、黑名单维护、AI 打招呼、Cookie 复用等功能。发布包已经和 Java 时代一样自带 `.playwright/` 浏览器运行时，解压即可使用。

## 目录结构

- `boss`（Go 可执行文件）/`scripts/start.sh`：运行入口
- `config.yaml`、`.env`：与原项目相同的配置
- `config.yaml` 中新增 `boss.max`（默认 100），用于限制每日自动打招呼次数；计数保存在 `data/boss/stats.json`，每天自动重置。
- `config.yaml` 中新增 `boss.interval`（默认 1），单位小时。程序会无限循环执行：运行一次 -> 等待 `interval` 小时 -> 再执行。
- `config.yaml` 中新增 `boss.openWindows` / `boss.showWindows`（默认 true），为 false 时 Playwright 采用无头模式运行。若该模式下检测到 Cookie 失效，会自动临时弹出浏览器完成扫码登录，随后继续无头流程。
- `bot.is_send` 控制企业微信推送开关；`bot.template` 支持使用 `{{变量名}}` 占位符自定义推送内容（详见“企业微信通知模板”）。
- `assets/`：静态资源（例如 `assets/boss/city-industry-code.json`、`assets/resume.jpg`）
- `data/`：运行期产生的黑名单、Cookie 等数据（默认 `data/boss/data.json`、`data/boss/cookie.json`）
- 项目根目录包含默认配置文件模板（`config.yaml`、`.env`），用于开发和打包参考。

> **提示**：项目根目录的 `config.yaml`、`.env` 是默认模板配置；实际运行时请在仓库根目录准备真实的 `config.yaml` 和 `.env`（不会被 Git 跟踪），`./scripts/start.sh` 会将真实配置复制到 `build/` 环境中。

## 运行方式

### 1. 开发/调试（本地已安装 Go）

```bash
./scripts/start.sh
```

脚本逻辑：
1. 初始化 `build/` 目录（若已存在则保留其中的 `data/`、`.playwright/` 等运行时文件，确保 Cookie 不被清空）；
2. 若 `build/` 中尚无 `config.yaml` / `.env`，则首次运行时从根目录复制一份；以后不再覆盖，方便你在 `build/` 内维护私有配置；
3. 若全局 `.playwright/` 不存在则安装一次，并复制到 `build/.playwright/`；
4. 在 `build/` 下编译当前平台的最新 `boss` 可执行文件；
5. 运行该二进制，使所有相对路径与 release 包一致（登录凭证永远保存在 `build/data/boss/cookie.json`）。
6. 程序启动前后台向大模型发送“你好”进行连通性自检；每条职位在投递前也会通过大模型判断是否与 `ai.introduce` 匹配，仅匹配的职位才会继续自动投递。
7. 运行结束后，主程序会按照 `boss.interval` 设定的小时数自动进入下一轮，无需手动重启。

### 2. 客户/部署环境（无 Go）

1. 确保已完成下文“Playwright 浏览器安装”；
2. 将 release 包解压（其中包含 `boss`/`boss.exe`、`scripts/start.sh`、配置文件等）；
3. 直接运行可执行文件：
   - macOS / Linux: `./boss`
   - Windows: `./boss.exe`

   或者使用通用脚本：

   ```bash
   ./scripts/start.sh
   ```

   每个 zip 中都包含 `boss`/`boss.exe`、`scripts/start.sh`、`.playwright/` 及运行所需配置（其中 `config.yaml`、`.env` 来自项目根目录的模板文件），解压后可直接运行；二进制会自动检测同级 `.playwright/` 并设置 `PLAYWRIGHT_BROWSERS_PATH`，双击 `boss.exe` 即可弹出浏览器窗口。

## Playwright 浏览器安装指引

> **前提**：请先安装 [Node.js LTS](https://nodejs.org/)。安装完成后即可使用 `npx` 命令。

> **注意**：release 包中已经包含 `.playwright/` 目录，无需额外安装即可运行；`./scripts/start.sh` 也不会再尝试自动下载浏览器。本节命令仅在你自定义部署位置或希望重新安装浏览器时使用。

Playwright-Go 依赖官方浏览器运行时。请根据操作系统执行以下命令（默认会将浏览器安装到 `~/.cache/ms-playwright` / `%USERPROFILE%\AppData\Local\ms-playwright` 等官方目录）：

### Windows（PowerShell）
```powershell
# 以管理员或普通 PowerShell 打开后执行
npx playwright install chromium
```

### macOS (Apple Silicon / ARM)
```bash
brew install node # 如果尚未安装 Node，可使用 Homebrew
npx playwright install chromium
```

### Linux (x86_64)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs   # 或使用发行版对应的 Node 安装方式
npx playwright install chromium
```

安装完成后，可选地通过 `PLAYWRIGHT_BROWSERS_PATH` 环境变量自定义浏览器缓存目录，例如：

```bash
export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
```

若你将浏览器缓存放在项目根目录的 `.playwright/` 下，`scripts/start.sh` 会自动检测并指向该目录。

## 企业微信通知模板

`bot.template` 的默认内容如下，可根据需要调整：

```
## 新投递成功
- 岗位：{{jobLink}}
- 公司：{{companyName}}
- 城市/经验：{{jobArea}}
- 薪资：{{salary}}
- 招呼语：{{greeting}}
- 状态：{{status}}
- 时间：{{timestamp}}
```

支持的占位符：

- `{{jobName}}`：岗位名称（纯文本）
- `{{jobLink}}`：岗位 Markdown 链接（若无链接则退化为岗位名称）
- `{{jobHref}}`：岗位原始链接
- `{{companyName}}`：公司名称
- `{{jobArea}}`：城市 / 经验 / 标签
- `{{salary}}`：薪资范围
- `{{greeting}}`：打招呼内容
- `{{status}}`：状态文案（默认“✅ 已发起沟通”）
- `{{timestamp}}`：推送时间（格式 `YYYY-MM-DD HH:MM:SS`）

将 `bot.is_send` 设为 `false` 时，所有场景下的企业微信推送都会被禁用。

## 打包

在具备 Go 环境的机器上执行：

```bash
./scripts/package.sh
```

脚本会：
1. 清理并重建 `dist/` 目录；
2. 分别为 Windows amd64、macOS arm64、Linux amd64 交叉编译 `boss` 可执行文件；
3. 自动下载/刷新 Playwright 浏览器运行时到 `./.playwright`，并与可执行文件、项目根目录的模板配置（`config.yaml`、`.env`）、`scripts/start.sh` 一并复制到目标目录；
4. 打包产物示例：`dist/boss-windows-amd64.zip` 等。

## GitHub Actions

`.github/workflows/release.yml` 会在每次 push 时自动：
1. 安装 Go；
2. 执行 `scripts/package.sh`；
3. 以 `release-<commit>` 为标签创建 Release，并上传三个 zip 包。

## 常见问题

1. **启动报错 `please install the driver first`**：说明 `.playwright/` 目录缺失；请重新执行 `./scripts/start.sh` 或 `./scripts/package.sh`，或确保 release 包完整解压。
2. **需要更新配置/黑名单**：继续编辑根目录下的 `config.yaml`／`data/boss/data.json`，与原 Java 项目保持一致（Java 版本仍使用 `src/main/java/boss/data.json`）。
3. **AI 401/403/404 错误**：检查 `.env` 中的 `BASE_URL`、`API_KEY`、`MODEL`；如使用非官方 OpenAI 兼容接口（火山引擎、DeepSeek 等），可额外设置 `BASE_PATH`（默认自动根据 `BASE_URL` 推断：若以 `/api/v3` 结尾则补全 `/chat/completions`，否则使用 `/v1/chat/completions`）或直接设置 `BASE_ENDPOINT`（完整 URL）。例如：
   ```env
   BASE_URL=https://ark.cn-beijing.volces.com/api/v3
   BASE_PATH=/chat/completions
   ```
   或者：
   ```env
   BASE_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions
   ```
3. **想要自带浏览器缓存**：只需将 `.playwright/` 目录放到可执行文件同级，启动脚本会自动指向该路径。
