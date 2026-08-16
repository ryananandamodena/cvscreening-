import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../constants/rbac';
import AccessDenied from './AccessDenied';

// Screen-level authorization guard, meant to wrap a whole screen's return value:
//   export default function EmployeesScreen() {
//     return <RequireAccess permission="employee.view"><...actual screen...></RequireAccess>;
//   }
// This is the second half of "navigation-level + screen-level authorization" — even if a tab
// is hidden, someone navigating the route directly (deep link, back button, stale state) hits
// this check instead of rendering the real content.
export default function RequireAccess({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { canAccess } = useAuth();
  if (!canAccess(permission)) {
    return <AccessDenied />;
  }
  return <>{children}</>;
}
