package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"get_jobs/internal/utils"
)

const (
	maxCredentialSize    = 512 * 1024 // 512KB
	cookieTestURL        = "https://www.zhipin.com/web/geek/center"
	cookieFilePermission = 0o600
)

type credentialPayload struct {
	Content string `json:"content"`
}

type credentialResponse struct {
	OK           bool     `json:"ok"`
	Message      string   `json:"message"`
	ParsedCount  int      `json:"parsedCount"`
	Identical    bool     `json:"identical"`
	Verified     bool     `json:"verified"`
	SampleNames  []string `json:"sampleNames"`
	LastModified string   `json:"lastModified,omitempty"`
}

// credentialStatusResponse 用于前端查询“当前状态”展示
type credentialStatusResponse struct {
	OK           bool   `json:"ok"`
	Path         string `json:"path"`
	FileName     string `json:"fileName"`
	Exists       bool   `json:"exists"`
	Size         int64  `json:"size"`
	LastModified string `json:"lastModified,omitempty"`
	Message      string `json:"message"`
}

func (s *Server) handleCredentialCheck(w http.ResponseWriter, r *http.Request) {
	var payload credentialPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "无法解析请求: "+err.Error(), http.StatusBadRequest)
		return
	}

	resp, _, err := s.validateCredentialPayload(payload.Content, true)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	s.writeJSON(w, resp)
}

func (s *Server) handleCredentialApply(w http.ResponseWriter, r *http.Request) {
	var payload credentialPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "无法解析请求: "+err.Error(), http.StatusBadRequest)
		return
	}

	resp, normalized, err := s.validateCredentialPayload(payload.Content, true)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := s.writeCredentialToDisk(normalized); err != nil {
		http.Error(w, "写入凭证失败: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp.Message = "凭证已替换"
	// 写入成功后补充当前文件的最新修改时间，便于前端刷新“当前状态”
	if stat, err := os.Stat(s.cookiePath); err == nil {
		resp.LastModified = stat.ModTime().Format(time.RFC3339)
	}
	s.writeJSON(w, resp)
}

func (s *Server) validateCredentialPayload(raw string, runVerification bool) (*credentialResponse, []byte, error) {
	normalized, err := sanitizeCredentialContent(raw)
	if err != nil {
		return nil, nil, err
	}

	tmpFile, err := os.CreateTemp("", "credential-*.txt")
	if err != nil {
		return nil, nil, fmt.Errorf("创建临时文件失败: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := tmpFile.Write(normalized); err != nil {
		return nil, nil, fmt.Errorf("写入临时文件失败: %w", err)
	}

	cookies, err := utils.ParseBrowserCookies(tmpFile.Name())
	if err != nil {
		return nil, nil, fmt.Errorf("解析凭证失败: %w", err)
	}
	if len(cookies) == 0 {
		return nil, nil, errors.New("未解析到任何 Cookie，请确认文件内容")
	}

	identical := s.isIdenticalToCurrent(normalized)
	response := &credentialResponse{
		OK:          true,
		Message:     "检查通过，可用于替换",
		ParsedCount: len(cookies),
		Identical:   identical,
		SampleNames: pickCookieSamples(cookies),
	}

	if runVerification {
		if err := verifyCredentialAgainstBoss(cookies); err != nil {
			return nil, nil, fmt.Errorf("模拟访问失败: %w", err)
		}
		response.Verified = true
	}

	if stat, err := os.Stat(s.cookiePath); err == nil {
		response.LastModified = stat.ModTime().Format(time.RFC3339)
	}

	return response, normalized, nil
}

func sanitizeCredentialContent(raw string) ([]byte, error) {
	content := strings.TrimSpace(raw)
	if content == "" {
		return nil, errors.New("文件内容为空")
	}

	if len(content) > maxCredentialSize {
		return nil, fmt.Errorf("文件大小超过限制（>%d KB）", maxCredentialSize/1024)
	}

	if strings.Contains(content, "\x00") {
		return nil, errors.New("检测到二进制字符，请上传文本文件")
	}

	lower := strings.ToLower(content)
	if strings.Contains(lower, "<script") {
		return nil, errors.New("检测到可疑脚本标签，请上传纯文本 Cookie")
	}

	content = strings.ReplaceAll(content, "\r\n", "\n")
	return []byte(content + "\n"), nil
}

func (s *Server) isIdenticalToCurrent(newData []byte) bool {
	if s.cookiePath == "" {
		return false
	}
	existing, err := os.ReadFile(s.cookiePath)
	if err != nil {
		return false
	}
	return bytes.Equal(bytes.TrimSpace(existing), bytes.TrimSpace(newData))
}

func pickCookieSamples(cookies []*utils.BrowserCookie) []string {
	seen := make(map[string]struct{})
	var samples []string
	for _, c := range cookies {
		if c == nil || c.Name == "" {
			continue
		}
		if _, ok := seen[c.Name]; ok {
			continue
		}
		seen[c.Name] = struct{}{}
		samples = append(samples, c.Name)
		if len(samples) >= 5 {
			break
		}
	}
	return samples
}

func verifyCredentialAgainstBoss(cookies []*utils.BrowserCookie) error {
	cookieHeader := utils.BuildCookieHeader(cookies)
	if cookieHeader == "" {
		return errors.New("未找到有效的 Cookie 字段")
	}

	client := &http.Client{
		Timeout: 12 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 1 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	req, err := http.NewRequest(http.MethodGet, cookieTestURL, nil)
	if err != nil {
		return fmt.Errorf("创建模拟请求失败: %w", err)
	}
	req.Header.Set("Cookie", cookieHeader)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("访问 Boss 失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Boss 返回状态码 %d，可能需要重新登录", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if err != nil {
		return fmt.Errorf("读取响应失败: %w", err)
	}
	lowerBody := strings.ToLower(string(body))
	if strings.Contains(lowerBody, "扫码登录") || strings.Contains(lowerBody, "账户登录") {
		return errors.New("页面仍提示登录，请确认凭证未过期")
	}

	return nil
}

func (s *Server) writeCredentialToDisk(data []byte) error {
	dir := filepath.Dir(s.cookiePath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	backupPath := s.cookiePath + ".bak"
	if existing, err := os.ReadFile(s.cookiePath); err == nil {
		_ = os.WriteFile(backupPath, existing, cookieFilePermission)
	}

	if err := os.WriteFile(s.cookiePath, data, cookieFilePermission); err != nil {
		return fmt.Errorf("写入凭证文件失败: %w", err)
	}
	return nil
}

func (s *Server) writeJSON(w http.ResponseWriter, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(payload)
}

// handleCredentialStatus 返回当前系统正在使用的凭证文件的信息（路径、名称、存在性、大小、上次修改时间）
func (s *Server) handleCredentialStatus(w http.ResponseWriter, r *http.Request) {
	resp := &credentialStatusResponse{
		OK:       true,
		Path:     s.cookiePath,
		FileName: filepath.Base(s.cookiePath),
		Message:  "",
	}

	if s.cookiePath == "" {
		resp.OK = false
		resp.Message = "未配置凭证文件路径"
		s.writeJSON(w, resp)
		return
	}

	if stat, err := os.Stat(s.cookiePath); err == nil {
		resp.Exists = true
		resp.Size = stat.Size()
		resp.LastModified = stat.ModTime().Format(time.RFC3339)
		if stat.Size() == 0 {
			resp.Message = "凭证文件为空，请重新上传"
		} else {
			resp.Message = "凭证文件可用"
		}
	} else {
		resp.Exists = false
		resp.Size = 0
		resp.Message = "未找到凭证文件"
	}

	s.writeJSON(w, resp)
}
