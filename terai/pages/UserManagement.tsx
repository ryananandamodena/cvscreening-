import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Filter, Edit, Trash2, Shield, UserCheck, UserX,
    Loader2, Check, X, AlertCircle, ChevronDown, FileUp
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { exportService } from '../services/export.service';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

interface User {
    id: number;
    email: string;
    fullName: string;
    role: string;
    department: string;
    isActive: boolean;
    createdAt: string;
}

const UserManagement = () => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        department: '',
        role: 'recruiter'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await apiService.getUsers();
            setUsers(data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            addToast('error', t('userMgmt.loadFailed') || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'fullName', label: t('userMgmt.fullName') },
            { key: 'email', label: t('common.email') },
            { key: 'role', label: t('userMgmt.role') },
            { key: 'department', label: t('jobs.department') },
            { key: 'isActive', label: t('common.status'), formatter: (v: any) => v ? t('common.active') : t('common.inactive') },
            { key: 'createdAt', label: t('userMgmt.joined'), formatter: (v: any) => v ? new Date(v).toLocaleDateString() : '' },
        ];
        exportService.exportToCSV(users, columns, 'user-directory-export');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (editingUser) {
                // Update existing user
                await apiService.updateUser(editingUser.id, {
                    fullName: formData.fullName,
                    department: formData.department,
                    role: formData.role,
                    password: formData.password || undefined // Only send if provided
                });
                addToast('success', t('userMgmt.saveSuccess') || 'User updated successfully');
            } else {
                // Create new user
                await apiService.createUser(formData);
                addToast('success', t('userMgmt.saveSuccess') || 'User created successfully');
            }
            await fetchUsers();
            closeModal();
        } catch (err: any) {
            addToast('error', err.message || t('userMgmt.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        setUserToDelete(user);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        try {
            await apiService.deleteUser(userToDelete.id);
            await fetchUsers();
            addToast('success', t('userMgmt.deleteSuccess') || 'User deleted successfully');
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        } catch (err: any) {
            addToast('error', err.message || 'Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await apiService.toggleUserStatus(userId, !currentStatus);
            await fetchUsers();
            addToast('success', currentStatus
                ? (t('userMgmt.deactivated') || 'User deactivated')
                : (t('userMgmt.activated') || 'User activated')
            );
        } catch (err: any) {
            addToast('error', err.message || t('userMgmt.statusUpdateFailed'));
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '', // Don't pre-fill password
            fullName: user.fullName,
            department: user.department,
            role: user.role
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            password: '',
            fullName: '',
            department: '',
            role: 'recruiter'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setError(null);
        setFormData({
            email: '',
            password: '',
            fullName: '',
            department: '',
            role: 'recruiter'
        });
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'hiring_manager':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            default:
                return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">{t('userMgmt.loading')}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('userMgmt.title')}</h1>
                    <p className="text-slate-500 font-medium mt-2">{t('userMgmt.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="px-6 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <FileUp size={20} />
                        {t('userMgmt.exportCsv')}
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        {t('userMgmt.addNew')}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('userMgmt.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="appearance-none px-6 py-3 pr-10 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl text-sm font-bold cursor-pointer transition-all outline-none"
                    >
                        <option value="all">{t('userMgmt.allRoles')}</option>
                        <option value="admin">{t('userMgmt.admin')}</option>
                        <option value="recruiter">{t('userMgmt.recruiter')}</option>
                        <option value="hiring_manager">{t('userMgmt.hiringManager')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('userMgmt.totalUsers')}</p>
                            <p className="text-2xl font-black text-slate-900">{users.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.active')}</p>
                            <p className="text-2xl font-black text-slate-900">{users.filter(u => u.isActive).length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <Shield size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('userMgmt.admins')}</p>
                            <p className="text-2xl font-black text-slate-900">{users.filter(u => u.role === 'admin').length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <UserX size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.inactive')}</p>
                            <p className="text-2xl font-black text-slate-900">{users.filter(u => !u.isActive).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('userMgmt.user')}</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('userMgmt.role')}</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('jobs.department')}</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('userMgmt.joined')}</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <Users className="mx-auto text-slate-200" size={48} />
                                    <p className="mt-4 font-black text-slate-400 uppercase tracking-widest text-xs">{t('userMgmt.noUsers')}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/20">
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.fullName}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeStyle(user.role)}`}>
                                            {user.role === 'admin' && <Shield size={12} />}
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                        {user.department || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${user.isActive
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                        >
                                            {user.isActive ? <Check size={12} /> : <X size={12} />}
                                            {user.isActive ? t('common.active') : t('common.inactive')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
                                                title={t('userMgmt.editTooltip') || "Edit User"}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                                title={t('userMgmt.deleteTooltip') || "Delete User"}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                {editingUser ? t('userMgmt.editUser') : t('userMgmt.createUser')}
                            </h2>
                            <p className="text-slate-500 text-sm mb-8">
                                {editingUser ? t('userMgmt.editUserSub') : t('userMgmt.createUserSub')}
                            </p>

                            {error && (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                                    <AlertCircle size={20} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('userMgmt.fullName')} *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="John Smith"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('userMgmt.emailAddress')} *</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!editingUser}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@company.com"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        {t('userMgmt.password')} {editingUser ? t('userMgmt.passwordHint') : '*'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('userMgmt.role')} *</label>
                                        <select
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="recruiter">{t('userMgmt.recruiter')}</option>
                                            <option value="hiring_manager">{t('userMgmt.hiringManager')}</option>
                                            <option value="admin">{t('userMgmt.admin')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('jobs.department')}</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder={t('userMgmt.departmentPlaceholder') || "Engineering"}
                                            className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                                        {saving ? t('common.saving') : editingUser ? t('userMgmt.updateUser') : t('userMgmt.createUser')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && userToDelete && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="size-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                {t('userMgmt.deleteConfirmTitle')}
                            </h2>
                            <p className="text-slate-500 mb-8">
                                {t('userMgmt.deleteConfirmMessage', { name: userToDelete.fullName })}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setUserToDelete(null);
                                    }}
                                    disabled={deleting}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {deleting ? t('common.deleting') : t('common.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
