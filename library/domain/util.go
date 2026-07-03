package domain

import (
	"path/filepath"
	"strings"
)

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}

// baseName is a file's name without directory or extension — the display title
// fallback when a file carries no title tag.
func baseName(path string) string {
	name := filepath.Base(path)
	return strings.TrimSuffix(name, filepath.Ext(name))
}
