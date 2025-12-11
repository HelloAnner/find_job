package play

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/playwright-community/playwright-go"
)

// Runner encapsulates the Playwright browser/page lifecycle.
type Runner struct {
	pw      *playwright.Playwright
	browser playwright.Browser
	context playwright.BrowserContext
	page    playwright.Page
}

// NewRunner creates a chromium runner configured like the Java PlaywrightUtil.
// It also enables stealth evasion scripts.
// NewRunner 创建浏览器运行器。
// 优先从环境变量读取 Browserless 远程端点并进行连接；
// 环境变量：
//   - BROWSERLESS_URL: 形如 ws://browserless:3000 或 ws://browserless:3000/chromium/playwright
//   - BROWSERLESS_MODE: "playwright"（优先使用 pw.Chromium.Connect）或 "cdp"（使用 ConnectOverCDP）。默认 playwright；
//   - PW_SLOWMO_MS: 数值，整体放慢操作节奏（默认 50）。
//
// 若未提供 BROWSERLESS_URL，则回退为本地启动（原有行为不变）。
func NewRunner(headless bool) (*Runner, error) {
	ensurePlaywrightCache()

	// 启动 Playwright driver（仅几 MB；不下载浏览器）
	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("start playwright: %w", err)
	}

	slowMo := float64(50)
	if v := os.Getenv("PW_SLOWMO_MS"); v != "" {
		if n, err := parseFloat(v); err == nil && n >= 0 {
			slowMo = n
		}
	}

	// 读取远程端点
	if ws := strings.TrimSpace(os.Getenv("BROWSERLESS_URL")); ws != "" {
		mode := strings.ToLower(strings.TrimSpace(os.Getenv("BROWSERLESS_MODE")))
		if mode == "" {
			mode = "playwright"
		}

		var browser playwright.Browser
		// 优先按用户要求使用 Connect（原生 Playwright 协议），失败时自动回退到 CDP；均带重试
		if mode == "playwright" {
			browser, err = connectPlaywrightWSWithRetry(pw, ws, slowMo, 10, 2*time.Second)
			if err != nil {
				log.Printf("[playwright] Connect 失败(%v)，尝试 ConnectOverCDP… | ws=%s", err, ws)
			}
		}
		if browser == nil {
			// CDP 方式对版本不敏感，兼容性更强
			browser, err = connectCDPWithRetry(pw, ws, slowMo, 10, 2*time.Second)
		}
		if err != nil {
			// 连接远程失败则清理并返回
			_ = pw.Stop()
			return nil, fmt.Errorf("connect remote browser(%s) failed: %w", mode, err)
		}

		context, err := browser.NewContext(playwright.BrowserNewContextOptions{
			Viewport:  &playwright.Size{Width: 1920, Height: 1080},
			UserAgent: playwright.String("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"),
			Locale:    playwright.String("zh-CN"),
		})
		if err != nil {
			_ = browser.Close()
			_ = pw.Stop()
			return nil, fmt.Errorf("create context: %w", err)
		}
		page, err := context.NewPage()
		if err != nil {
			_ = context.Close()
			_ = browser.Close()
			_ = pw.Stop()
			return nil, fmt.Errorf("create page: %w", err)
		}
		page.SetDefaultTimeout(30 * 1000)
		return &Runner{pw: pw, browser: browser, context: context, page: page}, nil
	}

	// 未配置远程端点：回退到本地启动（开发模式）
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
		SlowMo:   playwright.Float(slowMo),
		Args: []string{
			"--disable-blink-features=AutomationControlled",
			"--disable-features=IsolateOrigins,site-per-process",
			"--disable-dev-shm-usage",
			"--no-sandbox",
			"--disable-infobars",
		},
	})
	if err != nil {
		_ = pw.Stop()
		return nil, fmt.Errorf("launch browser: %w", err)
	}

	context, err := browser.NewContext(playwright.BrowserNewContextOptions{
		Viewport:  &playwright.Size{Width: 1920, Height: 1080},
		UserAgent: playwright.String("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"),
		Locale:    playwright.String("zh-CN"),
	})
	if err != nil {
		_ = browser.Close()
		_ = pw.Stop()
		return nil, fmt.Errorf("create context: %w", err)
	}

	page, err := context.NewPage()
	if err != nil {
		_ = context.Close()
		_ = browser.Close()
		_ = pw.Stop()
		return nil, fmt.Errorf("create page: %w", err)
	}
	page.SetDefaultTimeout(30 * 1000)

	return &Runner{pw: pw, browser: browser, context: context, page: page}, nil
}

func (r *Runner) Page() playwright.Page {
	return r.page
}

func (r *Runner) Context() playwright.BrowserContext {
	return r.context
}

func (r *Runner) Close() {
	if r == nil {
		return
	}
	if r.page != nil {
		_ = r.page.Close()
	}
	if r.context != nil {
		_ = r.context.Close()
	}
	if r.browser != nil {
		_ = r.browser.Close()
	}
	if r.pw != nil {
		_ = r.pw.Stop()
	}
}

func Sleep(seconds int) {
	if seconds <= 0 {
		return
	}
	time.Sleep(time.Duration(seconds) * time.Second)
}

func (r *Runner) WaitFor(selector string, timeoutMs float64) error {
	_, err := r.page.WaitForSelector(selector, playwright.PageWaitForSelectorOptions{
		Timeout: playwright.Float(timeoutMs),
	})
	return err
}

// SaveCookies persists the current browser cookies to disk.
func (r *Runner) SaveCookies(path string) error {
	cookies, err := r.context.Cookies()
	if err != nil {
		return fmt.Errorf("read cookies: %w", err)
	}
	data, err := json.MarshalIndent(cookies, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal cookies: %w", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("write cookies: %w", err)
	}
	return nil
}

// LoadCookies loads cookies from disk if present.
func (r *Runner) LoadCookies(path string) error {
	raw, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var cookies []playwright.OptionalCookie
	if err := json.Unmarshal(raw, &cookies); err != nil {
		return fmt.Errorf("decode cookies: %w", err)
	}
	return r.context.AddCookies(cookies)
}

func CookieFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// InitStealth injects anti-detection headers and scripts similar to the Java version.
func (r *Runner) InitStealth() {
	if r == nil {
		return
	}
	loaded := false
	headers := map[string]string{
		"sec-ch-ua":          "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
		"sec-ch-ua-mobile":   "?0",
		"sec-ch-ua-platform": "\"macOS\"",
		"accept-language":    "zh-CN,zh;q=0.9",
		"referer":            "https://www.zhipin.com/",
		"sec-fetch-dest":     "document",
		"sec-fetch-mode":     "navigate",
		"sec-fetch-site":     "same-origin",
	}
	if err := r.context.SetExtraHTTPHeaders(headers); err != nil {
		log.Printf("[playwright] 设置额外请求头失败: %v", err)
	}

	script := `Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_JSON;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Object;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Proxy;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
		delete window.cdc_adoQpoasnfa76pfcZLmcfl_Window;
		window.navigator.chrome = { runtime: {} };
		Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh']});
		Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3]});`
	if err := r.page.AddInitScript(playwright.Script{Content: playwright.String(script)}); err != nil {
		log.Printf("[playwright] 注入反检测脚本失败: %v", err)
	} else {
		loaded = true
	}

	for _, path := range []string{"assets/stealth.min.js", "src/main/resources/stealth.min.js"} {
		if data, err := os.ReadFile(path); err == nil {
			if err := r.page.AddInitScript(playwright.Script{Content: playwright.String(string(data))}); err != nil {
				log.Printf("[playwright] 注入stealth.min.js失败: %v", err)
			} else {
				loaded = true
			}
			break
		}
	}
	if loaded {
		log.Println("[playwright] stealth 脚本加载完成，已抹除自动化浏览器标识")
	}
}

// InitWithBrowserCookies 初始化并注入浏览器cookie
func (r *Runner) InitWithBrowserCookies(browserCookieFile string) error {
	if r == nil {
		return nil
	}

	loader := NewBrowserCookieLoader(browserCookieFile, true)
	if err := loader.LoadBrowserCookies(r.page); err != nil {
		return fmt.Errorf("初始化浏览器cookie失败: %w", err)
	}

	// 同时初始化反检测
	r.InitStealth()
	return nil
}

func ensurePlaywrightCache() {
	if val := os.Getenv("PLAYWRIGHT_BROWSERS_PATH"); val != "" {
		return
	}

	candidates := []string{
		".playwright",
		filepath.Join("build", ".playwright"),
		filepath.Join("..", ".playwright"),
	}

	for _, path := range candidates {
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			if err := os.Setenv("PLAYWRIGHT_BROWSERS_PATH", path); err != nil {
				log.Printf("[playwright] 设置 PLAYWRIGHT_BROWSERS_PATH 失败: %v", err)
			}
			return
		}
	}
}

// parseFloat 将字符串解析为 float64；失败返回错误
func parseFloat(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(strings.TrimSpace(s), "%f", &f)
	return f, err
}

// connectPlaywrightWSWithRetry 使用 Playwright 原生协议连接，带重试
func connectPlaywrightWSWithRetry(pw *playwright.Playwright, ws string, slowMo float64, attempts int, backoff time.Duration) (playwright.Browser, error) {
	var last error
	for i := 0; i < attempts; i++ {
		b, err := pw.Chromium.Connect(ws, playwright.BrowserTypeConnectOptions{SlowMo: playwright.Float(slowMo)})
		if err == nil {
			return b, nil
		}
		last = err
		sleep := backoff * time.Duration(i+1)
		log.Printf("[playwright] Connect 失败(%v)，%v 后重试(%d/%d)…", err, sleep, i+1, attempts)
		time.Sleep(sleep)
	}
	return nil, last
}

// connectCDPWithRetry 使用 CDP 协议连接，带重试
func connectCDPWithRetry(pw *playwright.Playwright, ws string, slowMo float64, attempts int, backoff time.Duration) (playwright.Browser, error) {
	var last error
	for i := 0; i < attempts; i++ {
		b, err := pw.Chromium.ConnectOverCDP(ws, playwright.BrowserTypeConnectOverCDPOptions{SlowMo: playwright.Float(slowMo)})
		if err == nil {
			return b, nil
		}
		last = err
		sleep := backoff * time.Duration(i+1)
		log.Printf("[playwright] ConnectOverCDP 失败(%v)，%v 后重试(%d/%d)…", err, sleep, i+1, attempts)
		time.Sleep(sleep)
	}
	return nil, last
}
