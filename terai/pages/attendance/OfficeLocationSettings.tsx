import React, { useEffect, useState } from 'react';
import { Building2, Locate, AlertCircle } from 'lucide-react';
import { attendanceService } from '../../services/attendance.service';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

// Standalone HR/Admin settings page for the office geofencing center + radius that
// clockInHandler/clockOutHandler validate every employee's attendance against. Previously the
// only way to change this on web was the "Jadikan Lokasi Ini sebagai Kantor" button buried
// inside the Clock In modal — which only works if you're physically standing where you want
// the new center to be, and isn't discoverable as a settings page at all. This one lets HR type
// exact coordinates/radius from anywhere, mirroring mobile's office-location.tsx.
// Backend gate: HROrAdmin() on PUT /attendance/office-location (routes_attendance.go).
const OfficeLocationSettings: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    attendanceService
      .getOfficeLocation()
      .then((settings) => {
        setLatitude(String(settings.latitude ?? ''));
        setLongitude(String(settings.longitude ?? ''));
        setRadiusMeters(String(settings.radiusMeters ?? 100));
      })
      .catch(() => setError('Gagal memuat pengaturan lokasi kantor.'))
      .finally(() => setLoading(false));
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Browser tidak mendukung GPS.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        showToast('error', 'Tidak bisa mengambil lokasi GPS. Izinkan akses lokasi di browser Anda.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const save = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusMeters);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      showToast('error', 'Latitude harus berupa angka antara -90 dan 90.');
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      showToast('error', 'Longitude harus berupa angka antara -180 dan 180.');
      return;
    }
    if (Number.isNaN(radius) || radius <= 0) {
      showToast('error', 'Radius harus berupa angka positif (meter).');
      return;
    }

    setSaving(true);
    try {
      await attendanceService.updateOfficeLocation({ latitude: lat, longitude: lng, radiusMeters: radius });
      showToast('success', 'Lokasi kantor berhasil diperbarui. Karyawan akan diverifikasi terhadap lokasi ini saat clock in/out.');
    } catch (err: any) {
      const msg = /forbidden|403/i.test(err?.message || '')
        ? 'Anda tidak memiliki izin untuk mengubah lokasi kantor.'
        : 'Gagal menyimpan lokasi kantor. Silakan coba lagi.';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="text-brand-600" size={24} />
          Lokasi Kantor
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Titik pusat GPS dan radius yang harus dipenuhi karyawan untuk clock in/out (geofencing).
          Karyawan di luar radius ini akan ditolak dengan "geofencing_error" — kecuali mereka
          punya pengecualian aktif di halaman Remote Work Exemptions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-xl flex items-center gap-3 text-sm text-danger-700 dark:text-danger-400">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Memuat...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-6.1754"
                className="mt-1 w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="106.8272"
                className="mt-1 w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Radius (meter)</label>
              <input
                type="text"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                placeholder="100"
                className="mt-1 w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button variant="outline" size="sm" icon={<Locate size={14} />} loading={locating} onClick={useCurrentLocation} className="w-full">
              Gunakan Lokasi Saya Saat Ini
            </Button>

            <Button variant="primary" loading={saving} onClick={save} className="w-full justify-center">
              Simpan Lokasi Kantor
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OfficeLocationSettings;
