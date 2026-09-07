import type { Metadata } from "next";
import { GuestGate } from "@/components/auth/GuestGate";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata: Metadata = {
  title: {
    default: "PrioHRM Login",
    template: "%s | PrioHRM HRMS",
  },
  icons: {
    icon: [
      { url: "/images/logos/prio-hrm-mark.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestGate>{children}</GuestGate>
    </ToastProvider>
  );
}
