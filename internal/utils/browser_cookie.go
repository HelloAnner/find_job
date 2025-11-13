package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// BrowserCookie 表示浏览器导出的cookie
// 支持多种格式：JSON格式、Netscape格式、简单文本格式
type BrowserCookie struct {
	Name     string    `json:"name"`
	Value    string    `json:"value"`
	Domain   string    `json:"domain"`
	Path     string    `json:"path"`
	Expires  time.Time `json:"expires"`
	HttpOnly bool      `json:"httpOnly"`
	Secure   bool      `json:"secure"`
	SameSite string    `json:"sameSite"`
}

// BrowserCookieConfig 浏览器cookie配置
type BrowserCookieConfig struct {
	FilePath string `json:"filePath"` // 浏览器cookie文件路径
	Enabled  bool   `json:"enabled"`   // 是否启用浏览器cookie
}

// ParseBrowserCookies 解析浏览器导出的cookie文件
// 支持格式：
// 1. JSON格式：[{"name": "xxx", "value": "xxx", ...}]
// 2. Netscape格式：域名\t标志\t路径\t安全\t过期时间\t名称\t值
// 3. 简单文本格式：name=value; domain=.example.com; path=/; expires=...
func ParseBrowserCookies(filePath string) ([]*BrowserCookie, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取浏览器cookie文件失败: %w", err)
	}

	content := strings.TrimSpace(string(data))
	if content == "" {
		return nil, fmt.Errorf("浏览器cookie文件为空")
	}

	// 尝试解析为JSON格式
	if strings.HasPrefix(content, "[") && strings.HasSuffix(content, "]") {
		return parseJSONCookies(content)
	}

	// 尝试解析为Netscape格式
	if strings.Contains(content, "\t") {
		return parseNetscapeCookies(content)
	}

	// 尝试解析为简单文本格式
	return parseTextCookies(content)
}

// parseJSONCookies 解析JSON格式的cookie
func parseJSONCookies(content string) ([]*BrowserCookie, error) {
	var cookies []*BrowserCookie
	if err := json.Unmarshal([]byte(content), &cookies); err != nil {
		return nil, fmt.Errorf("解析JSON格式cookie失败: %w", err)
	}
	return cookies, nil
}

// parseNetscapeCookies 解析Netscape格式的cookie
func parseNetscapeCookies(content string) ([]*BrowserCookie, error) {
	lines := strings.Split(content, "\n")
	var cookies []*BrowserCookie

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		fields := strings.Split(line, "\t")
		if len(fields) < 7 {
			continue
		}

		// Netscape格式：域名\t标志\t路径\t安全\t过期时间\t名称\t值
		domain := fields[0]
		path := fields[2]
		secure := fields[3] == "TRUE"
		expiresStr := fields[4]
		name := fields[5]
		value := fields[6]

		// 解析过期时间
		var expires time.Time
		if expiresStr != "0" && expiresStr != "" {
			if timestamp, err := time.Parse(time.RFC1123, expiresStr); err == nil {
				expires = timestamp
			}
		}

		cookies = append(cookies, &BrowserCookie{
			Name:    name,
			Value:   value,
			Domain:  domain,
			Path:    path,
			Expires: expires,
			Secure:  secure,
		})
	}

	return cookies, nil
}

// parseTextCookies 解析简单文本格式的cookie
func parseTextCookies(content string) ([]*BrowserCookie, error) {
	var cookies []*BrowserCookie

	// 按行分割，每行一个cookie
	lines := strings.Split(content, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		cookie := &BrowserCookie{
			Path:   "/",
			Domain: ".zhipin.com", // Boss直聘默认域名
		}

		// 解析cookie字符串：name=value; domain=.example.com; path=/; expires=...
		parts := strings.Split(line, ";")
		for i, part := range parts {
			part = strings.TrimSpace(part)
			if part == "" {
				continue
			}

			if i == 0 {
				// 第一个部分是 name=value
				if kv := strings.SplitN(part, "=", 2); len(kv) == 2 {
					cookie.Name = strings.TrimSpace(kv[0])
					cookie.Value = strings.TrimSpace(kv[1])
				}
			} else {
				// 其他部分是属性
				if kv := strings.SplitN(part, "=", 2); len(kv) == 2 {
					key := strings.ToLower(strings.TrimSpace(kv[0]))
					value := strings.TrimSpace(kv[1])

					switch key {
					case "domain":
						cookie.Domain = value
					case "path":
						cookie.Path = value
					case "expires":
						if t, err := time.Parse(time.RFC1123, value); err == nil {
							cookie.Expires = t
						}
					case "httponly":
						cookie.HttpOnly = strings.ToLower(value) == "true"
					case "secure":
						cookie.Secure = strings.ToLower(value) == "true"
					case "samesite":
						cookie.SameSite = value
					}
				}
			}
		}

		if cookie.Name != "" && cookie.Value != "" {
			cookies = append(cookies, cookie)
		}
	}

	return cookies, nil
}

// ToCookieHeader 将浏览器cookie转换为HTTP Cookie头格式
func (bc *BrowserCookie) ToCookieHeader() string {
	return fmt.Sprintf("%s=%s", bc.Name, bc.Value)
}

// BuildCookieHeader 构建完整的Cookie请求头
func BuildCookieHeader(cookies []*BrowserCookie) string {
	if len(cookies) == 0 {
		return ""
	}

	var cookieStrs []string
	for _, cookie := range cookies {
		// 检查cookie是否过期
		if !cookie.Expires.IsZero() && cookie.Expires.Before(time.Now()) {
			continue
		}
		cookieStrs = append(cookieStrs, cookie.ToCookieHeader())
	}

	return strings.Join(cookieStrs, "; ")
}

// CreateCookieJar 创建包含浏览器cookie的cookie jar
func CreateCookieJar(cookies []*BrowserCookie) http.CookieJar {
	jar := &browserCookieJar{
		cookies: make(map[string][]*http.Cookie),
	}

	for _, bc := range cookies {
		if !bc.Expires.IsZero() && bc.Expires.Before(time.Now()) {
			continue
		}

		httpCookie := &http.Cookie{
			Name:     bc.Name,
			Value:    bc.Value,
			Domain:   bc.Domain,
			Path:     bc.Path,
			Expires:  bc.Expires,
			HttpOnly: bc.HttpOnly,
			Secure:   bc.Secure,
		}

		jar.cookies[bc.Domain] = append(jar.cookies[bc.Domain], httpCookie)
	}

	return jar
}

// browserCookieJar 实现http.CookieJar接口
type browserCookieJar struct {
	cookies map[string][]*http.Cookie
}

func (j *browserCookieJar) SetCookies(u *url.URL, cookies []*http.Cookie) {
	// 只读实现，不设置新cookie
}

func (j *browserCookieJar) Cookies(u *url.URL) []*http.Cookie {
	var result []*http.Cookie

	// 返回匹配域名的所有cookie
	for domain, cookies := range j.cookies {
		if strings.HasSuffix(u.Host, domain) || domain == u.Host {
			result = append(result, cookies...)
		}
	}

	return result
}

// BrowserCookieFileExists 检查浏览器cookie文件是否存在
func BrowserCookieFileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return err == nil
}