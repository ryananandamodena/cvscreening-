import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import { qrAttendanceService } from '../../services/qrAttendance.service';

const AttendanceKiosk: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(30);
  const countdownRef = useRef<number | null>(null);

  const refreshToken = async () => {
    try {
      const res = await qrAttendanceService.getToken();
      setToken(res.token);
      setExpiresIn(res.expiresInSeconds);
    } catch {
      setToken(null);
    }
  };

  useEffect(() => {
    refreshToken();
    const refreshTimer = setInterval(refreshToken, 25000);
    countdownRef.current = window.setInterval(() => {
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(refreshTimer);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 justify-center">
          <QrCode className="text-brand-500" size={32} /> Attendance Kiosk
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
          Scan kode QR ini dengan aplikasi untuk clock in / clock out.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
        {token ? (
          <QRCodeSVG value={token} size={280} level="M" />
        ) : (
          <div className="w-[280px] h-[280px] flex items-center justify-center text-slate-400">Memuat...</div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Kode diperbarui otomatis dalam <span className="text-brand-600 dark:text-brand-400 font-bold">{expiresIn}s</span>
        </p>
      </div>
    </div>
  );
};

export default AttendanceKiosk;
