package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Env wraps environment variables coming from the .env file (plus OS vars fallback).
type Env struct {
	values map[string]string
}

// LoadDotEnv parses a simple KEY=VALUE formatted file. Missing files yield an empty env without failing.
func LoadDotEnv(path string) (Env, error) {
	env := Env{values: map[string]string{}}

	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return env, nil
		}
		return env, fmt.Errorf("open %s: %w", path, err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, val, ok := parseEnvLine(line)
		if !ok {
			continue
		}
		env.values[key] = val
	}

	if err := scanner.Err(); err != nil {
		return env, fmt.Errorf("read %s: %w", path, err)
	}
	return env, nil
}

func parseEnvLine(line string) (string, string, bool) {
	idx := strings.IndexRune(line, '=')
	if idx <= 0 {
		return "", "", false
	}
	key := strings.TrimSpace(line[:idx])
	val := strings.TrimSpace(line[idx+1:])
	val = strings.Trim(val, "'\"")
	if key == "" {
		return "", "", false
	}
	return key, val, true
}

// Get returns the value from .env or falls back to OS environment variables.
func (e Env) Get(key string) string {
	if v, ok := e.values[key]; ok && v != "" {
		return v
	}
	return os.Getenv(key)
}
