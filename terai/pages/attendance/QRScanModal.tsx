import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, AlertCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';

interface QRScanModalProps {
  mode: 'in' | 'out';
  onClose: () => void;
  onSuccess: () => void;
}

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

const QRScanModal: React.FC<QRScanModalProps> = ({ mode, onClose, onSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (stopped || processing) return;
          stopped = true;
          setProcessing(true);
          try {
            await scanner.stop();
          } catch {
            // ignore stop errors
          }
          try {
            if (mode === 'in') {
              await attendanceService.clockIn({ employeeId: 1, qrToken: decodedText });
            } else {
              await attendanceService.clockOut({ employeeId: 1, qrToken: decodedText, notes: 'Clock out via QR kiosk' });
            }
            onSuccess();
          } catch (err) {
            setError((err as any).message || 'Gagal memproses QR code');
            stopped = false;
            setProcessing(false);
          }
        },
        () => {
          // per-frame decode failures are expected while aiming the camera; ignore
        }
      )
      .catch(() => setError('Tidak bisa mengakses kamera. Izinkan akses kamera di browser Anda.'));

    return () => {
      stopped = true;
      scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode size={20} /> Scan QR Kiosk — {mode === 'in' ? 'Clock In' : 'Clock Out'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div id={SCANNER_ELEMENT_ID} className="rounded-xl overflow-hidden bg-slate-900 min-h-[260px]" />
          {error && (
            <div className="p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg flex items-center gap-2 text-sm text-danger-700 dark:text-danger-400">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}
          {processing && <p className="text-sm text-center text-slate-500 dark:text-slate-400">Memproses...</p>}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Arahkan kamera ke QR code yang tampil di layar kiosk kantor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanModal;
