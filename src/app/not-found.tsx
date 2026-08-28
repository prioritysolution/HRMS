import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--body-bg,#f5f7fb)] px-4 text-center">
      <Image
        src="/images/error_img/error404.png"
        alt="Page not found"
        width={420}
        height={320}
        className="mb-6 max-w-full h-auto"
        priority
      />
      <h1 className="mb-2 text-2xl font-semibold">404 — Page Not Found</h1>
      <p className="mb-6 max-w-md text-muted">
        We could not find the page you requested. It may have moved or no longer exists.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
