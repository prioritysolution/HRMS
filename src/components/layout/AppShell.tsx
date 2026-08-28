"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AppFooter } from "@/components/layout/AppFooter";
import { UIProvider, useUIStore } from "@/components/layout/UIProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

function Shell({ children }: { children: React.ReactNode }) {
  const { mobileOpen, closeMobile } = useUIStore();

  return (
    <>
      <Topbar />
      <Sidebar />
      {mobileOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Close sidebar"
          onClick={closeMobile}
        />
      )}
      <div className="page-wrapper">
        <div className="page-content">{children}</div>
        <AppFooter />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </UIProvider>
  );
}
