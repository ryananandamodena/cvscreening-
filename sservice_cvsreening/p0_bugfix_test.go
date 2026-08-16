package main

import "testing"

// ==================== decodeSignatureImage (contract e-signature fix) ====================

func TestDecodeSignatureImage_RawBase64(t *testing.T) {
	// "hi" base64-encoded
	decoded, err := decodeSignatureImage("aGk=")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if string(decoded) != "hi" {
		t.Errorf("expected decoded bytes 'hi', got %q", decoded)
	}
}

func TestDecodeSignatureImage_DataURLPrefix(t *testing.T) {
	decoded, err := decodeSignatureImage("data:image/png;base64,aGk=")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if string(decoded) != "hi" {
		t.Errorf("expected decoded bytes 'hi', got %q", decoded)
	}
}

func TestDecodeSignatureImage_Empty(t *testing.T) {
	if _, err := decodeSignatureImage(""); err == nil {
		t.Error("expected error for empty signature data, got nil")
	}
}

func TestDecodeSignatureImage_InvalidBase64(t *testing.T) {
	if _, err := decodeSignatureImage("not-valid-base64!!!"); err == nil {
		t.Error("expected error for invalid base64, got nil")
	}
}

// ==================== percentChange (dashboard trend fix) ====================

func TestPercentChange_Increase(t *testing.T) {
	got := percentChange(150, 100)
	if got != 50.0 {
		t.Errorf("expected 50.0%%, got %v", got)
	}
}

func TestPercentChange_Decrease(t *testing.T) {
	got := percentChange(80, 100)
	if got != -20.0 {
		t.Errorf("expected -20.0%%, got %v", got)
	}
}

// Regression test for the P1 fix: previous == 0 must never produce NaN/+Inf — it must report
// a safe 0% rather than a business-nonsensical "infinite" swing.
func TestPercentChange_PreviousZero_IsSafe(t *testing.T) {
	got := percentChange(50, 0)
	if got != 0 {
		t.Errorf("expected 0 when previous is 0, got %v", got)
	}
	got2 := percentChange(0, 0)
	if got2 != 0 {
		t.Errorf("expected 0 when both current and previous are 0, got %v", got2)
	}
}

func TestPercentChange_NoChange(t *testing.T) {
	got := percentChange(100, 100)
	if got != 0 {
		t.Errorf("expected 0%% for no change, got %v", got)
	}
}
