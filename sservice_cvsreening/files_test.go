package main

import (
	"strings"
	"testing"
)

func TestReadPdf_InvalidContent(t *testing.T) {
	// Create a dummy reader with invalid PDF content
	reader := strings.NewReader("This is not a PDF file")
	size := int64(reader.Len())

	_, err := ReadPdf(reader, size)
	if err == nil {
		t.Error("Expected error when reading invalid PDF content, got nil")
	}
}
