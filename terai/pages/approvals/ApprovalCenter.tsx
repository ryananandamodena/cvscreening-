import React, { useState } from 'react';
import { ShieldCheck, ClipboardList, Inbox, Settings2 } from 'lucide-react';
import { useAuth } from '../../guards/AuthGuard';
import MyApprovalRequests from './MyApprovalRequests';
import PendingApprovals from './PendingApprovals';
import ApprovalFlowConfig from './ApprovalFlowConfig';
import SubmitOvertimeRequest from './SubmitOvertimeRequest';
import CorrectionApprovals from '../attendance/CorrectionApprovals';

const HR_ROLES = ['admin', 'hr', 'hr_admin', 'hr_manager'];

const ApprovalCenter: React.FC = () => {
  const { role } = useAuth();
  const isHR = !!role && HR_ROLES.includes(role.toLowerCase());
  const [activeTab, setActiveTab] = useState<'mine' | 'pending' | 'config'>('mine');

  const tabs: Array<{ key: 'mine' | 'pending' | 'config'; label: string; icon: typeof ClipboardList }> = [
    { key: 'mine', label: 'Pengajuan Saya', icon: ClipboardList },
    { key: 'pending', label: 'Menunggu Persetujuan Saya', icon: Inbox },
    ...(isHR ? [{ key: 'config' as const, label: 'Konfigurasi Approval Flow', icon: Settings2 }] : []),
  ];

  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-8 duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="text-brand-500" size={32} />
          Approval Center
        </h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
          Kelola semua pengajuan persetujuan Anda dalam satu tempat.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === key ? 'bg-white dark:bg-neutral-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'mine' && (
        <div className="space-y-6">
          <SubmitOvertimeRequest />
          <MyApprovalRequests />
        </div>
      )}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <PendingApprovals />
          <CorrectionApprovals scope="manager" />
          {isHR && <CorrectionApprovals scope="hr" />}
        </div>
      )}
      {activeTab === 'config' && isHR && <ApprovalFlowConfig />}
    </div>
  );
};

export default ApprovalCenter;
