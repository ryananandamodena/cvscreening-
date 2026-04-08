package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"strings"
	"unicode"

	"github.com/ledongthuc/pdf"
)

// ReadPdf reads content from a PDF file using multiple extraction strategies
func ReadPdf(file io.Reader, size int64) (string, error) {
	// Read file into bytes for ReaderAt
	content, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	if len(content) == 0 {
		return "", fmt.Errorf("empty file")
	}

	r, err := pdf.NewReader(bytes.NewReader(content), int64(len(content)))
	if err != nil {
		return "", fmt.Errorf("failed to parse PDF: %w", err)
	}

	totalPage := r.NumPage()
	if totalPage == 0 {
		return "", fmt.Errorf("PDF has 0 pages")
	}

	log.Printf("[PDF] Processing %d pages from PDF (%d bytes)", totalPage, len(content))

	// Strategy 1: GetPlainText per page (standard method)
	var textBuilder strings.Builder
	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			log.Printf("[PDF] Page %d is null, skipping", pageIndex)
			continue
		}

		text, err := p.GetPlainText(nil)
		if err != nil {
			log.Printf("[PDF] Warning: GetPlainText failed on page %d: %v", pageIndex, err)
			continue
		}

		cleaned := strings.TrimSpace(text)
		if len(cleaned) > 0 {
			textBuilder.WriteString(cleaned)
			textBuilder.WriteString("\n")
		}
	}

	result := strings.TrimSpace(textBuilder.String())
	if len(result) >= 50 {
		log.Printf("[PDF] Strategy 1 (GetPlainText) succeeded: %d chars", len(result))
		return cleanExtractedText(result), nil
	}

	log.Printf("[PDF] Strategy 1 got only %d chars, trying Strategy 2 (Row-based extraction)", len(result))

	// Strategy 2: Extract text from content streams using GetTextByRow
	var textBuilder2 strings.Builder
	for pageIndex := 1; pageIndex <= totalPage; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}

		rows, err := p.GetTextByRow()
		if err != nil {
			log.Printf("[PDF] Warning: GetTextByRow failed on page %d: %v", pageIndex, err)
			continue
		}

		for _, row := range rows {
			var lineTexts []string
			for _, word := range row.Content {
				s := strings.TrimSpace(word.S)
				if s != "" {
					lineTexts = append(lineTexts, s)
				}
			}
			if len(lineTexts) > 0 {
				textBuilder2.WriteString(strings.Join(lineTexts, " "))
				textBuilder2.WriteString("\n")
			}
		}
	}

	result2 := strings.TrimSpace(textBuilder2.String())
	if len(result2) > len(result) {
		log.Printf("[PDF] Strategy 2 (GetTextByRow) succeeded: %d chars", len(result2))
		return cleanExtractedText(result2), nil
	}

	// Return whatever we got (even if small)
	bestResult := result
	if len(result2) > len(bestResult) {
		bestResult = result2
	}

	bestResult = cleanExtractedText(bestResult)

	if len(bestResult) == 0 {
		log.Printf("[PDF] All extraction strategies failed. PDF likely contains only images.")
		return "", fmt.Errorf("PDF appears to be image-based (scanned). No text could be extracted. Please use a text-based PDF")
	}

	log.Printf("[PDF] Final extracted text: %d chars (below ideal threshold)", len(bestResult))
	return bestResult, nil
}

// cleanExtractedText normalizes extracted PDF text
func cleanExtractedText(text string) string {
	lines := strings.Split(text, "\n")
	var cleaned []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Remove lines that are just special characters (no letters/digits)
		hasContent := false
		for _, r := range line {
			if unicode.IsLetter(r) || unicode.IsDigit(r) {
				hasContent = true
				break
			}
		}
		if !hasContent {
			continue
		}

		cleaned = append(cleaned, line)
	}

	return strings.Join(cleaned, "\n")
}
