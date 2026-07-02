package library

import (
	"path/filepath"
	"strings"
)

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func baseName(path string) string {
	name := filepath.Base(path)
	return strings.TrimSuffix(name, filepath.Ext(name))
}

// placeholders returns "?, ?, ?" for n args.
func placeholders(n int) string {
	if n <= 0 {
		return ""
	}
	return strings.Repeat("?, ", n-1) + "?"
}

func toArgs(ids []string) []any {
	args := make([]any, len(ids))
	for i, id := range ids {
		args[i] = id
	}
	return args
}

// escapeLike neutralizes LIKE wildcards in user input (paired with ESCAPE '\').
func escapeLike(s string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return r.Replace(s)
}

// likePrefix builds a LIKE pattern matching a folder and everything beneath it,
// with the path separator appended so "/music" does not also match "/music2".
func likePrefix(folder string) string {
	prefix := strings.TrimRight(folder, string(filepath.Separator)) + string(filepath.Separator)
	return escapeLike(prefix) + "%"
}
