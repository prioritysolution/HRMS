"use client";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { useI18n } from "@/i18n";

export function EssChangePasswordPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader title={t("ess.ui.changePassword")} section={t("ess.section")} />
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card">
              <div className="card-body m-3">
                <ChangePasswordForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
