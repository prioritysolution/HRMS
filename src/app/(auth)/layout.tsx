import { GuestGate } from "@/components/auth/GuestGate";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <GuestGate>{children}</GuestGate>
    </ToastProvider>
  );
}
