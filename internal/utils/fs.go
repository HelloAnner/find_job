package utils

import (
	"fmt"
	"os"
	"path/filepath"
)

// EnsureFile makes sure the target file exists, creating parent directories when necessary.
func EnsureFile(path string, initial []byte) error {
	if _, err := os.Stat(path); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("stat %s: %w", path, err)
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return fmt.Errorf("mkdir %s: %w", filepath.Dir(path), err)
	}
	if err := os.WriteFile(path, initial, 0o644); err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	return nil
}
