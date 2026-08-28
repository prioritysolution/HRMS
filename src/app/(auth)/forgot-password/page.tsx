import Image from "next/image";
import Link from "next/link";
import { Headphones, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container auth-container-narrow">
        <div className="auth-card auth-card-center">
          <div className="auth-center-body">
            <Image
              src="/images/pswforgot.png"
              alt="Forgot password"
              width={220}
              height={160}
              className="auth-illus"
              priority
            />
            <h1 className="auth-heading">Forget Password?</h1>
            <p className="auth-subheading">Enter your email to reset your password.</p>

            <form className="auth-form" action="/verification">
              <div className="auth-floating">
                <span className="auth-floating-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="emailVerify"
                  name="emailId"
                  type="email"
                  className="auth-control auth-control-floating"
                  placeholder=" "
                  defaultValue="joyce.neal@example.com"
                  required
                />
                <label htmlFor="emailVerify">Email Address</label>
              </div>
              <div className="auth-help text-left">
                We&apos;ll send you OTP to reset your password.
              </div>

              <button type="submit" className="btn btn-primary w-full mt-4">
                Confirm E-mail
              </button>

              <hr className="auth-divider mt-6" />
              <div className="auth-help-row">
                <small>
                  Remember your password ? <Link href="/signin">Sign In</Link>
                </small>
                <a href="#" className="auth-help-link">
                  <Headphones size={14} /> Help
                </a>
              </div>
            </form>
          </div>
        </div>
        <p className="auth-legal">
          By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>
        </p>
      </div>
    </section>
  );
}
