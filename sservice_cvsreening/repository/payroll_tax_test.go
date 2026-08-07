package repository

import (
	"testing"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

func floatPtr(v float64) *float64 { return &v }

func TestTerCategoryForTaxStatus(t *testing.T) {
	cases := []struct {
		taxStatus string
		want      string
	}{
		{"TK/0", "A"},
		{"TK/1", "A"},
		{"K/0", "A"},
		{"TK/2", "B"},
		{"TK/3", "B"},
		{"K/1", "B"},
		{"K/2", "B"},
		{"K/3", "C"},
		{"", "A"},          // unknown/empty -> conservative default
		{"bogus", "A"},     // unrecognized status -> conservative default
	}
	for _, c := range cases {
		if got := TerCategoryForTaxStatus(c.taxStatus); got != c.want {
			t.Errorf("TerCategoryForTaxStatus(%q) = %q, want %q", c.taxStatus, got, c.want)
		}
	}
}

func TestCalculatePPh21MonthlyDynamic(t *testing.T) {
	brackets := []models.PPh21TERBracket{
		{Category: "A", BracketOrder: 1, UpTo: floatPtr(5_000_000), Rate: 0.0},
		{Category: "A", BracketOrder: 2, UpTo: floatPtr(10_000_000), Rate: 0.05},
		{Category: "A", BracketOrder: 3, UpTo: nil, Rate: 0.15}, // unbounded top bracket
	}

	cases := []struct {
		name         string
		grossMonthly float64
		brackets     []models.PPh21TERBracket
		want         float64
	}{
		{"zero income", 0, brackets, 0},
		{"negative income defensively treated as zero", -1000, brackets, 0},
		{"no brackets configured", 8_000_000, nil, 0},
		{"falls in first (0%) bracket", 4_000_000, brackets, 0},
		{"exactly at first bracket boundary", 5_000_000, brackets, 0},
		{"falls in second bracket", 8_000_000, brackets, 8_000_000 * 0.05},
		{"falls in unbounded top bracket", 50_000_000, brackets, 50_000_000 * 0.15},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := CalculatePPh21MonthlyDynamic(c.grossMonthly, "TK/0", c.brackets)
			if got != c.want {
				t.Errorf("CalculatePPh21MonthlyDynamic(%v) = %v, want %v", c.grossMonthly, got, c.want)
			}
		})
	}
}

func TestCalculateBPJSKesehatanEmployeeDynamic(t *testing.T) {
	cfg := &models.BPJSRateConfig{
		KesehatanRateEmployee: 0.01,
		KesehatanSalaryCap:    12_000_000,
	}

	cases := []struct {
		name       string
		baseSalary float64
		planType   string
		cfg        *models.BPJSRateConfig
		want       float64
	}{
		{"plan type none -> no deduction", 10_000_000, "none", cfg, 0},
		{"zero salary -> no deduction", 0, "standard", cfg, 0},
		{"nil config -> no deduction", 10_000_000, "standard", nil, 0},
		{"below cap: 1% of actual salary", 10_000_000, "standard", cfg, 100_000},
		{"above cap: 1% of capped salary, not actual", 20_000_000, "standard", cfg, 120_000},
		{"exactly at cap", 12_000_000, "standard", cfg, 120_000},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := CalculateBPJSKesehatanEmployeeDynamic(c.baseSalary, c.planType, c.cfg)
			if got != c.want {
				t.Errorf("CalculateBPJSKesehatanEmployeeDynamic(%v, %q) = %v, want %v", c.baseSalary, c.planType, got, c.want)
			}
		})
	}
}

func TestCalculateBPJSKetenagakerjaanEmployeeDynamic(t *testing.T) {
	cfg := &models.BPJSRateConfig{
		JHTRateEmployee: 0.02,
		JPRateEmployee:  0.01,
		JPSalaryCap:     9_000_000,
	}

	t.Run("plan type none -> both zero", func(t *testing.T) {
		jht, jp := CalculateBPJSKetenagakerjaanEmployeeDynamic(10_000_000, "none", cfg)
		if jht != 0 || jp != 0 {
			t.Errorf("got jht=%v jp=%v, want 0, 0", jht, jp)
		}
	})

	t.Run("nil config -> both zero", func(t *testing.T) {
		jht, jp := CalculateBPJSKetenagakerjaanEmployeeDynamic(10_000_000, "standard", nil)
		if jht != 0 || jp != 0 {
			t.Errorf("got jht=%v jp=%v, want 0, 0", jht, jp)
		}
	})

	t.Run("JHT has no cap, JP is capped", func(t *testing.T) {
		jht, jp := CalculateBPJSKetenagakerjaanEmployeeDynamic(15_000_000, "standard", cfg)
		wantJHT := 15_000_000 * 0.02      // uncapped
		wantJP := 9_000_000 * 0.01        // capped at JPSalaryCap, not actual salary
		if jht != wantJHT {
			t.Errorf("jht = %v, want %v (should not be capped)", jht, wantJHT)
		}
		if jp != wantJP {
			t.Errorf("jp = %v, want %v (should be capped at JPSalaryCap)", jp, wantJP)
		}
	})

	t.Run("below JP cap: both proportional to actual salary", func(t *testing.T) {
		jht, jp := CalculateBPJSKetenagakerjaanEmployeeDynamic(5_000_000, "standard", cfg)
		if jht != 100_000 {
			t.Errorf("jht = %v, want 100000", jht)
		}
		if jp != 50_000 {
			t.Errorf("jp = %v, want 50000", jp)
		}
	})
}
