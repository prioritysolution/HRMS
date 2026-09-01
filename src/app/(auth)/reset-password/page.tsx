"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

function FloatingPassword({
  id,
  label,
  defaultValue,
  name,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  name: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-floating auth-floating-password">
      <button
        type="button"
        className="auth-eye"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className="auth-control auth-control-floating"
        placeholder=" "
        defaultValue={defaultValue}
        required
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container auth-container-narrow">
        <div className="auth-card auth-card-center">
          <div className="auth-center-body auth-center-padded">
            <h2 className="auth-heading">Set a New Password</h2>
            <p className="auth-subheading mb-8">
              Your old password has been reset. Please choose a new one.
            </p>

            <form className="auth-form" action="/login">
              <FloatingPassword
                id="currentPassword"
                label="Current Password"
                name="currentPassword"
                defaultValue="012345678"
              />
              <FloatingPassword
                id="newPassword"
                label="New Password"
                name="newPassword"
                defaultValue="Joyce#012"
              />



              <button type="submit" className="btn btn-primary w-full">
                Update Password
              </button>
            </form>

            <p className="auth-bottom-note">
              Remember your password? <Link href="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
