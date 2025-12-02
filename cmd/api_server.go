package main

import (
	"log"
	"sync"

	"get_jobs/internal/api"
	"get_jobs/internal/config"
)

type ConfigManager struct {
	mu  sync.RWMutex
	cfg *config.Root
}

func NewConfigManager() (*ConfigManager, error) {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		return nil, err
	}
	return &ConfigManager{cfg: cfg}, nil
}

func (cm *ConfigManager) GetConfig() *config.Root {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.cfg
}

func (cm *ConfigManager) UpdateConfig(newCfg *config.Root) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.cfg = newCfg
}

func main() {
	cm, err := NewConfigManager()
	if err != nil {
		log.Fatalf("初始化配置失败: %v", err)
	}

	// 启动 HTTP API 服务器
	server := api.NewServer("config.yaml", cm, 38888)
	log.Println("配置 API 服务已启动: http://localhost:38888")
	log.Println("前端访问地址: http://localhost:3000")
	log.Println("")
	log.Println("可用 API:")
	log.Println("  GET  /api/config        - 获取配置")
	log.Println("  POST /api/config        - 保存配置")
	log.Println("  GET  /api/config/reload - 重新加载配置")

	if err := server.Start(); err != nil {
		log.Fatalf("HTTP 服务器启动失败: %v", err)
	}
}
