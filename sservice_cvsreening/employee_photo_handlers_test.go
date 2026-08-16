package main

import (
	"bytes"
	"encoding/binary"
	"hash/crc32"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

func validJPEGBytes(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, color.RGBA{R: 100, G: 150, B: 200, A: 255})
		}
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, nil); err != nil {
		t.Fatalf("failed to encode test jpeg: %v", err)
	}
	return buf.Bytes()
}

func validPNGBytes(t *testing.T, w, h int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("failed to encode test png: %v", err)
	}
	return buf.Bytes()
}

// pngChunk builds one length-prefixed, CRC-checked PNG chunk exactly as the format requires —
// used to hand-craft a PNG whose IHDR *declares* far larger dimensions than any real pixel data
// backs, the same technique a decompression-bomb-style attack would use (Module 15 §W).
func pngChunk(chunkType string, data []byte) []byte {
	var out bytes.Buffer
	lenBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(lenBuf, uint32(len(data)))
	out.Write(lenBuf)
	typeAndData := append([]byte(chunkType), data...)
	out.Write(typeAndData)
	crc := crc32.ChecksumIEEE(typeAndData)
	crcBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(crcBuf, crc)
	out.Write(crcBuf)
	return out.Bytes()
}

func fakeOversizedPNG(width, height uint32) []byte {
	var buf bytes.Buffer
	buf.Write([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}) // PNG signature
	ihdr := make([]byte, 13)
	binary.BigEndian.PutUint32(ihdr[0:4], width)
	binary.BigEndian.PutUint32(ihdr[4:8], height)
	ihdr[8] = 8  // bit depth
	ihdr[9] = 6  // color type: RGBA
	ihdr[10] = 0 // compression
	ihdr[11] = 0 // filter
	ihdr[12] = 0 // interlace
	buf.Write(pngChunk("IHDR", ihdr))
	buf.Write(pngChunk("IEND", nil))
	return buf.Bytes()
}

func TestSniffAndValidateImage(t *testing.T) {
	t.Run("valid JPEG is accepted", func(t *testing.T) {
		ct, err := sniffAndValidateImage(validJPEGBytes(t, 100, 100))
		if err != nil {
			t.Fatalf("expected valid JPEG to pass, got: %v", err)
		}
		if ct != "image/jpeg" {
			t.Errorf("expected content type image/jpeg, got %s", ct)
		}
	})

	t.Run("valid PNG is accepted", func(t *testing.T) {
		ct, err := sniffAndValidateImage(validPNGBytes(t, 100, 100))
		if err != nil {
			t.Fatalf("expected valid PNG to pass, got: %v", err)
		}
		if ct != "image/png" {
			t.Errorf("expected content type image/png, got %s", ct)
		}
	})

	t.Run("executable renamed to .jpg is rejected regardless of claimed extension", func(t *testing.T) {
		// MZ header — a Windows PE executable — with a trailing name that would look like a
		// JPEG if only the filename/extension were trusted (which this function never does).
		fakeExe := append([]byte{'M', 'Z', 0x90, 0x00, 0x03, 0x00, 0x00, 0x00}, make([]byte, 100)...)
		_, err := sniffAndValidateImage(fakeExe)
		if err == nil {
			t.Error("expected an executable to be rejected even if its extension claims .jpg")
		}
	})

	t.Run("SVG (script-capable) is rejected", func(t *testing.T) {
		svg := []byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`)
		_, err := sniffAndValidateImage(svg)
		if err == nil {
			t.Error("expected SVG content to be rejected — SVG can embed <script>")
		}
	})

	t.Run("corrupt/truncated JPEG is rejected", func(t *testing.T) {
		full := validJPEGBytes(t, 50, 50)
		truncated := full[:len(full)/4] // magic bytes present, but not a decodable image
		_, err := sniffAndValidateImage(truncated)
		if err == nil {
			t.Error("expected truncated/corrupt JPEG to be rejected")
		}
	})

	t.Run("plain text with no image signature is rejected", func(t *testing.T) {
		_, err := sniffAndValidateImage([]byte("just some plain text, not an image at all"))
		if err == nil {
			t.Error("expected non-image content to be rejected")
		}
	})

	t.Run("empty file is rejected", func(t *testing.T) {
		_, err := sniffAndValidateImage([]byte{})
		if err == nil {
			t.Error("expected empty file to be rejected")
		}
	})

	t.Run("PNG declaring dimensions far beyond the sanity ceiling is rejected", func(t *testing.T) {
		_, err := sniffAndValidateImage(fakeOversizedPNG(50000, 50000))
		if err == nil {
			t.Error("expected an oversized-dimension PNG to be rejected, not decoded")
		}
	})

	t.Run("normal-size PNG well under the ceiling is accepted", func(t *testing.T) {
		_, err := sniffAndValidateImage(validPNGBytes(t, 512, 512))
		if err != nil {
			t.Errorf("expected a normal 512x512 PNG to pass, got: %v", err)
		}
	})
}

func TestExtensionForContentType(t *testing.T) {
	cases := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
		"image/gif":  ".jpg", // unexpected input falls back to a safe default, never trusts the input verbatim
	}
	for ct, want := range cases {
		if got := extensionForContentType(ct); got != want {
			t.Errorf("extensionForContentType(%q) = %q, want %q", ct, got, want)
		}
	}
}
