import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Camera, MapPin, RefreshCw, CheckCircle2, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { attendanceService } from '../../services/attendance.service';
import { useAuth } from '../../guards/AuthGuard';
import { useToast } from '../../contexts/ToastContext';
import { extractFaceDescriptor, faceRecognitionService, FaceModelLoadError, loadFaceModels } from '../../services/faceRecognition.service';

// Backend gate for PUT /attendance/office-location is HROrAdmin() (routes_attendance.go) —
// 'admin'/'hr'/'hr_admin'/'hr_manager'. Previously this list was ['admin', 'recruiter'], mirroring
// a since-fixed backend bug where the route was mistakenly gated by RecruiterOrAdmin(): a
// recruiter (who has no real business reason to move the office geofencing point) could see this
// button while genuine HR roles couldn't. Keep this in sync with HROrAdmin()'s role list.
const HR_ROLES = ['admin', 'hr', 'hr_admin', 'hr_manager'];

const MapView = React.lazy(async () => {
  const [{ MapContainer, TileLayer, Marker, Circle }, L] = await Promise.all([
    import('react-leaflet'),
    import('leaflet'),
  ]);
  await import('leaflet/dist/leaflet.css');

  const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const MapPanel = ({ coords, office }: { coords: { lat: number; lng: number }; office: { latitude: number; longitude: number; radiusMeters: number } }) => (
    <div className="h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800">
      <MapContainer center={[coords.lat, coords.lng]} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
        <Circle center={[office.latitude, office.longitude]} radius={office.radiusMeters} pathOptions={{ color: '#dc2626', fillOpacity: 0.1 }} />
      </MapContainer>
    </div>
  );

  return { default: MapPanel };
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ClockInModalProps {
  mode: 'in' | 'out';
  onClose: () => void;
  onSuccess: () => void;
}

const ClockInModal: React.FC<ClockInModalProps> = ({ mode, onClose, onSuccess }) => {
  const { role } = useAuth();
  const { showToast } = useToast();
  const isHR = !!role && HR_ROLES.includes(role.toLowerCase());
  const [settingOffice, setSettingOffice] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceStatus, setFaceStatus] = useState<'idle' | 'checking' | 'detected' | 'not_detected' | 'model_load_failed'>('idle');
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);

  const [locationError, setLocationError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);

  const [office, setOffice] = useState<{ latitude: number; longitude: number; radiusMeters: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start camera
  useEffect(() => {
    let active = true;
    // Preload face-api.js's model weights alongside the camera permission prompt so they're
    // already warm by the time the user captures a photo — previously this only started inside
    // extractFaceDescriptor() at capture time, adding several seconds of "stuck" wait exactly
    // when the user expects an instant result.
    loadFaceModels().catch(() => {
      // Swallowed — extractFaceDescriptor() surfaces the same failure as FaceModelLoadError
      // at capture time, where there's already a real error state for it.
    });
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setCameraError('Tidak bisa mengakses kamera. Izinkan akses kamera di browser Anda.'));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Get live GPS location
  const requestLocation = () => {
    setLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung GPS.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Tidak bisa mengambil lokasi GPS. Izinkan akses lokasi di browser Anda.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    requestLocation();
    attendanceService.getOfficeLocation().then(setOffice).catch(() => setOffice(null));
    faceRecognitionService.getEnrollmentStatus().then((res) => setFaceEnrolled(res.enrolled)).catch(() => setFaceEnrolled(null));
  }, []);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.8));

    setFaceStatus('checking');
    try {
      const descriptor = await extractFaceDescriptor(canvas);
      if (descriptor) {
        setFaceDescriptor(descriptor);
        setFaceStatus('detected');
      } else {
        setFaceDescriptor(null);
        setFaceStatus('not_detected');
      }
    } catch (err) {
      setFaceDescriptor(null);
      // A failed model download (no network / CDN blocked) is a distinct failure from "no face
      // in this frame" — must show as a real error state, never silently behave as if
      // verification passed (Module 14 audit, S8/S9). Either way faceStatus stays outside
      // 'detected', so canSubmit still correctly blocks clock-in submission.
      setFaceStatus(err instanceof FaceModelLoadError ? 'model_load_failed' : 'not_detected');
    }
  };

  const retake = () => {
    setPhoto(null);
    setFaceDescriptor(null);
    setFaceStatus('idle');
  };

  const distance = coords && office ? haversineDistance(office.latitude, office.longitude, coords.lat, coords.lng) : null;
  const withinRange = distance !== null && office ? distance <= office.radiusMeters : null;

  const canSubmit = !!photo && !!coords && withinRange === true && !submitting &&
    (mode === 'out' || faceStatus === 'detected');

  const handleSetOfficeHere = async () => {
    if (!coords) return;
    setSettingOffice(true);
    try {
      await attendanceService.updateOfficeLocation({ latitude: coords.lat, longitude: coords.lng, radiusMeters: office?.radiusMeters || 100 });
      const updated = await attendanceService.getOfficeLocation();
      setOffice(updated);
      showToast('success', 'Lokasi kantor berhasil diperbarui ke posisi Anda saat ini');
    } catch (err) {
      showToast('error', (err as any).message || 'Gagal memperbarui lokasi kantor');
    } finally {
      setSettingOffice(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !coords) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        employeeId: 1, // placeholder — backend always resolves the real employeeId from the logged-in user's JWT
        location: { lat: coords.lat, lng: coords.lng },
        photo,
        latitude: coords.lat,
        longitude: coords.lng,
      };
      if (mode === 'in') {
        if (!faceEnrolled && faceDescriptor) {
          try {
            await faceRecognitionService.enroll(faceDescriptor);
            setFaceEnrolled(true);
          } catch {
            // enrollment is best-effort; proceed with clock-in regardless
          }
        }
        await attendanceService.clockIn({ ...payload, faceDescriptor: faceDescriptor || undefined });
      } else {
        await attendanceService.clockOut({ ...payload, notes: 'End of shift' });
      }
      onSuccess();
    } catch (err) {
      setError((err as any).message || 'Gagal mencatat kehadiran');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg card max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'in' ? 'Clock In' : 'Clock Out'} — Verifikasi Lokasi & Foto
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Camera */}
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Camera size={14} /> Foto Live
            </p>
            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-danger-400 text-sm">
                  <AlertCircle className="mr-2 shrink-0" size={18} /> {cameraError}
                </div>
              ) : photo ? (
                <img src={photo} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    // The <video> element unmounts/remounts every time `photo` toggles (it's
                    // swapped for an <img> after capture, then swapped back on "Ambil Ulang").
                    // Attaching the stream only once in the mount-time effect left every
                    // re-mounted video element with no srcObject at all — a black frame that
                    // then got "captured" as the next photo. Re-attaching here, on every mount
                    // of this exact element, fixes retake without needing a whole new
                    // getUserMedia() call each time.
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-2 flex justify-end">
              {photo ? (
                <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={retake}>Ambil Ulang</Button>
              ) : (
                <Button variant="primary" size="sm" icon={<Camera size={14} />} onClick={capturePhoto} disabled={!!cameraError}>Ambil Foto</Button>
              )}
            </div>
            {mode === 'in' && photo && (
              <div className={`mt-2 flex items-center gap-2 text-sm font-semibold p-2.5 rounded-lg ${
                faceStatus === 'detected' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500'
                : faceStatus === 'checking' ? 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400'
                : 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500'
              }`}>
                {faceStatus === 'checking' ? (
                  <><Loader2 className="animate-spin" size={16} /> Memverifikasi wajah...</>
                ) : faceStatus === 'detected' ? (
                  <><CheckCircle2 size={16} /> Wajah terdeteksi {faceEnrolled === false ? '— akan didaftarkan sebagai referensi' : ''}</>
                ) : faceStatus === 'model_load_failed' ? (
                  <><AlertCircle size={16} /> Gagal memuat model deteksi wajah — periksa koneksi internet Anda, lalu coba ambil ulang foto</>
                ) : (
                  <><AlertCircle size={16} /> Wajah tidak terdeteksi, silakan ambil ulang foto</>
                )}
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin size={14} /> Lokasi GPS
            </p>
            {locating ? (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 p-4">
                <Loader2 className="animate-spin" size={16} /> Mengambil lokasi...
              </div>
            ) : locationError ? (
              <div className="p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg flex items-center justify-between gap-3">
                <span className="text-sm text-danger-700 dark:text-danger-400">{locationError}</span>
                <Button variant="outline" size="sm" onClick={requestLocation}>Coba Lagi</Button>
              </div>
            ) : coords && office ? (
              <>
                <Suspense fallback={<div className="h-48 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-sm text-slate-500">Memuat peta...</div>}>
                  <MapView coords={coords} office={office} />
                </Suspense>
                <div className={`mt-2 flex items-center gap-2 text-sm font-semibold p-2.5 rounded-lg ${withinRange ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500' : 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500'}`}>
                  {withinRange ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {withinRange
                    ? `Anda berada di area kantor (${Math.round(distance!)}m dari pusat kantor)`
                    : `Anda berada di luar area kantor (${Math.round(distance!)}m, maks ${office.radiusMeters}m)`}
                </div>
                {isHR && !withinRange && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    icon={<Building2 size={14} />}
                    loading={settingOffice}
                    onClick={handleSetOfficeHere}
                  >
                    Jadikan Lokasi Ini sebagai Kantor
                  </Button>
                )}
              </>
            ) : null}
          </div>

          {error && (
            <div className="p-3 bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-500/20 rounded-lg text-sm text-danger-700 dark:text-danger-400">
              {error}
            </div>
          )}

          <Button
            variant={mode === 'in' ? 'primary' : 'danger'}
            size="lg"
            className="w-full justify-center"
            disabled={!canSubmit}
            loading={submitting}
            onClick={handleSubmit}
          >
            {mode === 'in' ? 'Konfirmasi Clock In' : 'Konfirmasi Clock Out'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClockInModal;
