'use client';

import { useSidebar } from './sidebar-context';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'pl-16' : 'pl-64'}`}>
      {children}
    </div>
  );
}
