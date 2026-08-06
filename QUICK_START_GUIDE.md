# 🚀 QUICK START GUIDE - Phase 2: Attendance & Leave Management

## ✅ Implementation Complete!

Semua fitur Phase 2 telah berhasil diimplementasikan:
- ✅ Backend API (Go) - **COMPILED SUCCESSFULLY**
- ✅ Frontend UI (React/TypeScript) - **READY**
- ✅ Database Schema - **READY**
- ✅ Routes Configuration - **CONFIGURED**

---

## 📦 WHAT'S BEEN IMPLEMENTED

### Backend (Go)
1. **New Files Created:**
   - `leave_handlers.go` - Complete leave management endpoints
   
2. **Updated Files:**
   - `repository/leave_repository.go` - Added missing functions
   - `main.go` - Registered all new routes

3. **Existing Files (Already Complete):**
   - `attendance_handlers.go` - All attendance endpoints
   - `repository/attendance_repository.go` - All attendance functions
   - `repository/notification_repository.go` - Notification system
   - `models/core_hr_models.go` - All data models

### Frontend (React/TypeScript)
1. **New Files Created:**
   - `pages/attendance/ShiftManagement.tsx` - Complete shift management UI
   
2. **Updated Files:**
   - `services/leave.service.ts` - Updated to match new API endpoints
   - `services/attendance.service.ts` - Fixed duplicate import
   - `pages/leave/LeaveManagement.tsx` - Updated service calls
   - `config/routes.ts` - Added shift management route

3. **Existing Files (Already Complete):**
   - `pages/attendance/AttendanceOverview.tsx` - Attendance dashboard
   - `pages/leave/LeaveManagement.tsx` - Leave management UI

---

## 🎯 FEATURES READY TO USE

### 1. Attendance Management
- ✅ Clock In/Out with geolocation
- ✅ Today's attendance status
- ✅ Attendance history (last 30 days)
- ✅ Real-time clock display
- ✅ Status tracking (present, late, absent)

### 2. Shift Management (Admin/HR)
- ✅ Create/Edit/Delete shifts
- ✅ Assign shifts to employees
- ✅ View all shift assignments
- ✅ Night shift support
- ✅ Break time configuration
- ✅ Tolerance minutes setting

### 3. Leave Management
- ✅ View leave balances (Annual, Sick, etc.)
- ✅ Submit leave requests
- ✅ View leave history
- ✅ Approve/Reject requests (Manager/HR)
- ✅ Cancel pending requests
- ✅ Balance validation
- ✅ Holiday calendar

---

## 🔧 HOW TO RUN

### Backend (Go)

1. **Navigate to backend directory:**
   ```bash
   cd sservice_cvsreening
   ```

2. **Ensure database is running and configured in `.env`:**
   ```env
   DATABASE_URL=postgres://user:pass@localhost:5432/cv_screening?sslmode=disable
   JWT_SECRET=your_secret_key_here
   PORT=8081
   ```

3. **Run database migration (if not done yet):**
   ```sql
   -- Execute schema_attendance_leave.sql in your PostgreSQL database
   psql -U postgres -d cv_screening -f schema_attendance_leave.sql
   ```

4. **Run the backend:**
   ```bash
   # Option 1: Run directly
   go run main.go

   # Option 2: Build and run
   go build -o service.exe
   ./service.exe
   ```

5. **Verify backend is running:**
   ```
   Open: http://localhost:8081/health
   Should return: {"status":"service up","database":true}
   ```

### Frontend (React)

1. **Navigate to frontend directory:**
   ```bash
   cd terai
   ```

2. **Install dependencies (if not done yet):**
   ```bash
   npm install
   ```

3. **Configure API URL in `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:8081/api
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 🧪 TESTING THE FEATURES

### Test Attendance Module

1. **Login to the application**
2. **Navigate to:** `/attendance`
3. **Test Clock In:**
   - Click "CLOCK IN" button
   - Allow geolocation permission
   - Verify success message
4. **Test Clock Out:**
   - Click "CLOCK OUT" button
   - Verify success message
5. **View History:**
   - Check "Recent Activity" section
   - Verify today's record appears

### Test Shift Management (Admin/HR)

1. **Navigate to:** `/attendance/shifts`
2. **Create New Shift:**
   - Click "Create Shift"
   - Fill in: Name, Start Time, End Time
   - Set tolerance minutes
   - Click "Create Shift"
3. **Assign Shift:**
   - Click "Assign Shift"
   - Select Employee ID (use 1 for testing)
   - Select Shift
   - Set Effective Date
   - Click "Assign Shift"
4. **View Assignments:**
   - Check the assignments table
   - Verify new assignment appears

### Test Leave Management

1. **Navigate to:** `/leaves`
2. **View Balances:**
   - Check leave balance cards
   - Verify remaining days display
3. **Submit Leave Request:**
   - Click "Request Leave"
   - Select Leave Type
   - Choose Start Date and End Date
   - Enter Reason
   - Click "Submit Request"
4. **View History:**
   - Check request history table
   - Verify new request appears with "pending" status

---

## 📊 API ENDPOINTS AVAILABLE

### Attendance
```
POST   /api/attendance/clock-in
POST   /api/attendance/clock-out
GET    /api/attendance/today?employeeId=1
GET    /api/attendance/history?employeeId=1&startDate=2026-04-01&endDate=2026-05-12
```

### Shifts
```
GET    /api/shifts
POST   /api/shifts
PUT    /api/shifts/:id
DELETE /api/shifts/:id
GET    /api/employees/:id/shift
POST   /api/shifts/assign
GET    /api/shifts/assignments
DELETE /api/shifts/assignments/:id
```

### Leave
```
GET    /api/leave/types
GET    /api/leave/balances?employeeId=1&year=2026
GET    /api/leave/requests?employeeId=1
GET    /api/leave/requests/:id
POST   /api/leave/requests
PUT    /api/leave/requests/:id/approve
PUT    /api/leave/requests/:id/reject
PUT    /api/leave/requests/:id/cancel
GET    /api/holidays?year=2026
```

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**Problem:** Database connection error
```
Solution:
1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Test connection: psql -U postgres -d cv_screening
```

**Problem:** Port already in use
```
Solution:
1. Change PORT in .env to different port (e.g., 8082)
2. Update frontend VITE_API_BASE_URL accordingly
```

**Problem:** Routes not found (404)
```
Solution:
1. Verify backend is running
2. Check routes are registered in main.go
3. Ensure authentication token is valid
```

### Frontend Issues

**Problem:** API calls failing (CORS error)
```
Solution:
1. Check ALLOWED_ORIGINS in backend .env
2. Add your frontend URL: http://localhost:5173
3. Restart backend
```

**Problem:** Pages not loading
```
Solution:
1. Check browser console for errors
2. Verify routes in config/routes.ts
3. Clear browser cache and reload
```

**Problem:** Authentication required
```
Solution:
1. Login first at /login
2. Use test credentials (check seed_users.sql)
3. Token is stored in localStorage
```

---

## 📝 DEFAULT TEST DATA

### Test Users (from seed_users.sql and test_setup.go)
```
Admin:
- Email: admin@recruitai.com
- Password: password123

HR:
- Email: hr@recruitai.com
- Password: password123

Hiring Manager:
- Email: manager@recruitai.com
- Password: password123
```

### Test Employee ID
```
Use Employee ID = 1 for testing
(Hardcoded in frontend for MVP)
```

### Default Shifts (from schema seed)
1. Regular Day: 09:00 - 18:00
2. Morning Shift: 07:00 - 16:00
3. Afternoon Shift: 14:00 - 23:00

### Default Leave Types (from schema seed)
1. Annual Leave: 12 days/year
2. Sick Leave: 14 days/year
3. Maternity Leave: 90 days
4. Unpaid Leave: 30 days
5. Marriage Leave: 3 days

---

## ✨ NEXT STEPS

### Immediate Testing
1. ✅ Backend compiled successfully
2. ⏳ Test all API endpoints with Postman/Thunder Client
3. ⏳ Test frontend pages in browser
4. ⏳ Test end-to-end flows
5. ⏳ Fix any bugs found

### Future Enhancements
- [ ] Add photo upload for clock in/out
- [ ] Add calendar view for leaves
- [ ] Add attendance reports
- [ ] Add email notifications
- [ ] Add mobile app support
- [ ] Add biometric authentication
- [ ] Add geofencing for clock in/out

---

## 📞 NEED HELP?

### Check Logs
**Backend logs:**
```bash
# In sservice_cvsreening directory
tail -f backend.log
```

**Frontend logs:**
```
Open browser DevTools (F12)
Check Console tab for errors
Check Network tab for API calls
```

### Common Issues
1. **"Database not connected"** → Check PostgreSQL service
2. **"JWT token invalid"** → Login again
3. **"Employee not found"** → Check employee ID exists
4. **"Insufficient balance"** → Check leave balance before requesting

---

## 🎉 SUCCESS CRITERIA

Your implementation is working correctly if:

✅ Backend compiles without errors  
✅ Backend health check returns `{"status":"service up","database":true}`  
✅ Frontend loads without console errors  
✅ Can login successfully  
✅ Can clock in/out  
✅ Can view attendance history  
✅ Can create shifts (admin)  
✅ Can assign shifts (admin)  
✅ Can view leave balances  
✅ Can submit leave requests  
✅ Can view leave history  

---

**Implementation Date:** May 12, 2026  
**Status:** ✅ READY FOR TESTING  
**Version:** 1.0.0  
**Developer:** AI Assistant (Kiro)

**Happy Testing! 🚀**
