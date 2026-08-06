import { z } from 'zod';

// Payroll schemas
export const payrollPeriodSchema = z.object({
  name: z.string()
    .min(1, 'Nama periode wajib diisi')
    .max(100, 'Nama periode maksimal 100 karakter'),
  startDate: z.string()
    .min(1, 'Tanggal mulai wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid')
    .refine(date => new Date(date) <= new Date(), {
      message: 'Tanggal mulai tidak boleh di masa depan'
    }),
  endDate: z.string()
    .min(1, 'Tanggal akhir wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid')
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Tanggal mulai harus sebelum tanggal akhir',
  path: ['endDate']
});

export const salaryConfigurationSchema = z.object({
  employeeId: z.number().int().positive('ID karyawan wajib diisi'),
  baseSalary: z.number()
    .min(0, 'Gaji pokok tidak boleh negatif')
    .max(1000000000, 'Gaji pokok terlalu besar'),
  transportAllowance: z.number()
    .min(0, 'Tunjangan transport tidak boleh negatif')
    .max(10000000, 'Tunjangan transport terlalu besar'),
  mealAllowance: z.number()
    .min(0, 'Tunjangan makan tidak boleh negatif')
    .max(5000000, 'Tunjangan makan terlalu besar'),
  positionAllowance: z.number()
    .min(0, 'Tunjangan jabatan tidak boleh negatif')
    .max(50000000, 'Tunjangan jabatan terlalu besar'),
  bpjsKesehatanType: z.enum(['personal', 'family']),
  bpjsKetenagakerjaanType: z.enum(['basic', 'premium'])
});

// Employee schemas
export const employeeSchema = z.object({
  firstName: z.string()
    .min(1, 'Nama depan wajib diisi')
    .max(50, 'Nama depan maksimal 50 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama depan hanya boleh huruf dan spasi'),
  lastName: z.string()
    .min(1, 'Nama belakang wajib diisi')
    .max(50, 'Nama belakang maksimal 50 karakter')
    .regex(/^[a-zA-Z\s]+$/, 'Nama belakang hanya boleh huruf dan spasi'),
  email: z.string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  phone: z.string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(15, 'Nomor telepon maksimal 15 digit')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Format nomor telepon tidak valid'),
  position: z.string()
    .min(1, 'Posisi wajib diisi')
    .max(100, 'Posisi maksimal 100 karakter'),
  department: z.string()
    .min(1, 'Departemen wajib diisi')
    .max(100, 'Departemen maksimal 100 karakter'),
  hireDate: z.string()
    .min(1, 'Tanggal mulai kerja wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid')
    .refine(date => new Date(date) <= new Date(), {
      message: 'Tanggal mulai kerja tidak boleh di masa depan'
    }),
  salary: z.number()
    .min(0, 'Gaji tidak boleh negatif')
    .max(1000000000, 'Gaji terlalu besar'),
  status: z.enum(['active', 'inactive', 'resigned', 'terminated'])
});

// Leave schemas
export const leaveRequestSchema = z.object({
  employeeId: z.number().int().positive('ID karyawan wajib diisi'),
  leaveType: z.enum(['annual', 'sick', 'maternity', 'personal', 'other']),
  startDate: z.string()
    .min(1, 'Tanggal mulai wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid'),
  endDate: z.string()
    .min(1, 'Tanggal akhir wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid'),
  reason: z.string()
    .min(10, 'Alasan cuti minimal 10 karakter')
    .max(500, 'Alasan cuti maksimal 500 karakter')
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: 'Tanggal mulai harus sebelum tanggal akhir',
  path: ['endDate']
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays <= 365; // Max 1 year
}, {
  message: 'Durasi cuti maksimal 365 hari',
  path: ['endDate']
});

// Attendance schemas
export const attendanceRecordSchema = z.object({
  employeeId: z.number().int().positive('ID karyawan wajib diisi'),
  date: z.string()
    .min(1, 'Tanggal wajib diisi')
    .refine(date => !isNaN(Date.parse(date)), 'Format tanggal tidak valid')
    .refine(date => new Date(date) <= new Date(), {
      message: 'Tanggal tidak boleh di masa depan'
    }),
  checkIn: z.string()
    .optional()
    .refine(time => !time || /^([01]\d|2[0-3]):([0-5]\d)$/.test(time), {
      message: 'Format waktu check-in tidak valid (HH:MM)'
    }),
  checkOut: z.string()
    .optional()
    .refine(time => !time || /^([01]\d|2[0-3]):([0-5]\d)$/.test(time), {
      message: 'Format waktu check-out tidak valid (HH:MM)'
    }),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'leave'])
});

// Organization schemas
export const departmentSchema = z.object({
  name: z.string()
    .min(1, 'Nama departemen wajib diisi')
    .max(100, 'Nama departemen maksimal 100 karakter'),
  description: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  managerId: z.number()
    .int()
    .positive('ID manager wajib diisi')
    .optional()
});

export const positionSchema = z.object({
  title: z.string()
    .min(1, 'Judul posisi wajib diisi')
    .max(100, 'Judul posisi maksimal 100 karakter'),
  departmentId: z.number()
    .int()
    .positive('Departemen wajib dipilih'),
  description: z.string()
    .max(500, 'Deskripsi maksimal 500 karakter')
    .optional(),
  level: z.enum(['junior', 'mid', 'senior', 'lead', 'manager', 'director']),
  minSalary: z.number()
    .min(0, 'Gaji minimum tidak boleh negatif')
    .max(1000000000, 'Gaji minimum terlalu besar'),
  maxSalary: z.number()
    .min(0, 'Gaji maksimum tidak boleh negatif')
    .max(1000000000, 'Gaji maksimum terlalu besar')
}).refine(data => data.minSalary <= data.maxSalary, {
  message: 'Gaji minimum harus kurang dari atau sama dengan gaji maksimum',
  path: ['maxSalary']
});

// Type exports
export type PayrollPeriodInput = z.infer<typeof payrollPeriodSchema>;
export type SalaryConfigurationInput = z.infer<typeof salaryConfigurationSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type PositionInput = z.infer<typeof positionSchema>;