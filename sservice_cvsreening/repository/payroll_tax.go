package repository

import "github.com/ryantriananda/sservice_cvsreening/models"

// Perhitungan PPh21 (metode TER - Tarif Efektif Rata-rata, PMK 168/2023) dan
// iuran BPJS Kesehatan / BPJS Ketenagakerjaan porsi karyawan.
//
// Tarif dan bracket TIDAK lagi hardcode di sini — semuanya dibaca dari tabel
// `pph21_ter_brackets` dan `bpjs_rate_config` (lihat schema_payroll_tax_config.sql
// dan payroll_tax_config_repository.go) sehingga Finance/Admin bisa mengubahnya
// dari UI kapan saja peraturan berubah, tanpa perlu redeploy aplikasi.

// TerCategoryForTaxStatus memetakan status PTKP (TK/0..3, K/0..3) ke kategori TER.
func TerCategoryForTaxStatus(taxStatus string) string {
	switch taxStatus {
	case "TK/0", "TK/1", "K/0":
		return "A"
	case "TK/2", "TK/3", "K/1", "K/2":
		return "B"
	case "K/3":
		return "C"
	default:
		// Status tidak dikenali/kosong: default ke kategori A (paling konservatif untuk TK/0)
		return "A"
	}
}

// CalculatePPh21MonthlyDynamic menghitung PPh21 bulanan dari penghasilan bruto memakai
// tabel TER yang di-load dari database untuk kategori PTKP yang sesuai.
func CalculatePPh21MonthlyDynamic(grossMonthly float64, taxStatus string, brackets []models.PPh21TERBracket) float64 {
	if grossMonthly <= 0 || len(brackets) == 0 {
		return 0
	}
	rate := brackets[len(brackets)-1].Rate
	for _, b := range brackets {
		if b.UpTo == nil || grossMonthly <= *b.UpTo {
			rate = b.Rate
			break
		}
	}
	return grossMonthly * rate
}

// CalculateBPJSKesehatanEmployeeDynamic menghitung porsi iuran BPJS Kesehatan yang
// ditanggung karyawan, memakai tarif & batas upah yang bisa diubah dari UI Finance.
func CalculateBPJSKesehatanEmployeeDynamic(baseSalary float64, planType string, cfg *models.BPJSRateConfig) float64 {
	if planType == "none" || baseSalary <= 0 || cfg == nil {
		return 0
	}
	capped := baseSalary
	if capped > cfg.KesehatanSalaryCap {
		capped = cfg.KesehatanSalaryCap
	}
	return capped * cfg.KesehatanRateEmployee
}

// CalculateBPJSKetenagakerjaanEmployeeDynamic menghitung porsi iuran JHT (tanpa batas upah) dan
// JP (dibatasi upah maksimal) yang ditanggung karyawan, memakai tarif yang bisa diubah dari UI Finance.
// JKK & JKM sepenuhnya ditanggung perusahaan (tidak masuk potongan karyawan).
func CalculateBPJSKetenagakerjaanEmployeeDynamic(baseSalary float64, planType string, cfg *models.BPJSRateConfig) (jht float64, jp float64) {
	if planType == "none" || baseSalary <= 0 || cfg == nil {
		return 0, 0
	}
	jht = baseSalary * cfg.JHTRateEmployee
	jpBase := baseSalary
	if jpBase > cfg.JPSalaryCap {
		jpBase = cfg.JPSalaryCap
	}
	jp = jpBase * cfg.JPRateEmployee
	return jht, jp
}
