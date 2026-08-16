package repository

import "testing"

// CompareFaceDescriptors is the security-critical core of face verification (Module 14 audit) —
// it must fail closed (deny) on any malformed input, never fail open.
func TestCompareFaceDescriptors(t *testing.T) {
	same := []float64{0.1, 0.2, 0.3, 0.4}
	closeMatch := []float64{0.11, 0.19, 0.31, 0.39} // small distance, within threshold
	farMismatch := []float64{5.0, -3.0, 8.0, 2.0}   // large distance, a different face
	wrongLength := []float64{0.1, 0.2}

	t.Run("identical descriptors match", func(t *testing.T) {
		matched, dist, err := CompareFaceDescriptors(same, same)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !matched {
			t.Errorf("expected identical descriptors to match, distance=%v", dist)
		}
	})

	t.Run("close descriptors (same person, minor variance) match", func(t *testing.T) {
		matched, _, err := CompareFaceDescriptors(same, closeMatch)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !matched {
			t.Error("expected a close descriptor to match")
		}
	})

	t.Run("far descriptor (different person) does NOT match", func(t *testing.T) {
		matched, _, err := CompareFaceDescriptors(same, farMismatch)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if matched {
			t.Error("expected a clearly different face to be denied, but it matched")
		}
	})

	t.Run("wrong-length descriptor is denied, not silently allowed", func(t *testing.T) {
		matched, _, err := CompareFaceDescriptors(same, wrongLength)
		if matched {
			t.Error("expected wrong-length descriptor to be denied")
		}
		if err == nil {
			t.Error("expected an error for wrong-length descriptor")
		}
	})

	t.Run("empty candidate against an enrolled descriptor is denied, not silently allowed", func(t *testing.T) {
		matched, _, err := CompareFaceDescriptors(same, []float64{})
		if matched {
			t.Error("expected empty candidate descriptor to be denied")
		}
		if err == nil {
			t.Error("expected an error for empty candidate descriptor")
		}
	})
}

// VerifyFaceDescriptor's own "no enrollment yet" pass-through (matched=true when GetFaceDescriptor
// returns nil) is an explicit, documented business-policy decision — not re-tested here as a
// bug, since IsDBConnected() is false in this test binary and GetFaceDescriptor would return an
// error (not nil, nil) without a real DB connection, making that specific branch untestable
// without DB mocking. See the Module 14 audit report for the BUSINESS DECISION classification.
