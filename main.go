package main

import (
	"log"
	"sync"
	"time"

	"get_jobs/internal/api"
	"get_jobs/internal/boss"
	"get_jobs/internal/config"
)

type ConfigManager struct {
	mu   sync.RWMutex
	cfg  *config.Root
	env  config.Env
}

func NewConfigManager() (*ConfigManager, error) {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		return nil, err
	}
	env, err := config.LoadDotEnv(".env")
	if err != nil {
		return nil, err
	}
	return &ConfigManager{
		cfg: cfg,
		env: env,
	}, nil
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

func (cm *ConfigManager) GetEnv() config.Env {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.env
}

func main() {
	cm, err := NewConfigManager()
	if err != nil {
		log.Fatalf("初始化配置失败: %v", err)
	}

	// Start HTTP server on port 38888
	server := api.NewServer("config.yaml", cm, 38888)
	go func() {
		if err := server.Start(); err != nil {
			log.Printf("HTTP服务器启动失败: %v", err)
		}
	}()

	// Main loop
	for {
		cfg := cm.GetConfig()
		env := cm.GetEnv()

		interval := time.Duration(cfg.Boss.Interval) * time.Hour
		app, err := boss.NewApp(cfg, env)
		if err != nil {
			log.Fatalf("初始化Boss应用失败: %v", err)
		}
		if err := app.Run(); err != nil {
			log.Printf("Boss运行失败: %v", err)
		}
		app.Close()
		log.Printf("等待 %s 后再次运行...", interval)
		time.Sleep(interval)
	}
}
