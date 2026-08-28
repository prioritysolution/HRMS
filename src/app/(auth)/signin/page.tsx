import Image from "next/image";
import Link from "next/link";
import { AuthCarousel } from "@/components/auth/AuthCarousel";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container">
        <div className="auth-card auth-card-split">
          <div className="auth-pane">
            <div className="auth-pane-inner">
              <div className="auth-logo">
                <Image
                  src="/images/logos/logo_light.png"
                  alt="Staffu"
                  width={120}
                  height={30}
                  priority
                />
              </div>
              <h1 className="auth-heading">Sign In</h1>
              <p className="auth-subheading">Welcome back! It&apos;s great to see you.</p>

              <SignInForm />

              <div className="auth-footer-link">
                <p>First time with us ?</p>
                <Link href="/signup">Create an account</Link>
              </div>
            </div>
          </div>

          <div className="auth-pane auth-pane-media">
            <AuthCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
