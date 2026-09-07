import type { Metadata } from "next";
import { GuestGate } from "@/components/auth/GuestGate";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: {
    default: "PrioHRM Login",
    template: "%s | PrioHRM HRMS",
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestGate>{children}</GuestGate>
    </ToastProvider>
  );
}
