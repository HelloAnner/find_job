package utils

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// FormatDuration renders the elapsed time between start and end in the same zh-CN format as the Java utility.
func FormatDuration(start, end time.Time) string {
	return FormatSeconds(int64(end.Sub(start).Seconds()))
}

// FormatSeconds converts seconds to the HH时mm分ss秒 format.
func FormatSeconds(seconds int64) string {
	if seconds < 0 {
		seconds = 0
	}
	hours := seconds / 3600
	minutes := (seconds % 3600) / 60
	secs := seconds % 60
	return fmt.Sprintf("%d时%d分%d秒", hours, minutes, secs)
}

var (
	rng   = rand.New(rand.NewSource(time.Now().UnixNano()))
	rngMu sync.Mutex
)

// RandomInt returns a pseudo-random integer between min and max (inclusive).
func RandomInt(min, max int) int {
	if min >= max {
		return min
	}
	rngMu.Lock()
	defer rngMu.Unlock()
	return rng.Intn(max-min+1) + min
}
