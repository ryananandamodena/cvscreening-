-- ================================================================
-- OTHER DEDUCTIONS (beyond BPJS/PPh21) — e.g. loan installments,
-- cooperative dues, lateness penalties, uniform/asset cost recovery.
-- Finance defines a reusable catalog of deduction types, then assigns
-- one or more to an employee as a recurring monthly deduction that
-- GeneratePayroll automatically applies (and auto-stops once a loan
-- balance is paid off).
-- ================================================================

CREATE TABLE IF NOT EXISTS deduction_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    calculation_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- fixed, percentage_of_base
    default_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    default_rate DECIMAL(6,4) NOT NULL DEFAULT 0, -- used when calculation_type = percentage_of_base
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO deduction_types (name, description, calculation_type, default_amount, default_rate) VALUES
    ('Cicilan Pinjaman Karyawan', 'Potongan cicilan pinjaman/kasbon ke perusahaan', 'fixed', 0, 0),
    ('Koperasi Karyawan', 'Iuran koperasi karyawan bulanan', 'fixed', 50000, 0),
    ('Denda Keterlambatan', 'Denda tambahan di luar potongan absensi standar', 'fixed', 0, 0),
    ('Ganti Rugi Aset Perusahaan', 'Cicilan penggantian aset/seragam yang hilang atau rusak', 'fixed', 0, 0),
    ('Zakat/Sumbangan', 'Potongan zakat atau sumbangan sukarela bulanan', 'percentage_of_base', 0, 0.025)
ON CONFLICT DO NOTHING;

-- Recurring deduction assigned to a specific employee (e.g. an active loan installment)
CREATE TABLE IF NOT EXISTS employee_deductions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    deduction_type_id INTEGER NOT NULL REFERENCES deduction_types(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2), -- override of deduction_types.default_amount for calculation_type = fixed; NULL = use default
    rate DECIMAL(6,4), -- override of deduction_types.default_rate for calculation_type = percentage_of_base; NULL = use default
    remaining_balance DECIMAL(15,2), -- for installment-style deductions (e.g. loans); NULL = open-ended (never auto-stops)
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_deductions_employee ON employee_deductions(employee_id, is_active);
