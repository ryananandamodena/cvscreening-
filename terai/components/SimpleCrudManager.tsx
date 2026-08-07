import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import Button from './ui/Button';

export interface SimpleCrudField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
}

interface SimpleCrudManagerProps<T extends { id: number }> {
  title: string;
  fields: SimpleCrudField[];
  fetchItems: () => Promise<T[]>;
  createItem: (data: Record<string, any>) => Promise<any>;
  deleteItem: (id: number) => Promise<any>;
  renderTitle: (item: T) => string;
  renderSubtitle: (item: T) => string;
  renderValue?: (item: T) => string;
  emptyLabel?: string;
  active: boolean; // only fetch when the containing tab/sub-tab is visible
}

/**
 * Generic create/list/deactivate manager for simple flat entities (name + a few
 * scalar fields). Used for Allowances, Flexible Benefits, Retirement Plans, and
 * similar catalog-style records where a bespoke form isn't worth the duplication.
 * Not suited for entities with nested child collections (e.g. Career Path
 * milestones, Leadership Program modules) — those need dedicated UI.
 */
function SimpleCrudManager<T extends { id: number }>({
  title, fields, fetchItems, createItem, deleteItem,
  renderTitle, renderSubtitle, renderValue, emptyLabel, active,
}: SimpleCrudManagerProps<T>) {
  const { addToast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialForm = () => Object.fromEntries(fields.map(f => [f.key, f.defaultValue ?? (f.type === 'number' ? 0 : '')]));
  const [form, setForm] = useState<Record<string, any>>(initialForm());

  useEffect(() => {
    if (active) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await fetchItems());
    } catch (err) {
      console.error(`Failed to fetch ${title}:`, err);
      addToast('error', `Gagal memuat ${title}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const nameField = fields.find(f => f.key === 'name');
    if (nameField && !String(form.name || '').trim()) {
      addToast('error', 'Nama wajib diisi');
      return;
    }
    try {
      setSaving(true);
      await createItem(form);
      addToast('success', `${title} berhasil dibuat`);
      setForm(initialForm());
      load();
    } catch (err) {
      console.error(`Failed to create ${title}:`, err);
      addToast('error', `Gagal membuat ${title}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: T) => {
    if (!window.confirm(`Nonaktifkan "${renderTitle(item)}"?`)) return;
    try {
      await deleteItem(item.id);
      addToast('success', `${title} dinonaktifkan`);
      load();
    } catch (err) {
      console.error(`Failed to delete ${title}:`, err);
      addToast('error', `Gagal menonaktifkan ${title}`);
    }
  };

  return (
    <>
      <div className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tambah {title} Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {fields.map(f => (
            f.type === 'select' ? (
              <select
                key={f.key}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
              >
                {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                key={f.key}
                type={f.type}
                placeholder={f.label}
                value={form[f.key] ?? ''}
                onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                className="px-3 py-2 border border-slate-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white rounded-lg text-sm"
              />
            )
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
          <Plus size={14} className="mr-2" /> {saving ? 'Menyimpan...' : `Simpan ${title}`}
        </Button>
      </div>

      <div className="space-y-3 mt-4">
        {loading ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-600 dark:text-slate-400">{emptyLabel || `Belum ada ${title.toLowerCase()}.`}</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{renderTitle(item)}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{renderSubtitle(item)}</p>
              </div>
              <div className="flex items-center gap-3">
                {renderValue && <span className="text-sm font-bold text-slate-900 dark:text-white">{renderValue(item)}</span>}
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors"
                  title="Nonaktifkan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default SimpleCrudManager;
