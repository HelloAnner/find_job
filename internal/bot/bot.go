package bot

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"get_jobs/internal/config"
)

// Client sends notifications to the enterprise WeChat webhook.
type Client struct {
	hookURL string
	enabled bool
	client  *http.Client
}

func New(cfg config.BotConfig, env config.Env) *Client {
	hook := env.Get("HOOK_URL")
	enabled := cfg.IsSend && hook != ""
	return &Client{
		hookURL: hook,
		enabled: enabled,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil && c.enabled
}

// SendWithTime prefixes the message with the current timestamp to mimic the Java behavior.
func (c *Client) SendWithTime(message string) {
	if !c.Enabled() {
		return
	}
	ts := time.Now().Format("2006-01-02 15:04:05")
	c.Send(fmt.Sprintf("%s %s", ts, message))
}

// Send pushes the message payload to the webhook.
func (c *Client) Send(message string) {
	if !c.Enabled() {
		return
	}
	payload := map[string]any{
		"msgtype": "text",
		"text":    map[string]string{"content": message},
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
