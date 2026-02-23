import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <DashboardShell>
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </DashboardShell>
      </div>
    </SidebarProvider>
  );
}
