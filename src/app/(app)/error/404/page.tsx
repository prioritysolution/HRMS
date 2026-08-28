import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Page() {
  return (
    <>
      <PageHeader title="Error 404" section="Error" />
      <div className="container-fluid">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Image
            src="/images/error_img/error404.png"
            alt="Page not found"
            width={420}
            height={320}
            className="mb-6 max-w-full h-auto"
            priority
          />
          <h2 className="mb-2 text-2xl font-semibold">Page Not Found</h2>
          <p className="mb-6 max-w-md text-muted">
            The page you are looking for might have been removed, renamed, or is temporarily
            unavailable.
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
