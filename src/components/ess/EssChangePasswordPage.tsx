"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/ToastProvider";

export function EssChangePasswordPage() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Password changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);
  };

  return (
    <>
      <PageHeader title="Change Password" section="Employee Self Service" />
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card">
              <div className="card-body ess-password-card m-3">
                <div className="ess-password-header">
                  <div className="avatar avatar-xxl avatar-soft-primary">
                    <Lock size={28} />
                  </div>
                  <div>
                    <h5 className="mb-1">Update your password</h5>
                    <p className="text-muted mb-0">
                      Use a strong password including numbers and symbols.
                    </p>
                  </div>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="ess-password-form">
                  <div className="form-group mb-3">
                    <label htmlFor="current-password">Current Password</label>
                    <div className="ess-password-input-wrap">
                      <input
                        id="current-password"
                        type={showCurrent ? "text" : "password"}
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="ess-password-toggle"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                      >
                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="new-password">New Password</label>
                    <div className="ess-password-input-wrap">
                      <input
                        id="new-password"
                        type={showNew ? "text" : "password"}
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="ess-password-toggle"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? "Hide password" : "Show password"}
                      >
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="ess-password-tips mb-4">
                    <ShieldCheck size={16} />
                    <span>Never share your password. HR will never ask for it.</span>
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                    {saving ? "Updating…" : "Change Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
