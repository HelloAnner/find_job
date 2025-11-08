package play

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
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
func NewRunner() (*Runner, error) {
	ensurePlaywrightCache()

	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("start playwright: %w", err)
	}

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(false),
		SlowMo:   playwright.Float(50),
	})
	if err != nil {
		return nil, fmt.Errorf("launch browser: %w", err)
	}

	context, err := browser.NewContext(playwright.BrowserNewContextOptions{
		Viewport:  &playwright.Size{Width: 1920, Height: 1080},
		UserAgent: playwright.String("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"),
	})
	if err != nil {
		return nil, fmt.Errorf("create context: %w", err)
	}

	page, err := context.NewPage()
	if err != nil {
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
	}

	for _, path := range []string{"assets/stealth.min.js", "src/main/resources/stealth.min.js"} {
		if data, err := os.ReadFile(path); err == nil {
			if err := r.page.AddInitScript(playwright.Script{Content: playwright.String(string(data))}); err != nil {
				log.Printf("[playwright] 注入stealth.min.js失败: %v", err)
			}
			break
		}
	}
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
