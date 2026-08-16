import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';
import { extractFaceDescriptor, faceRecognitionService, FaceModelLoadError } from '../../services/faceRecognition.service';

interface FaceEnrollmentModalProps {
  onClose: () => void;
  onEnrolled: () => void;
}

// Standalone face-enrollment flow, independent of clock-in — Module 15 §U/S2's "Face Not
// Enrolled" status needs its own explicit "Enroll Face" action, not just an implicit side effect
// of a first clock-in. No GPS/geofencing is required here; this only captures+extracts+saves a
// reference face descriptor, the same one clockInHandler later verifies against.
const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({ onClose, onEnrolled }) => {
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceStatus, setFaceStatus] = useState<'idle' | 'checking' | 'detected' | 'not_detected' | 'model_load_failed'>('idle');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setCameraError('Tidak bisa mengakses kamera. Izinkan akses kamera di browser Anda.'));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
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
      setFaceStatus(err instanceof FaceModelLoadError ? 'model_load_failed' : 'not_detected');
    }
  };

  const retake = () => {
    setPhoto(null);
    setFaceDescriptor(null);
    setFaceStatus('idle');
  };

  const handleSave = async () => {
    if (!faceDescriptor) return;
    setSaving(true);
    try {
      await faceRecognitionService.enroll(faceDescriptor);
      showToast('success', 'Wajah berhasil didaftarkan sebagai referensi verifikasi absensi');
      onEnrolled();
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal mendaftarkan wajah');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md card max-h-[92vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera size={18} /> Daftarkan Wajah
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Foto ini akan menjadi referensi untuk verifikasi wajah setiap kali Anda clock-in. Anda dapat mendaftar ulang kapan saja dari halaman ini.
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

          <div className="flex justify-end">
            {photo ? (
              <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={retake}>Ambil Ulang</Button>
            ) : (
              <Button variant="primary" size="sm" icon={<Camera size={14} />} onClick={capturePhoto} disabled={!!cameraError}>Ambil Foto</Button>
            )}
          </div>

          {photo && (
            <div className={`flex items-center gap-2 text-sm font-semibold p-2.5 rounded-lg ${
              faceStatus === 'detected' ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-500'
              : faceStatus === 'checking' ? 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400'
              : 'bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-500'
            }`}>
              {faceStatus === 'checking' ? (
                <><Loader2 className="animate-spin" size={16} /> Memeriksa wajah...</>
              ) : faceStatus === 'detected' ? (
                <><CheckCircle2 size={16} /> Wajah terdeteksi, siap didaftarkan</>
              ) : faceStatus === 'model_load_failed' ? (
                <><AlertCircle size={16} /> Gagal memuat model deteksi wajah — periksa koneksi internet Anda, lalu coba ambil ulang foto</>
              ) : (
                <><AlertCircle size={16} /> Wajah tidak terdeteksi, silakan ambil ulang foto</>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={faceStatus !== 'detected' || saving} loading={saving}>
              Daftarkan Wajah
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollmentModal;
