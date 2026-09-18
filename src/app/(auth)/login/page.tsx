"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { useI18n } from "@/i18n";

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <AuthShell title={t("auth.welcomeTitle")} subtitle={t("auth.welcomeSubtitle")}>
      <SignInForm />
    </AuthShell>
  );
}
