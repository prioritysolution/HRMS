"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/lib/api/types";
import { authService } from "@/lib/api/services/auth.service";
import { SIGN_IN_PATH } from "@/lib/auth/constants";
import { isAuthenticated } from "@/lib/auth/session";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!isAuthenticated()) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }

      const stored = await authService.me();
      if (!cancelled) setUser(stored);
      if (!cancelled) setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    window.location.assign(SIGN_IN_PATH);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      isLoggedIn: Boolean(user) || isAuthenticated(),
      logout,
    }),
    [user, ready, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
