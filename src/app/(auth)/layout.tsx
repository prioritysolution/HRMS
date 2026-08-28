import { GuestGate } from "@/components/auth/GuestGate";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <GuestGate>{children}</GuestGate>;
}
