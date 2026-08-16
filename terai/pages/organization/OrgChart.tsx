import React, { useState, useEffect, useMemo } from 'react';
import { Network, Users, User, ArrowDown, Building2, TrendingUp } from 'lucide-react';
import { organizationService } from '../../services/organization.service';
import { Department } from '../../types';
import Button from '../../components/ui/Button';

interface DeptNode extends Department {
  children: DeptNode[];
}

function buildDeptTree(departments: Department[]): DeptNode[] {
  const nodesById = new Map<number, DeptNode>();
  departments.forEach((d) => nodesById.set(d.id, { ...d, children: [] }));

  const roots: DeptNode[] = [];
  nodesById.forEach((node) => {
    if (node.parentId && nodesById.has(node.parentId)) {
      nodesById.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function treeDepth(nodes: DeptNode[]): number {
  if (nodes.length === 0) return 0;
  return 1 + Math.max(...nodes.map((n) => treeDepth(n.children)));
}

const DeptOrgNode = ({ node, isRoot = false }: { node: DeptNode; isRoot?: boolean }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {!isRoot && <div className="w-px h-6 bg-slate-300 dark:bg-neutral-700"></div>}

      <div
        className={`relative group bg-white dark:bg-[#000000] border ${isRoot ? 'border-brand-500 shadow-brand-500/20' : 'border-slate-300 dark:border-neutral-700'} rounded-2xl p-4 w-60 shadow-sm transition-all hover:border-brand-400`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black mb-3 ${isRoot ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 group-hover:bg-brand-500/20 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors'}`}>
            {node.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{node.name}</h3>
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">
            {node.headName || 'No head assigned'}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {node.employeeCount ?? 0} employees
          </p>
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

      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-slate-300 dark:bg-neutral-700"></div>
          {node.children.length > 1 && (
            <div className="h-px bg-slate-300 dark:bg-neutral-700" style={{ width: `calc(100% - ${100 / node.children.length}%)` }}></div>
          )}
          <div className="flex justify-center gap-6 mt-0">
            {node.children.map((child) => (
              <DeptOrgNode key={child.id} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError('Failed to load organization structure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tree = useMemo(() => buildDeptTree(departments), [departments]);
  const totalHeadcount = useMemo(() => departments.reduce((sum, d) => sum + (d.employeeCount ?? 0), 0), [departments]);
  const depth = useMemo(() => treeDepth(tree), [tree]);
  const avgHeadcount = departments.length > 0 ? (totalHeadcount / departments.length).toFixed(1) : '0';

  return (
    <div className="w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Network className="text-brand-600 dark:text-brand-400" size={32} />
            Organization Hierarchy
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
            Department structure and headcount, built from real organization data.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <Button variant="primary" onClick={fetchDepartments}>Retry</Button>
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24">
          <Building2 className="w-12 h-12 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">No departments have been set up yet.</p>
        </div>
      ) : (
        <>
          {/* Stats row — real numbers derived from department data (no fabricated org
              hierarchy-depth guesses or made-up headcounts). Note: this reflects department
              structure, not individual employee-to-manager reporting lines — the backend has
              no endpoint for the latter, so we don't fake one. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/50 dark:bg-[#000000] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><Users size={16} /> <span className="font-medium text-xs uppercase tracking-wider">Total Headcount</span></div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalHeadcount}</p>
            </div>
            <div className="bg-white/50 dark:bg-[#000000] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><Building2 size={16} /> <span className="font-medium text-xs uppercase tracking-wider">Departments</span></div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{departments.length}</p>
            </div>
            <div className="bg-white/50 dark:bg-[#000000] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><User size={16} /> <span className="font-medium text-xs uppercase tracking-wider">Avg Headcount / Dept</span></div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{avgHeadcount}</p>
            </div>
            <div className="bg-white/50 dark:bg-[#000000] border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2"><TrendingUp size={16} /> <span className="font-medium text-xs uppercase tracking-wider">Hierarchy Depth</span></div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{depth} {depth === 1 ? 'Level' : 'Levels'}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 rounded-2xl shadow-sm p-8 overflow-auto min-h-[600px] flex justify-center">
            <div className="inline-flex gap-10 py-8 px-4">
              {tree.map((root) => (
                <DeptOrgNode key={root.id} node={root} isRoot={true} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrgChart;
