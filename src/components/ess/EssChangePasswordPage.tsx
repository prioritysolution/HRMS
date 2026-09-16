"use client";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";

export function EssChangePasswordPage() {
  return (
    <>
      <PageHeader title="Change Password" section="Employee Self Service" />
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
