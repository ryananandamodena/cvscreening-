import React, { useState, useEffect } from 'react';
import { Network, Users, User, ArrowDown, Building2, TrendingUp, Filter } from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import { Department } from '../../types';
import Button from '../../components/ui/Button';

// Mock structure for the Org Chart Phase 1 visualization
const MOCK_ORG_DATA = {
  id: 'ceo',
  name: 'Eleanor Vance',
  role: 'Chief Executive Officer',
  department: 'Executive',
  avatar: 'E',
  children: [
    {
      id: 'cto',
      name: 'Dr. John Richards',
      role: 'Chief Technology Officer',
      department: 'Engineering',
      avatar: 'J',
      children: [
        { id: 'vp_eng', name: 'Alicia Keys', role: 'VP of Engineering', department: 'Engineering', avatar: 'A' },
        { id: 'vp_prod', name: 'Marcus Cole', role: 'VP of Product', department: 'Product', avatar: 'M' }
      ]
    },
    {
      id: 'cfo',
      name: 'Samantha Lee',
      role: 'Chief Financial Officer',
      department: 'Finance',
      avatar: 'S',
      children: [
        { id: 'vp_fin', name: 'Robert Fox', role: 'VP of Finance', department: 'Finance', avatar: 'R' }
      ]
    },
    {
      id: 'chro',
      name: 'Diana Prince',
      role: 'Chief HR Officer',
      department: 'Human Resources',
      avatar: 'D',
      children: [
        { id: 'vp_rec', name: 'Clark Kent', role: 'VP of Talent', department: 'Human Resources', avatar: 'C' }
      ]
    }
  ]
};

const OrgNode = ({ node, isRoot = false }: { node: any, isRoot?: boolean }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Connector line from parent */}
      {!isRoot && <div className="w-px h-6 bg-slate-300 dark:bg-neutral-700"></div>}

      {/* Node Card */}
      <div
        className={`relative group bg-white dark:bg-[#111111] border ${isRoot ? 'border-brand-500 shadow-brand-500/20' : 'border-slate-300 dark:border-neutral-700'} rounded-2xl p-4 w-60 shadow-sm transition-all hover:border-brand-400`}
      >
        <div className="flex flex-col items-center text-center">
           <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mb-3 ${isRoot ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors'}`}>
             {node.avatar}
           </div>
           <h3 className="text-sm font-bold text-slate-900 dark:text-white">{node.name}</h3>
           <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{node.role}</p>
           <p className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300">{node.department}</p>
        </div>

        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
             className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-100 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-full flex items-center justify-center hover:bg-brand-600 hover:border-brand-500 hover:text-white transition-all text-slate-600 dark:text-slate-400 z-10"
          >
            <ArrowDown size={14} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Children branches */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-slate-300 dark:bg-neutral-700"></div>
          {/* Horizontal line connecting siblings (only draw if >1 child) */}
          {node.children.length > 1 && (
             <div className="h-px bg-slate-300 dark:bg-neutral-700" style={{ width: `calc(100% - ${100 / node.children.length}%)` }}></div>
          )}
          <div className="flex justify-center gap-6 mt-0">
             {node.children.map((child: any) => (
               <OrgNode key={child.id} node={child} />
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC = () => {
  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Network className="text-brand-600 dark:text-brand-400" size={32} />
            Organization Hierarchy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Interactive visual map of company reporting structures and personnel.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
             <Filter size={18} /> Department Filter
          </Button>
          <Button variant="primary">
            Export Chart
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/50 dark:bg-[#111111] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><Users size={16}/> <span className="font-medium text-xs uppercase tracking-wider">Total Headcount</span></div>
           <p className="text-2xl font-black text-slate-900 dark:text-white">124</p>
        </div>
        <div className="bg-white/50 dark:bg-[#111111] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><Building2 size={16}/> <span className="font-medium text-xs uppercase tracking-wider">Departments</span></div>
           <p className="text-2xl font-black text-slate-900 dark:text-white">8</p>
        </div>
        <div className="bg-white/50 dark:bg-[#111111] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><User size={16}/> <span className="font-medium text-xs uppercase tracking-wider">Avg Direct Reports</span></div>
           <p className="text-2xl font-black text-slate-900 dark:text-white">4.2</p>
        </div>
        <div className="bg-white/50 dark:bg-[#111111] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
           <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><TrendingUp size={16}/> <span className="font-medium text-xs uppercase tracking-wider">Hierarchy Depth</span></div>
           <p className="text-2xl font-black text-slate-900 dark:text-white">4 Levels</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-8 overflow-auto min-h-[600px] flex justify-center">
        <div className="inline-block py-8 px-4">
           {/* Visual Hierarchy Render */}
           <OrgNode node={MOCK_ORG_DATA} isRoot={true} />
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
