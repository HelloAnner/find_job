# 浏览器 Cookie 使用说明

## 概述

本项目支持使用浏览器导出的 cookie 文件进行 Boss 直聘的无头模式登录，解决了在服务器环境下无法弹出浏览器窗口进行扫码登录的问题。

## 支持的 Cookie 格式

### 1. JSON 格式
```json
[
  {
    "name": "__zp_stoken__",
    "value": "your_token_value",
    "domain": ".zhipin.com",
    "path": "/",
    "expires": "2025-12-31T23:59:59Z",
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

### 2. 文本格式
```
__zp_stoken__=your_token_value; domain=.zhipin.com; path=/; expires=Sat, 31 Dec 2025 23:59:59 GMT; HttpOnly; Secure
__zp_seo_uuid__=your_uuid_value; domain=.zhipin.com; path=/; expires=Sat, 31 Dec 2025 23:59:59 GMT
```

### 3. Netscape 格式
```
.zhipin.com	TRUE	/	TRUE	1738281599	__zp_stoken__	your_token_value
.zhipin.com	FALSE	/	FALSE	1738281599	__zp_seo_uuid__	your_uuid_value
```

## 使用方法

### 步骤 1：获取浏览器 Cookie

1. **在本地浏览器登录 Boss 直聘**
   - 使用 Chrome、Firefox 等浏览器访问 https://www.zhipin.com
   - 完成扫码登录

2. **导出 Cookie**
   - **方法 1：使用浏览器开发者工具**
     - 按 F12 打开开发者工具
     - 进入 Application/Storage 标签页
     - 找到 Cookies → https://www.zhipin.com
     - 手动复制需要的 cookie 信息

   - **方法 2：使用浏览器扩展**
     - 安装 Cookie 导出扩展（如 "Get cookies.txt"）
     - 导出为 JSON 或文本格式

   - **方法 3：使用程序自动生成**
     - 在本地有图形界面的环境运行一次程序
     - 程序会自动生成 `data/boss/cookie.json`
     - 将此文件重命名为 `data/boss/browser_cookie.json`

### 步骤 2：准备 Cookie 文件

1. **创建 cookie 文件**
   ```bash
   mkdir -p data/boss
   ```

2. **保存 cookie 数据**
   - 将导出的 cookie 数据保存到 `data/boss/browser_cookie.json`
   - 支持的文件名：`browser_cookie.json`、`browser_cookie.txt`

### 步骤 3：配置和运行

1. **确保无头模式配置**
   ```yaml
   # config.yaml
   boss:
     openWindows: false  # 确保设置为 false
     # ... 其他配置
   ```

2. **运行程序**
   ```bash
   # 使用 Docker Compose
   docker-compose up boss

   # 或直接运行
   go run main.go
   ```

## 工作流程

1. **检测 Cookie 文件**
   - 程序启动时检查 `data/boss/browser_cookie.json` 是否存在
   - 如果存在，优先使用浏览器 cookie

2. **Cookie 注入**
   - 通过 JavaScript 将浏览器 cookie 注入到 Playwright 页面
   - 设置到当前域名和 `.zhipin.com` 域名

3. **登录验证**
   - 访问 Boss 直聘主页
   - 检查登录状态
   - 如果 cookie 有效，直接开始投递流程

## 注意事项

1. **Cookie 有效期**
   - Boss 直聘的 cookie 通常有有效期
   - 过期后需要重新获取
   - 建议定期更新 cookie 文件

2. **安全性**
   - Cookie 文件包含敏感信息
   - 不要在公共仓库中提交 cookie 文件
   - 使用 `.gitignore` 忽略 cookie 文件

3. **故障排除**
   - 如果登录失败，检查 cookie 文件格式是否正确
   - 确保 cookie 没有过期
   - 查看程序日志了解详细错误信息

## 故障排除

### 常见问题

1. **"检测不到历史Cookie" 错误**
   - 确保 `data/boss/browser_cookie.json` 文件存在且格式正确
   - 检查文件权限

2. **登录状态失效**
   - Cookie 可能已过期
   - 重新获取最新的 cookie

3. **格式解析失败**
   - 检查 cookie 文件格式是否符合要求
   - 使用测试程序验证格式：`go run test_browser_cookie.go`

### 日志信息

程序会输出相关的日志信息：
```
[boss] 检测到浏览器Cookie文件，尝试加载…
[browser-cookie] 成功解析 X 个浏览器cookie
[browser-cookie] 浏览器cookie注入完成
[boss] 浏览器Cookie加载完成
```

## 高级配置

### 自定义 Cookie 文件路径

如果需要使用不同的文件路径，可以修改 `internal/boss/app.go` 中的配置：

```go
browserCookieFile := config.ResolvePath("your/custom/path/cookie.json")
```

### 环境变量支持

可以通过环境变量指定 cookie 文件路径：
```bash
export BOSS_BROWSER_COOKIE_FILE=/path/to/your/cookie.json
```

## 总结

使用浏览器 cookie 文件是在服务器无头环境下运行 Boss 直聘投递程序的最佳解决方案。通过这种方式，可以避免复杂的登录流程，直接使用已有的登录状态进行自动化操作。