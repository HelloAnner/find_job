package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"get_jobs/internal/config"
	"gopkg.in/yaml.v3"
)

type ConfigUpdater interface {
	UpdateConfig(*config.Root)
	GetConfig() *config.Root
}

type Server struct {
	configPath    string
	cookiePath    string
	configUpdater ConfigUpdater
	mu            sync.RWMutex
	server        *http.Server
	staticDir     string
}

func NewServer(configPath string, cookiePath string, updater ConfigUpdater, port int) *Server {
	s := &Server{
		configPath:    configPath,
		cookiePath:    cookiePath,
		configUpdater: updater,
		staticDir:     "./front/dist",
	}

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("GET /api/config", s.handleGetConfig)
	mux.HandleFunc("POST /api/config", s.handleUpdateConfig)
	mux.HandleFunc("GET /api/config/reload", s.handleReloadConfig)
	mux.HandleFunc("POST /api/credentials/check", s.handleCredentialCheck)
	mux.HandleFunc("POST /api/credentials/apply", s.handleCredentialApply)
	mux.HandleFunc("GET /api/credentials/status", s.handleCredentialStatus)

	// Static file serving - single page application support
	mux.HandleFunc("GET /", s.handleStatic)

	s.server = &http.Server{
		Addr:         fmt.Sprintf(":%d", port),
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	return s
}

func (s *Server) Start() error {
	log.Printf("HTTP server starting on %s", s.server.Addr)
	return s.server.ListenAndServe()
}

func (s *Server) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store") // 前端自动保存/拉取下，禁用缓存更稳
	if err := json.NewEncoder(w).Encode(s.configUpdater.GetConfig()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) handleUpdateConfig(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var newCfg config.Root
	if err := json.NewDecoder(r.Body).Decode(&newCfg); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// 标准化配置（城市/学历/经验等转换为编码；填充默认值）
	if err := config.Normalize(&newCfg); err != nil {
		http.Error(w, "Failed to normalize config: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Update the config through updater（内存保持与写盘一致的标准化结果）
	s.configUpdater.UpdateConfig(&newCfg)

	// Save to file
	data, err := os.ReadFile(s.configPath)
	if err != nil {
		http.Error(w, "Failed to read config file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Parse existing YAML to preserve comments and structure
	var yamlData map[string]interface{}
	if err := yaml.Unmarshal(data, &yamlData); err != nil {
		http.Error(w, "Failed to parse config YAML: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Update the YAML data with new values
	// Convert config.Root to map for merging（使用YAML标签保持键名一致）
	newData, err := yaml.Marshal(&newCfg)
	if err != nil {
		http.Error(w, "Failed to marshal new config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var newYamlData map[string]interface{}
	if err := yaml.Unmarshal(newData, &newYamlData); err != nil {
		http.Error(w, "Failed to parse new config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Merge - we'll just replace boss, ai, bot sections
	for key, value := range newYamlData {
		yamlData[key] = value
	}

	// Write back to file
	finalData, err := yaml.Marshal(yamlData)
	if err != nil {
		http.Error(w, "Failed to marshal final config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(s.configPath, finalData, 0644); err != nil {
		http.Error(w, "Failed to write config file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (s *Server) handleReloadConfig(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	newCfg, err := config.Load(s.configPath)
	if err != nil {
		http.Error(w, "Failed to reload config: "+err.Error(), http.StatusInternalServerError)
		return
	}

	s.configUpdater.UpdateConfig(newCfg)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "reloaded"})
}

func (s *Server) handleStatic(w http.ResponseWriter, r *http.Request) {
	// Check if the file exists in the static directory
	path := filepath.Join(s.staticDir, r.URL.Path)
	if _, err := os.Stat(path); err == nil {
		http.ServeFile(w, r, path)
		return
	}

	// For SPA, serve index.html for any non-API route
	if r.URL.Path != "/" && !filepath.HasPrefix(r.URL.Path, "/api/") {
		path = filepath.Join(s.staticDir, "index.html")
		if _, err := os.Stat(path); err == nil {
			http.ServeFile(w, r, path)
			return
		}
	}

	http.NotFound(w, r)
}
