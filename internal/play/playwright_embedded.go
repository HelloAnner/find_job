package play

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// EmbeddedBrowser represents embedded browser data
var embeddedBrowsers = map[string][]byte{}

// initEmbeddedBrowsers initializes the embedded browser data
// This will be populated by the build process
func initEmbeddedBrowsers() {
	// Browser binaries will be embedded here during build
	// For now, this is a placeholder that will be filled by the build script
}

// extractEmbeddedBrowser extracts embedded browser binaries to a temporary directory
func extractEmbeddedBrowser(browserName string) (string, error) {
	// Get platform-specific browser key
	platformKey := getPlatformBrowserKey(browserName)

	browserData, exists := embeddedBrowsers[platformKey]
	if !exists {
		return "", fmt.Errorf("embedded browser not found for platform: %s", platformKey)
	}

	// Create temporary directory for extracted browser
	tempDir, err := os.MkdirTemp("", "playwright-browsers-")
	if err != nil {
		return "", fmt.Errorf("create temp directory: %w", err)
	}

	// Calculate hash for directory naming
	hash := sha256.Sum256(browserData)
	hashStr := hex.EncodeToString(hash[:8])

	browserDir := filepath.Join(tempDir, fmt.Sprintf("%s-%s", browserName, hashStr))

	// Check if already extracted
	if _, err := os.Stat(browserDir); err == nil {
		return browserDir, nil
	}

	// Extract zip data
	reader, err := zip.NewReader(bytes.NewReader(browserData), int64(len(browserData)))
	if err != nil {
		return "", fmt.Errorf("read zip data: %w", err)
	}

	// Extract all files
	for _, file := range reader.File {
		path := filepath.Join(browserDir, file.Name)

		if file.FileInfo().IsDir() {
			os.MkdirAll(path, 0755)
			continue
		}

		// Create parent directories
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			return "", fmt.Errorf("create parent directories: %w", err)
		}

		// Extract file
		dstFile, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			return "", fmt.Errorf("create file: %w", err)
		}

		srcFile, err := file.Open()
		if err != nil {
			dstFile.Close()
			return "", fmt.Errorf("open zip file: %w", err)
		}

		_, err = io.Copy(dstFile, srcFile)
		dstFile.Close()
		srcFile.Close()

		if err != nil {
			return "", fmt.Errorf("extract file: %w", err)
		}
	}

	return browserDir, nil
}

// getPlatformBrowserKey returns the platform-specific key for embedded browsers
func getPlatformBrowserKey(browserName string) string {
	goos := runtime.GOOS
	goarch := runtime.GOARCH

	// Map Go platform names to Playwright platform names
	var platform string
	switch goos {
	case "darwin":
		if goarch == "arm64" {
			platform = "mac-arm64"
		} else {
			platform = "mac"
		}
	case "linux":
		platform = "linux"
	case "windows":
		platform = "win64"
	default:
		platform = goos
	}

	return fmt.Sprintf("%s-%s", browserName, platform)
}

// ensureEmbeddedPlaywright sets up embedded browsers for Playwright
func ensureEmbeddedPlaywright() error {
	// Try to extract embedded Chromium first
	browserDir, err := extractEmbeddedBrowser("chromium")
	if err != nil {
		// Fall back to external installation
		log.Printf("[playwright] 无法提取嵌入式浏览器，回退到外部安装: %v", err)
		ensurePlaywrightCache()
		return nil
	}

	// Set the browser path for Playwright
	os.Setenv("PLAYWRIGHT_BROWSERS_PATH", browserDir)

	// Also set the specific browser executable path
	browserExe := getBrowserExecutable(browserDir, "chromium")
	if browserExe != "" {
		os.Setenv("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH", browserExe)
	}

	log.Printf("[playwright] 使用嵌入式浏览器: %s", browserDir)
	return nil
}

// getBrowserExecutable finds the browser executable in the extracted directory
func getBrowserExecutable(browserDir, browserName string) string {
	var exeName string

	switch runtime.GOOS {
	case "windows":
		exeName = "chrome.exe"
	case "darwin":
		exeName = "Chromium.app/Contents/MacOS/Chromium"
	case "linux":
		exeName = "chrome"
	default:
		exeName = "chrome"
	}

	// Look for the executable in common locations
	candidates := []string{
		filepath.Join(browserDir, exeName),
		filepath.Join(browserDir, browserName, exeName),
		filepath.Join(browserDir, "chrome-"+browserName, exeName),
	}

	for _, candidate := range candidates {
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}

	// Try to find by walking the directory
	var foundPath string
	filepath.Walk(browserDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if !info.IsDir() && (strings.HasSuffix(path, exeName) ||
			(runtime.GOOS == "darwin" && strings.Contains(path, "Chromium.app/Contents/MacOS/Chromium"))) {
			foundPath = path
			return filepath.SkipAll
		}

		return nil
	})

	return foundPath
}

// NewEmbeddedRunner creates a Playwright runner using embedded browsers
func NewEmbeddedRunner(headless bool) (*Runner, error) {
	// Initialize embedded browsers
	initEmbeddedBrowsers()

	// Setup embedded browser environment
	if err := ensureEmbeddedPlaywright(); err != nil {
		return nil, fmt.Errorf("setup embedded playwright: %w", err)
	}

	// Use the standard runner with the embedded browser setup
	return NewRunner(headless)
}