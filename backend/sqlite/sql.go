package sqlite

import (
	"path/filepath"
	"strings"
)

// placeholders returns "?, ?, ?" for n bind args.
func placeholders(n int) string {
	if n <= 0 {
		return ""
	}
	return strings.Repeat("?, ", n-1) + "?"
}

func toArgs(keys []string) []any {
	args := make([]any, len(keys))
	for i, k := range keys {
		args[i] = k
	}
	return args
}

// escapeLike neutralizes LIKE wildcards in user input (paired with ESCAPE '\').
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}

// likePrefix matches a folder and everything beneath it, with the separator
// appended so "/music" does not also match "/music2".
func likePrefix(folder string) string {
	prefix := strings.TrimRight(folder, string(filepath.Separator)) + string(filepath.Separator)
	return escapeLike(prefix) + "%"
}
