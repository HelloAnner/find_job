package bot

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"get_jobs/internal/config"
)

// Client sends notifications to the enterprise WeChat webhook.
type Client struct {
	hookURL  string
	enabled  bool
	client   *http.Client
	template string
}

func New(cfg config.BotConfig, env config.Env) *Client {
	hook := env.Get("HOOK_URL")
	enabled := cfg.IsSend && hook != ""
	tpl := strings.TrimSpace(cfg.Template)
	if tpl == "" {
		tpl = defaultTemplate
	}
	return &Client{
		hookURL:  hook,
		enabled:  enabled,
		client:   &http.Client{Timeout: 10 * time.Second},
		template: tpl,
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.enabled
}

// Send pushes the message payload to the webhook.
func (c *Client) Send(message string) {
	if !c.Enabled() {
		return
	}
	payload := map[string]any{
		"msgtype": "markdown",
		"markdown": map[string]string{
			"content": message,
		},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequest(http.MethodPost, c.hookURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("[bot] 构建请求失败: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		log.Printf("[bot] 消息推送失败: %v", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		log.Printf("[bot] 消息推送返回状态码 %d", resp.StatusCode)
	}
}

// SendTemplate renders the configured template with the provided data and pushes it.
func (c *Client) SendTemplate(data map[string]string) {
	if !c.Enabled() {
		return
	}
	message := c.renderTemplate(data)
	if strings.TrimSpace(message) == "" {
		log.Printf("[bot] 模板渲染结果为空，已跳过推送")
		return
	}
	c.Send(message)
}

func (c *Client) renderTemplate(data map[string]string) string {
	msg := placeholderPattern.ReplaceAllStringFunc(c.template, func(match string) string {
		sub := placeholderPattern.FindStringSubmatch(match)
		if len(sub) < 2 {
			return match
		}
		key := strings.TrimSpace(sub[1])
		if val, ok := data[key]; ok {
			return val
		}
		return ""
	})
	return msg
}

var placeholderPattern = regexp.MustCompile(`\{\{\s*([a-zA-Z0-9_]+)\s*\}\}`)

const defaultTemplate = `## 新投递成功
- 岗位：{{jobLink}}
- 公司：{{companyName}}
- 城市/经验：{{jobArea}}
- 薪资：{{salary}}
- 招呼语：{{greeting}}
- 状态：{{status}}
- 时间：{{timestamp}}`
