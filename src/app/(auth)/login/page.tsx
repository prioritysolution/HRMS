import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Login to Staffu"
      subtitle="Manage your workforce, payroll, and analytics from one secure workspace."
    >
      <SignInForm />
    </AuthShell>
  );
}
