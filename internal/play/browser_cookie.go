package play

import (
	"fmt"
	"log"
	"strings"

	"get_jobs/internal/utils"

	"github.com/playwright-community/playwright-go"
)

// BrowserCookieLoader 浏览器cookie加载器
type BrowserCookieLoader struct {
	filePath string
	enabled  bool
}

// NewBrowserCookieLoader 创建浏览器cookie加载器
func NewBrowserCookieLoader(filePath string, enabled bool) *BrowserCookieLoader {
	return &BrowserCookieLoader{
		filePath: filePath,
		enabled:  enabled,
	}
}

// LoadBrowserCookies 加载浏览器cookie并注入到Playwright页面
func (l *BrowserCookieLoader) LoadBrowserCookies(page playwright.Page) error {
	if !l.enabled {
		return nil
	}

	if !utils.BrowserCookieFileExists(l.filePath) {
		log.Printf("[browser-cookie] 浏览器cookie文件不存在: %s", l.filePath)
		return nil
	}

	log.Printf("[browser-cookie] 检测到浏览器cookie文件，正在加载: %s", l.filePath)

	// 解析浏览器cookie
	browserCookies, err := utils.ParseBrowserCookies(l.filePath)
	if err != nil {
		return fmt.Errorf("解析浏览器cookie失败: %w", err)
	}

	if len(browserCookies) == 0 {
		log.Printf("[browser-cookie] 浏览器cookie文件为空或格式不正确")
		return nil
	}

	log.Printf("[browser-cookie] 成功解析 %d 个浏览器cookie", len(browserCookies))

	// 构建Cookie请求头
	cookieHeader := utils.BuildCookieHeader(browserCookies)
	if cookieHeader == "" {
		log.Printf("[browser-cookie] 无有效的浏览器cookie")
		return nil
	}

	// 注入cookie到页面
	if err := l.injectCookiesToPage(page, cookieHeader); err != nil {
		return fmt.Errorf("注入浏览器cookie到页面失败: %w", err)
	}

	log.Printf("[browser-cookie] 浏览器cookie注入完成")
	return nil
}

// injectCookiesToPage 将浏览器cookie注入到Playwright页面
func (l *BrowserCookieLoader) injectCookiesToPage(page playwright.Page, cookieHeader string) error {
	// 通过JavaScript注入cookie
	return l.injectCookiesViaJS(page, cookieHeader)
}

// injectCookiesViaJS 通过JavaScript注入cookie
func (l *BrowserCookieLoader) injectCookiesViaJS(page playwright.Page, cookieHeader string) error {
	// 解析cookie字符串
	cookies := strings.Split(cookieHeader, "; ")

	// 构建JavaScript代码来设置cookie
	var jsCode strings.Builder
	jsCode.WriteString(`(function() {
		var cookies = [`)

	for i, cookie := range cookies {
		if i > 0 {
			jsCode.WriteString(", ")
		}
		jsCode.WriteString(fmt.Sprintf(`"%s"`, cookie))
	}

	jsCode.WriteString(`];
		cookies.forEach(function(cookieStr) {
			var parts = cookieStr.split('=');
			if (parts.length >= 2) {
				var name = parts[0].trim();
				var value = parts.slice(1).join('=').trim();

				// 设置cookie
				document.cookie = name + "=" + value + "; path=/; domain=.zhipin.com";
			}
		});
	})();`)

	// 注入JavaScript代码
	if _, err := page.Evaluate(jsCode.String(), nil); err != nil {
		return fmt.Errorf("注入JavaScript cookie失败: %w", err)
	}

	log.Printf("[browser-cookie] 已通过JavaScript注入cookie")
	return nil
}

// CreateBrowserCookieScript 创建浏览器cookie注入脚本
func CreateBrowserCookieScript(cookieHeader string) string {
	if cookieHeader == "" {
		return ""
	}

	cookies := strings.Split(cookieHeader, "; ")

	var jsCode strings.Builder
	jsCode.WriteString(`
	// 浏览器cookie注入脚本
	(function() {
		var cookies = [`)

	for i, cookie := range cookies {
		if i > 0 {
			jsCode.WriteString(", ")
		}
		jsCode.WriteString(fmt.Sprintf(`"%s"`, cookie))
	}

	jsCode.WriteString(`];

		// 页面加载完成后设置cookie
		function setCookies() {
			cookies.forEach(function(cookieStr) {
				var parts = cookieStr.split('=');
				if (parts.length >= 2) {
					var name = parts[0].trim();
					var value = parts.slice(1).join('=').trim();

					// 设置cookie到当前域名
					document.cookie = name + "=" + value + "; path=/";

					// 设置cookie到.zhipin.com域名
					document.cookie = name + "=" + value + "; path=/; domain=.zhipin.com";
				}
			});
			console.log('浏览器cookie注入完成');
		}

		// 页面加载完成后执行
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', setCookies);
		} else {
			setCookies();
		}
	})();
	`)

	return jsCode.String()
}

// InjectBrowserCookieScript 注入浏览器cookie脚本到页面
func InjectBrowserCookieScript(page playwright.Page, cookieHeader string) error {
	if cookieHeader == "" {
		return nil
	}

	script := CreateBrowserCookieScript(cookieHeader)
	if script == "" {
		return nil
	}

	if err := page.AddInitScript(playwright.Script{
		Content: playwright.String(script),
	}); err != nil {
		return fmt.Errorf("注入浏览器cookie脚本失败: %w", err)
	}

	log.Printf("[browser-cookie] 浏览器cookie脚本注入完成")
	return nil
}