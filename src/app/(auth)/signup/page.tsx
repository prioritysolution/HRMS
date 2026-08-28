import Image from "next/image";
import Link from "next/link";
import { AuthCarousel } from "@/components/auth/AuthCarousel";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
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
              <h1 className="auth-heading">Sign Up</h1>
              <p className="auth-subheading auth-subheading-sm">Start your 30-days trial.</p>

              <SignUpForm />

              <div className="auth-footer-link">
                <p>Already have an account ?</p>
                <Link href="/signin">Log in</Link>
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
