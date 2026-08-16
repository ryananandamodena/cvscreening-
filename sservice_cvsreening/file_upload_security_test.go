package main

import "testing"

// getExtension previously returned everything after the last "." in a client-supplied filename
// verbatim, letting an attacker smuggle path separators into the "extension" and, via the
// caller's fmt.Sprintf+os.Create, write outside the intended upload directory. This test locks
// in the Module 13 fix: only a whitelisted extension is ever returned.
func TestGetExtensionSanitization(t *testing.T) {
	cases := []struct {
		name     string
		filename string
		want     string
	}{
		{"plain webm", "recording.webm", ".webm"},
		{"plain mp4, mixed case", "clip.MP4", ".mp4"},
		{"no extension falls back to default", "recording", ".webm"},
		{"path traversal via extension falls back to default", "a.png/../../../../tmp/evil", ".webm"},
		{"unsupported extension falls back to default", "payload.exe", ".webm"},
		{"unsupported extension with traversal falls back to default", "a.php/../../etc/passwd", ".webm"},
		{"embedded null-like separator falls back to default", "clip.webm/../evil.sh", ".webm"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := getExtension(c.filename)
			if got != c.want {
				t.Errorf("getExtension(%q) = %q, want %q", c.filename, got, c.want)
			}
		})
	}
}
