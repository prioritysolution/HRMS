import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Login | PrioHRM",
  description:
    "Sign in to PrioHRM to manage your workforce, attendance, leave, payroll, and performance.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome Back!"
      subtitle="Sign in to your account to continue"
    >
      <SignInForm />
    </AuthShell>
  );
}
