"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/constants";
import { isAuthenticated } from "@/lib/auth/session";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(SIGN_IN_PATH);
    }
  }, [router]);

  return <>{children}</>;
}
