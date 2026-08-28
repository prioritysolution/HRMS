"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { notifications } from "@/data/mock";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUIStore } from "@/components/layout/UIProvider";

export function Topbar() {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { user } = useAuth();
  const [openNoti, setOpenNoti] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "Staffu User";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ?? "Admin";

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!notiRef.current?.contains(event.target as Node)) setOpenNoti(false);
      if (!userRef.current?.contains(event.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        <div className="top-left-content">
          <div className="main-logo mr-1">
            <Link href="/dashboard" className="logo-dark">
              <Image
                src="/images/logos/logo_dark.png"
                alt="Staffu"
                width={112}
                height={28}
                priority
              />
            </Link>
            <Link href="/dashboard" className="logo-light">
              <Image
                src="/images/logos/logo_light.png"
                alt="Staffu"
                width={112}
                height={28}
                priority
              />
            </Link>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="top-right-content">
          <div className="topbar-search">
            <Search size={16} className="topbar-search-icon" />
            <input placeholder="Search anything..." />
          </div>

          <button
            type="button"
            className="topbar-icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            className="topbar-icon hidden sm:inline-flex"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button type="button" className="topbar-icon" aria-label="Settings">
            <Settings size={16} />
          </button>

          <div className="relative" ref={notiRef}>
            <button
              type="button"
              className="topbar-icon"
              onClick={() => {
                setOpenNoti((v) => !v);
                setOpenUser(false);
              }}
              aria-label="Notifications"
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
            </button>
            {openNoti && (
              <div className="dropdown-panel">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <h5 className="m-0 text-sm font-semibold">Notifications</h5>
                  <p className="m-0 text-xs text-muted">You have 12 new notifications</p>
                </div>
                <div className="max-h-72 overflow-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.title}
                      className="border-b border-[var(--border)] px-4 py-3 last:border-0"
                    >
                      <h6 className="m-0 text-sm font-semibold">{item.title}</h6>
                      <p className="mb-1 mt-1 text-xs text-muted">{item.message}</p>
                      <small className="text-secondary">{item.time}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border-0 bg-transparent p-0"
              onClick={() => {
                setOpenUser((v) => !v);
                setOpenNoti(false);
              }}
            >
              <Image
                src="/images/avatars/avatar1.jpg"
                alt={displayName}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <div className="hidden text-left sm:block">
                <div className="text-sm font-bold leading-none">{displayName}</div>
                <div className="mt-1 text-xs text-muted">{displayRole}</div>
              </div>
            </button>
            {openUser && (
              <div className="dropdown-panel w-56">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <div className="font-semibold">{displayName}</div>
                  <div className="text-xs text-muted">{displayEmail}</div>
                </div>
                <Link
                  href="/employees/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--card-soft)]"
                >
                  <UserRound size={15} /> Profile
                </Link>
                <LogoutButton variant="menu" onOpen={() => setOpenUser(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
