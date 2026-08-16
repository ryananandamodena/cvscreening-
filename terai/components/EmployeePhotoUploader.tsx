import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface EmployeePhotoUploaderProps {
  photoUrl?: string;
  fallbackInitial: string;
  canEdit: boolean;
  onUpload: (file: File) => Promise<{ photoUrl: string }>;
  onDelete: () => Promise<unknown>;
  onChanged: (newPhotoUrl: string | null) => void;
  sizeClassName?: string;
}

// Shared upload/preview/delete control for employee profile photos — used by both the admin
// Employee Management detail page and the self-service Employee Portal/Settings, so upload
// UX (validation, loading, error/retry, cache-busting) stays consistent in one place rather
// than duplicated per page (Module 15).
const EmployeePhotoUploader: React.FC<EmployeePhotoUploaderProps> = ({
  photoUrl,
  fallbackInitial,
  canEdit,
  onUpload,
  onDelete,
  onChanged,
  sizeClassName = 'w-32 h-32',
}) => {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cacheBust, setCacheBust] = useState(() => Date.now());

  const validateClientSide = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Format tidak didukung — gunakan JPEG, PNG, atau WebP';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Ukuran file maksimum ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    // Client-side check is just for fast feedback — the backend re-validates the real file
    // bytes (magic-byte sniffing, dimension check) regardless; this is not the security boundary.
    const clientError = validateClientSide(file);
    if (clientError) {
      showToast('error', clientError);
      return;
    }

    setUploading(true);
    try {
      const result = await onUpload(file);
      setCacheBust(Date.now());
      onChanged(result.photoUrl);
      showToast('success', 'Foto profil berhasil diperbarui');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Hapus foto profil ini?')) return;
    setUploading(true);
    try {
      await onDelete();
      onChanged(null);
      showToast('success', 'Foto profil dihapus');
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal menghapus foto');
    } finally {
      setUploading(false);
    }
  };

  // Cache-busting query param so the browser doesn't keep showing a stale cached image at the
  // same URL path after a replace (Module 15 §M) — appended only right after a change, not on
  // every render.
  const displayUrl = photoUrl ? `${photoUrl}?v=${cacheBust}` : undefined;

  return (
    <div className={`relative ${sizeClassName} shrink-0 group`}>
      <div className="w-full h-full rounded-2xl bg-white dark:bg-[#000000] border-4 border-white dark:border-neutral-900 shadow-2xl overflow-hidden flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
        {uploading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-neutral-800">
            <Loader2 className="animate-spin text-brand-600" size={28} />
          </div>
        ) : displayUrl ? (
          <img src={displayUrl} alt={fallbackInitial} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-5xl font-black text-white">
            {fallbackInitial}
          </div>
        )}
      </div>

      {canEdit && !uploading && (
        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            title="Ubah foto"
            onClick={() => inputRef.current?.click()}
            className="p-2 rounded-full bg-white/90 text-slate-800 hover:bg-white"
          >
            <Camera size={16} />
          </button>
          {photoUrl && (
            <button type="button" title="Hapus foto" onClick={handleDelete} className="p-2 rounded-full bg-white/90 text-danger-600 hover:bg-white">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {canEdit && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
};

export default EmployeePhotoUploader;
