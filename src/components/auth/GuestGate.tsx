"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/constants";
import { isAuthenticated } from "@/lib/auth/session";

export function GuestGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(DEFAULT_AUTH_REDIRECT);
    }
  }, [router]);

  return <>{children}</>;
}
