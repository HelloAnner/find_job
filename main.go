package main

import (
	"log"

	"get_jobs/internal/boss"
	"get_jobs/internal/config"
)

func main() {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatalf("读取配置失败: %v", err)
	}
	env, err := config.LoadDotEnv(".env")
	if err != nil {
		log.Fatalf("加载环境变量失败: %v", err)
	}

	app, err := boss.NewApp(cfg, env)
	if err != nil {
		log.Fatalf("初始化Boss应用失败: %v", err)
	}
	defer app.Close()

	if err := app.Run(); err != nil {
		log.Fatalf("Boss运行失败: %v", err)
	}
}
