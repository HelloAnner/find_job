package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"get_jobs/internal/config"
)

// Client wraps the LLM completion API used for greeting generation.
type Client struct {
	baseURL string
	apiKey  string
	model   string
	client  *http.Client
}

func New(env config.Env) *Client {
	base := strings.TrimSuffix(env.Get("BASE_URL"), "/")
	apiKey := env.Get("API_KEY")
	model := env.Get("MODEL")
	if base == "" || apiKey == "" || model == "" {
		return nil
	}
	return &Client{
		baseURL: base + "/v1/chat/completions",
		apiKey:  apiKey,
		model:   model,
		client:  &http.Client{Timeout: 60 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c != nil
}

// Chat sends the raw prompt to the AI endpoint and returns the assistant message content.
func (c *Client) Chat(prompt string) (string, error) {
	if !c.Enabled() {
		return "", fmt.Errorf("ai client not configured")
	}

	payload := map[string]any{
		"model":       c.model,
		"temperature": 0.5,
		"messages": []map[string]string{{
			"role":    "user",
			"content": prompt,
		}},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("encode ai payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("build ai request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ai request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("ai request returned status %d", resp.StatusCode)
	}

	var data chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", fmt.Errorf("decode ai response: %w", err)
	}
	if len(data.Choices) == 0 {
		return "", fmt.Errorf("ai response missing choices")
	}
	msg := data.Choices[0].Message.Content
	log.Printf("[ai] request %s 使用模型 %s，tokens prompt=%d completion=%d total=%d", data.ID, data.Model, data.Usage.PromptTokens, data.Usage.CompletionTokens, data.Usage.TotalTokens)
	return msg, nil
}

type chatResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}
