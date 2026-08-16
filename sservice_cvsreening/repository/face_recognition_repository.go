package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
)

// SaveFaceDescriptor enrolls (or re-enrolls) the employee's reference face descriptor
func SaveFaceDescriptor(ctx context.Context, employeeID int, descriptor []float64) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	raw, err := json.Marshal(descriptor)
	if err != nil {
		return err
	}
	_, err = GetDB().Exec(ctx, `UPDATE employees SET face_descriptor = $1 WHERE id = $2`, raw, employeeID)
	return err
}

// GetFaceDescriptor returns the employee's enrolled descriptor, or nil if not enrolled yet
func GetFaceDescriptor(ctx context.Context, employeeID int) ([]float64, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var raw []byte
	err := GetDB().QueryRow(ctx, `SELECT face_descriptor FROM employees WHERE id = $1`, employeeID).Scan(&raw)
	if err != nil {
		return nil, err
	}
	if raw == nil {
		return nil, nil
	}
	var descriptor []float64
	if err := json.Unmarshal(raw, &descriptor); err != nil {
		return nil, err
	}
	return descriptor, nil
}

// faceMatchThreshold is the standard face-api.js Euclidean distance cutoff for "same person"
// (distances below this are considered a match; this is the widely-used default for its models).
const faceMatchThreshold = 0.6

// VerifyFaceDescriptor compares a freshly captured descriptor against the employee's enrolled one.
// Returns (matched, distance, error). If the employee has no enrollment yet, matched=true (nothing to compare against).
func VerifyFaceDescriptor(ctx context.Context, employeeID int, candidate []float64) (bool, float64, error) {
	enrolled, err := GetFaceDescriptor(ctx, employeeID)
	if err != nil {
		return false, 0, err
	}
	if enrolled == nil {
		return true, 0, nil
	}
	return CompareFaceDescriptors(enrolled, candidate)
}

// CompareFaceDescriptors is the pure distance-comparison core of VerifyFaceDescriptor, split out
// so it can be unit-tested without a database connection (GetFaceDescriptor requires one).
func CompareFaceDescriptors(enrolled, candidate []float64) (bool, float64, error) {
	if len(candidate) != len(enrolled) {
		return false, 999, fmt.Errorf("format face descriptor tidak valid")
	}

	var sumSq float64
	for i := range enrolled {
		d := enrolled[i] - candidate[i]
		sumSq += d * d
	}
	distance := math.Sqrt(sumSq)
	return distance <= faceMatchThreshold, distance, nil
}
