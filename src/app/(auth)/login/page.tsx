import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Login to PrioHRM",
  description:
    "Login to PrioHRM — manage workforce, payroll, and analytics from one secure workspace.",
  icons: {
    icon: [
      { url: "/images/logos/prio-hrm-mark.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Login to PrioHRM"
      subtitle="Manage your workforce, payroll, and analytics from one secure workspace."
    >
      <SignInForm />
    </AuthShell>
  );
}
