import React, { useState, useCallback } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmationHookReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmationDialogComponent: React.FC;
}

export const useConfirmation = (): ConfirmationHookReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(confirmOptions);
      setIsOpen(true);
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(true);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
  }, [resolvePromise]);

  const ConfirmationDialogComponent = useCallback(() => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={options?.title || ''}
      message={options?.message || ''}
      confirmText={options?.confirmText}
      cancelText={options?.cancelText}
      type={options?.type}
    />
  ), [isOpen, handleCancel, handleConfirm, options]);

  return { confirm, ConfirmationDialogComponent };
};

// Utility functions for common confirmations
export const confirmDelete = (itemName: string) =>
  ({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus ${itemName}? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Hapus',
    cancelText: 'Batal',
    type: 'danger' as const
  });

export const confirmGenerate = (itemName: string) =>
  ({
    title: 'Konfirmasi Generate',
    message: `Apakah Anda yakin ingin generate ${itemName}? Proses ini mungkin memakan waktu.`,
    confirmText: 'Generate',
    cancelText: 'Batal',
    type: 'warning' as const
  });

export const confirmReset = (itemName: string) =>
  ({
    title: 'Konfirmasi Reset',
    message: `Apakah Anda yakin ingin reset ${itemName}? Semua perubahan akan hilang.`,
    confirmText: 'Reset',
    cancelText: 'Batal',
    type: 'warning' as const
  });