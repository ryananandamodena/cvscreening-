import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = 'bg-slate-200 dark:bg-slate-700 animate-pulse';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Table skeleton for data tables
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            className="flex-1"
            height={20}
            variant={colIndex === 0 ? 'circular' : 'rectangular'}
          />
        ))}
      </div>
    ))}
  </div>
);

// Card skeleton for dashboard cards
export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton width={40} height={20} className="rounded-full" />
    </div>
    <Skeleton width={100} height={16} className="mb-2" />
    <div className="flex items-baseline gap-2 mt-1">
      <Skeleton width={80} height={32} />
      <Skeleton width={40} height={16} />
    </div>
  </div>
);

// Employee card skeleton
export const EmployeeCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton width={120} height={20} className="mb-2" />
        <Skeleton width={80} height={16} />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="60%" height={12} />
    </div>
  </div>
);

// Payroll period skeleton
export const PayrollPeriodSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={32} height={32} />
        <div>
          <Skeleton width={120} height={20} className="mb-1" />
          <Skeleton width={80} height={14} />
        </div>
      </div>
      <Skeleton width={60} height={24} className="rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <Skeleton width={40} height={16} className="mx-auto mb-1" />
        <Skeleton width={60} height={20} className="mx-auto" />
      </div>
      <div className="text-center">
        <Skeleton width={40} height={16} className="mx-auto mb-1" />
        <Skeleton width={60} height={20} className="mx-auto" />
      </div>
      <div className="text-center">
        <Skeleton width={40} height={16} className="mx-auto mb-1" />
        <Skeleton width={60} height={20} className="mx-auto" />
      </div>
    </div>
  </div>
);

// Page skeleton with header and content
export const PageSkeleton: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    {/* Header skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div>
          <Skeleton width={200} height={32} className="mb-2" />
          <Skeleton width={300} height={20} />
        </div>
      </div>
      <Skeleton width={120} height={44} className="rounded-2xl" />
    </div>

    {/* Content skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>

    {/* Table skeleton */}
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={36} className="rounded-xl" />
      </div>
      <TableSkeleton rows={6} columns={5} />
    </div>
  </div>
);