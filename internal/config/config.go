package config

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"gopkg.in/yaml.v3"
)

const (
	// UnlimitedCode mirrors the Java implementation's "不限" code value.
	UnlimitedCode = "0"

	cityCodeFile = "assets/boss/city-industry-code.json"
)

// Root aggregates all configuration sections present in config.yaml.
type Root struct {
	Boss BossConfig `yaml:"boss"`
	Bot  BotConfig  `yaml:"bot"`
	AI   AiConfig   `yaml:"ai"`
}

// BossConfig mirrors the original Java BossConfig fields after normalization.
type BossConfig struct {
	SayHi          string            `yaml:"sayHi"`
	Keywords       []string          `yaml:"keywords"`
	CityCode       []string          `yaml:"cityCode"`
	CustomCityCode map[string]string `yaml:"customCityCode"`
	Industry       []string          `yaml:"industry"`
	Experience     []string          `yaml:"experience"`
	JobType        string            `yaml:"jobType"`
	Salary         string            `yaml:"salary"`
	Degree         []string          `yaml:"degree"`
	Scale          []string          `yaml:"scale"`
	Stage          []string          `yaml:"stage"`
	EnableAI       bool              `yaml:"enableAI"`
	FilterDeadHR   bool              `yaml:"filterDeadHR"`
	SendImgResume  bool              `yaml:"sendImgResume"`
	ExpectedSalary []int             `yaml:"expectedSalary"`
	WaitTime       int               `yaml:"waitTime"`
	DeadStatus     []string          `yaml:"deadStatus"`
	MaxChat        int               `yaml:"max"`
	Interval       int               `yaml:"interval"`
}

// BotConfig controls enterprise WeChat notifications.
type BotConfig struct {
	IsSend   bool   `yaml:"is_send"`
	Template string `yaml:"template"`
}

// AiConfig provides the LLM introduction and prompt template.
type AiConfig struct {
    Introduce string `yaml:"introduce"`
    Prompt    string `yaml:"prompt"`
}

// Normalize applies the same normalization rules as Load() to an in‑memory config.
// 用于在不经由文件读取的场景（例如 API 更新）下，对前端传入的可读值进行标准化（编码/默认值）。
func Normalize(cfg *Root) error {
    if cfg == nil {
        return fmt.Errorf("nil config")
    }
    return cfg.Boss.normalize()
}

// Load parses config.yaml and normalizes Boss-specific selector codes.
func Load(path string) (*Root, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config.yaml: %w", err)
	}

	var cfg Root
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config.yaml: %w", err)
	}

	if err := cfg.Boss.normalize(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (b *BossConfig) normalize() error {
	if b.CustomCityCode == nil {
		b.CustomCityCode = map[string]string{}
	}
	// Convert scalar selectors to API codes.
	b.JobType = mapWithDefault(b.JobType, jobTypeMap)
	b.Salary = mapWithDefault(b.Salary, salaryMap)

	b.Experience = mapList(b.Experience, experienceMap)
	b.Degree = mapList(b.Degree, degreeMap)
	b.Scale = mapList(b.Scale, scaleMap)
	b.Stage = mapList(b.Stage, stageMap)
	b.Industry = mapList(b.Industry, industryMap)

	// Convert configured cities.
	if len(b.CityCode) == 0 {
		b.CityCode = []string{UnlimitedCode}
	} else {
		codes, err := convertCities(b.CityCode, b.CustomCityCode)
		if err != nil {
			return err
		}
		b.CityCode = codes
	}

	if b.MaxChat <= 0 {
		b.MaxChat = 100
	}
	if b.Interval <= 0 {
		b.Interval = 1
	}

	return nil
}

func mapWithDefault(value string, lookup map[string]string) string {
	trim := strings.TrimSpace(value)
	if trim == "" {
		return UnlimitedCode
	}
	if code, ok := lookup[trim]; ok {
		return code
	}
	if isDigits(trim) {
		return trim
	}
	log.Printf("[config] 未识别的选项 %q，使用不限", trim)
	return UnlimitedCode
}

func mapList(values []string, lookup map[string]string) []string {
	if len(values) == 0 {
		return []string{UnlimitedCode}
	}
	mapped := make([]string, len(values))
	for i, v := range values {
		mapped[i] = mapWithDefault(v, lookup)
	}
	return mapped
}

func isDigits(value string) bool {
	if value == "" {
		return false
	}
	for _, r := range value {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

var (
	cityCodes map[string]string
	cityOnce  sync.Once
)

func convertCities(values []string, custom map[string]string) ([]string, error) {
	codes := make([]string, 0, len(values))
	cityMap, err := loadCityCodes()
	if err != nil {
		log.Printf("[config] 加载城市编码失败：%v", err)
	}

	for _, city := range values {
		city = strings.TrimSpace(city)
		if city == "" {
			codes = append(codes, UnlimitedCode)
			continue
		}
		if strings.EqualFold(city, "不限") {
			codes = append(codes, UnlimitedCode)
			continue
		}
		if strings.EqualFold(city, "全国") {
			codes = append(codes, cityEnum["全国"])
			continue
		}
		if customCode, ok := custom[city]; ok {
			codes = append(codes, customCode)
			continue
		}
		if code, ok := cityEnum[city]; ok {
			codes = append(codes, code)
			continue
		}
		if m := cityMap[city]; m != "" {
			codes = append(codes, m)
			continue
		}
		log.Printf("[config] 未找到城市 %q 的编码，使用不限", city)
		codes = append(codes, UnlimitedCode)
	}
	return codes, nil
}

func loadCityCodes() (map[string]string, error) {
	var loadErr error
	cityOnce.Do(func() {
		cityCodes = map[string]string{}
		data, err := os.ReadFile(ResolvePath(cityCodeFile))
		if err != nil {
			loadErr = fmt.Errorf("read city code file: %w", err)
			return
		}
		var payload struct {
			City []struct {
				Name string      `json:"name"`
				Code interface{} `json:"code"`
			} `json:"city"`
		}
		if err := json.Unmarshal(data, &payload); err != nil {
			loadErr = fmt.Errorf("parse city code file: %w", err)
			return
		}
		for _, entry := range payload.City {
			cityCodes[entry.Name] = fmt.Sprintf("%v", entry.Code)
		}
	})
	return cityCodes, loadErr
}

var cityEnum = map[string]string{
	"不限": UnlimitedCode,
	"全国": "100010000",
}

var experienceMap = map[string]string{
	"不限":    UnlimitedCode,
	"在校生":   "108",
	"应届毕业生": "102",
	"经验不限":  "101",
	"1年以下":  "103",
	"1-3年":  "104",
	"3-5年":  "105",
	"5-10年": "106",
	"10年以上": "107",
}

var jobTypeMap = map[string]string{
	"不限": UnlimitedCode,
	"全职": "1901",
	"兼职": "1903",
}

var salaryMap = map[string]string{
	"不限":     UnlimitedCode,
	"3K以下":   "402",
	"3-5K":   "403",
	"5-10K":  "404",
	"10-20K": "405",
	"20-50K": "406",
	"50K以上":  "407",
}

var degreeMap = map[string]string{
	"不限":    UnlimitedCode,
	"初中及以下": "209",
	"中专/中技": "208",
	"高中":    "206",
	"大专":    "202",
	"本科":    "203",
	"硕士":    "204",
	"博士":    "205",
}

var scaleMap = map[string]string{
	"不限":         UnlimitedCode,
	"0-20人":      "301",
	"20-99人":     "302",
	"100-499人":   "303",
	"500-999人":   "304",
	"1000-9999人": "305",
	"10000人以上":   "306",
}

var stageMap = map[string]string{
	"不限":    UnlimitedCode,
	"未融资":   "801",
	"天使轮":   "802",
	"A轮":    "803",
	"B轮":    "804",
	"C轮":    "805",
	"D轮及以上": "806",
	"已上市":   "807",
	"不需要融资": "808",
}

var industryMap = map[string]string{
	"不限":    UnlimitedCode,
	"互联网":   "100020",
	"计算机软件": "100021",
	"云计算":   "100029",
}

// ResolvePath ensures configuration helpers can load files relative to the repo root.
func ResolvePath(relative string) string {
	if filepath.IsAbs(relative) {
		return relative
	}
	return filepath.Clean(relative)
}
