"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

type UIContextValue = {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  closeMobile: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("staffu-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("staffu-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 992) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({
      theme,
      sidebarCollapsed,
      mobileOpen,
      toggleTheme,
      toggleSidebar,
      closeMobile,
    }),
    [theme, sidebarCollapsed, mobileOpen, toggleTheme, toggleSidebar, closeMobile],
  );

  return (
    <UIContext.Provider value={value}>
      <div
        className={cn(
          "page-layout",
          sidebarCollapsed && "sidebar-collapsed",
          mobileOpen && "sidebar-open",
        )}
      >
        {children}
      </div>
    </UIContext.Provider>
  );
}

export function useUIStore() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUIStore must be used within UIProvider");
  return ctx;
}
