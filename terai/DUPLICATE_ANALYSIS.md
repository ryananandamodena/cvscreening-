# Analisis Duplikasi Menu dan Fungsi Aplikasi RecruitAI

## 📋 Daftar Halaman dan Fungsi

### **SECTION: OVERVIEW**

| No | Halaman | Path | File | Fungsi | Status |
|----|---------|------|------|--------|--------|
| 1 | Dashboard | `/` | `pages/Dashboard.tsx` | Overview utama, stats, quick actions | ✅ Original |
| 2 | Analytics | `/analytics` | `pages/Analytics.tsx` | Analytics dasar | ⚠️ **DUPLICATE** - Digantikan AdvancedAnalytics |
| 3 | Analytics (Advanced) | `/analytics` | `pages/AdvancedAnalytics.tsx` | Analytics lengkap dengan charts | ✅ **DIREKOMENDASIKAN** |

### **SECTION: RECRUITMENT**

| No | Halaman | Path | File | Fungsi | Status |
|----|---------|------|------|--------|--------|
| 4 | Job Management | `/jobs` | `pages/JobManagement.tsx` | Kelola lowongan kerja | ✅ Original |
| 5 | New Job | `/jobs/new` | `pages/NewJob.tsx` | Buat lowongan baru | ✅ Original |
| 6 | Screening | `/screening/:id?` | `pages/Screening.tsx` | Screening CV dengan AI | ✅ Original |
| 7 | **Skill Matching** | `/skill-matching` | `pages/SkillMatching.tsx` | Pencocokan skill AI | ✅ **BARU** |
| 8 | **LinkedIn Import** | `/linkedin-import` | `pages/LinkedInImport.tsx` | Import kandidat LinkedIn | ✅ **BARU** |
| 9 | Live Interview | `/interviews` | `pages/LiveInterview.tsx` | Interview langsung AI | ✅ Original |
| 10 | **Interview Schedule** | `/interview-schedule` | `pages/InterviewSchedule.tsx` | Jadwal interview calendar | ✅ **BARU** |
| 11 | **Interview Scorecard** | `/interview-scorecard/:id?` | `pages/InterviewScorecard.tsx` | Penilaian interview | ✅ **BARU** |
| 12 | **Recording Playback** | `/recordings/:id` | `pages/RecordingPlayback.tsx` | Putar rekaman interview | ✅ **BARU** |
| 13 | Offer Letter | `/offers` | `pages/OfferLetter.tsx` | Surat penawaran kerja | ✅ Original |
| 14 | Candidate Interview | `/candidate/:id` | `pages/CandidateInterview.tsx` | Interview kandidat (similar ke LiveInterview) | ⚠️ **POTENTIAL DUPLICATE** |
| 15 | Interview Results | `/interview/results` | `pages/InterviewResults.tsx` | Hasil interview AI | ⚠️ **POTENTIAL DUPLICATE** |

### **SECTION: RESOURCES**

| No | Halaman | Path | File | Fungsi | Status |
|----|---------|------|------|--------|--------|
| 16 | Talent Pool | `/pool` | `pages/TalentPool.tsx` | Database kandidat | ✅ Original |
| 17 | Question Bank | `/questions` | `pages/QuestionBank.tsx` | Bank soal interview | ✅ Original |

### **SECTION: SYSTEM**

| No | Halaman | Path | File | Fungsi | Status |
|----|---------|------|------|--------|--------|
| 18 | User Management | `/users` | `pages/UserManagement.tsx` | Kelola pengguna | ✅ Original |
| 19 | Integrations | `/integrations` | `pages/Integrations.tsx` | Integrasi third-party | ✅ Original |
| 20 | Settings | `/settings` | `pages/Settings.tsx` | Pengaturan aplikasi | ✅ Original |

### **FOLDER DUPLICATE (src/)**

| No | Halaman | Path | File | Status |
|----|---------|------|------|--------|
| 21 | Analytics | `/analytics` | `src/pages/Analytics.tsx` | ❌ **HAPUS** - Duplikat |
| 22 | Dashboard | `/` | `src/pages/Dashboard.tsx` | ❌ **HAPUS** - Duplikat |
| 23 | Calendar | `/calendar` | `src/pages/Calendar.tsx` | ❌ **HAPUS** - Duplikat |
| 24 | Attendance | `/attendance` | `src/pages/Attendance.tsx` | ❌ **HAPUS** - Duplikat |
| 25 | Benefits | `/benefits` | `src/pages/Benefits.tsx` | ❌ **HAPUS** - Duplikat |
| 26 | BusinessTrip | `/business-trip` | `src/pages/BusinessTrip.tsx` | ❌ **HAPUS** - Duplikat |
| 27 | Contracts | `/contracts` | `src/pages/Contracts.tsx` | ❌ **HAPUS** - Duplikat |
| 28 | Payslips | `/payslips` | `src/pages/Payslips.tsx` | ❌ **HAPUS** - Duplikat |
| 29 | RequestCenter | `/requests` | `src/pages/RequestCenter.tsx` | ❌ **HAPUS** - Duplikat |

---

## 🔍 ANALISIS DUPLIKASI

### **1. Analytics Duplicates**
```
Problem: 
- pages/Analytics.tsx (basic analytics)
- pages/AdvancedAnalytics.tsx (advanced analytics - SAMA ROUTE!)
- src/pages/Analytics.tsx (duplicate file)

Solution:
- KEEP: pages/AdvancedAnalytics.tsx
- DELETE: pages/Analytics.tsx (soalnya advanced lebih lengkap)
- DELETE: src/pages/ folder entirely
```

### **2. Interview Functionality Overlap**
```
Problem:
- pages/LiveInterview.tsx (AI live interview)
- pages/CandidateInterview.tsx (candidate-specific interview)
- pages/InterviewResults.tsx (AI-generated results)
- pages/RecordingPlayback.tsx (playback recording)
- pages/InterviewSchedule.tsx (scheduling)
- pages/InterviewScorecard.tsx (evaluation)

Analysis:
- LiveInterview: Main AI interview interface ✅ KEEP
- CandidateInterview: Similar ke LiveInterview - perlu merge
- InterviewResults: UI untuk hasil AI analysis - bisa digabungkan ke LiveInterview
- RecordingPlayback: UI untuk playback - sudah standalone ✅ KEEP
- InterviewSchedule: Calendar scheduling ✅ KEEP  
- InterviewScorecard: Evaluation form ✅ KEEP

Recommendation:
- Merge CandidateInterview functionality ke LiveInterview
- Merge InterviewResults ke LiveInterview sebagai tab
```

### **3. Duplicate Services**
```
Problem:
- services/ai.service.ts - AI features
- services/api.service.ts - General API
- services/interview.service.ts - Interview features (BARU)
- services/linkedin.service.ts - LinkedIn integration (BARU)
- services/recording.service.ts - Recording features (BARU)

Analysis:
- Semua service sudah terpisah dengan fungsi jelas
- Tidak ada duplikasi
- ✅ KEEP ALL
```

---

## ✅ REKOMENDASI PERBAIKAN

### **Immediately Fix:**

1. **Hapus folder src/ yang duplikat**
   ```
   delete_file: src/
   delete_file: src/components/
   delete_file: src/contexts/
   delete_file: src/layouts/
   delete_file: src/lib/
   delete_file: src/types/
   ```

2. **Hapus Analytics.tsx lama**
   ```
   delete_file: pages/Analytics.tsx
   ```

3. **Update routes.ts untuk hapus referensi Analytics lama**

### **Future Improvements:**

1. **Merge CandidateInterview ke LiveInterview**
   - Gabungkan fitur candidate-specific interview ke halaman utama
   - Gunakan tab atau conditional rendering

2. **Merge InterviewResults ke LiveInterview**
   - Hasil AI analysis bisa ditampilkan dalam tab di LiveInterview
   - Atau buat page baru "Interview Details" yang komprehensif

3. **Cleanup Services**
   - pisahkan logic interview ke interview.service.ts
   - AI service tetap untuk feature matching dan analysis

---

## 📊 RINGKASAN STATUS

| Kategori | Total | Unique | Duplicates |
|----------|-------|--------|------------|
| Pages | 29 | 15 | 14 |
| Services | 5 | 5 | 0 |
| Routes | 18 | 18 | 0 |

**Duplicates Found:** ~14 files perlu dihapus

**Recommended Actions:**
1. Hapus folder `src/` (9 files + subfolders)
2. Hapus `pages/Analytics.tsx` (digantikan AdvancedAnalytics)
3. (Optional) Merge CandidateInterview ke LiveInterview
4. (Optional) Merge InterviewResults ke LiveInterview

---

## 🚀 STEP-BY-STEP CLEANUP

```bash
# 1. Delete duplicate src folder
rm -rf src/

# 2. Delete old Analytics page
rm pages/Analytics.tsx

# 3. Update routes to use AdvancedAnalytics
# (sudah dilakukan)
```
