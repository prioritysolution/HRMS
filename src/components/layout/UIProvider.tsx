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

const MOBILE_BREAKPOINT = 992;

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

type UIContextValue = {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  isMobile: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  closeMobile: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("priohrm-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("priohrm-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!mobileOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    const allowSidebarScroll = (target: EventTarget | null) =>
      target instanceof Node && Boolean(document.getElementById("app-sidebar")?.contains(target));

    const preventBackgroundScroll = (event: TouchEvent) => {
      if (allowSidebarScroll(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const syncViewport = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const toggleSidebar = useCallback(() => {
    if (isMobile || isMobileViewport()) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setSidebarCollapsed((prev) => !prev);
  }, [isMobile]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({
      theme,
      sidebarCollapsed,
      mobileOpen,
      isMobile,
      toggleTheme,
      toggleSidebar,
      closeMobile,
    }),
    [
      theme,
      sidebarCollapsed,
      mobileOpen,
      isMobile,
      toggleTheme,
      toggleSidebar,
      closeMobile,
    ],
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
