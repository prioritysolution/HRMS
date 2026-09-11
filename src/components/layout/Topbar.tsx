"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  X,
} from "lucide-react";
import { notifications } from "@/data/mock";
import { navigation, type NavSection } from "@/config/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useAuth } from "@/lib/auth/AuthProvider";
import { menuService } from "@/lib/api/services/menu.service";
import { menuTreeToNavigation } from "@/lib/menu/map-menu-tree";
import { readMenuCache, writeMenuCache } from "@/lib/menu/menu-cache";
import { useUIStore } from "@/components/layout/UIProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

type SearchResult = {
  label: string;
  parent?: string;
  href: string;
};

function flattenNavigation(sections: NavSection[]): SearchResult[] {
  return sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const itemResult = item.href ? [{ label: item.label, href: item.href }] : [];
      const childResults = (item.children ?? []).map((child) => ({
        label: child.label,
        parent: item.label,
        href: child.href,
      }));
      return [...itemResult, ...childResults];
    }),
  );
}

export function Topbar() {
  const router = useRouter();
  const { theme, toggleTheme, toggleSidebar, mobileOpen } = useUIStore();
  const { user } = useAuth();
  const [openNoti, setOpenNoti] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuSections, setMenuSections] = useState<NavSection[]>(navigation);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedResult, setHighlightedResult] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "PrioHRM User";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ?? "Admin";

  const searchResults = flattenNavigation(menuSections).filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    return query && `${item.label} ${item.parent ?? ""}`.toLowerCase().includes(query);
  });

  useEffect(() => {
    let active = true;
    const cached = readMenuCache();
    if (cached?.length) {
      Promise.resolve().then(() => {
        if (active) setMenuSections(cached);
      });
    }

    menuService
      .tree({ status: 1 })
      .then((tree) => {
        const mapped = menuTreeToNavigation(tree);
        if (!active || !mapped[0]?.items.length) return;
        setMenuSections(mapped);
        writeMenuCache(mapped);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!notiRef.current?.contains(event.target as Node)) setOpenNoti(false);
      if (!userRef.current?.contains(event.target as Node)) setOpenUser(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchQuery("");
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const goToSearchResult = (result: SearchResult) => {
    setSearchQuery("");
    router.push(result.href);
  };

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
          <button
            type="button"
            className="sidebar-toggle"
            onClick={(event) => {
              event.stopPropagation();
              toggleSidebar();
            }}
            aria-label={mobileOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={mobileOpen}
            aria-controls="app-sidebar"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="main-logo">
            <BrandLogo size="lg" />
          </div>
        </div>

        <div className="top-right-content">
          <div className="topbar-search" ref={searchRef}>
            <Search size={16} className="topbar-search-icon" />
            <input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setHighlightedResult(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightedResult((current) =>
                    Math.min(current + 1, Math.max(searchResults.length - 1, 0)),
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightedResult((current) => Math.max(current - 1, 0));
                } else if (event.key === "Enter" && searchResults[highlightedResult]) {
                  event.preventDefault();
                  goToSearchResult(searchResults[highlightedResult]);
                } else if (event.key === "Escape") {
                  setSearchQuery("");
                  event.currentTarget.blur();
                }
              }}
              role="combobox"
              aria-expanded={Boolean(searchQuery)}
              aria-controls="topbar-search-results"
              autoComplete="off"
            />
            {searchQuery && (
              <div id="topbar-search-results" className="topbar-search-results" role="listbox">
                {searchResults.length > 0 ? (
                  searchResults.slice(0, 8).map((result, index) => (
                    <button
                      type="button"
                      key={`${result.href}-${result.label}`}
                      className={index === highlightedResult ? "is-highlighted" : ""}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToSearchResult(result)}
                      role="option"
                      aria-selected={index === highlightedResult}
                    >
                      <span>{result.label}</span>
                      {result.parent && <small>{result.parent}</small>}
                    </button>
                  ))
                ) : (
                  <div className="topbar-search-empty">No menu found</div>
                )}
              </div>
            )}
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
            className="topbar-icon topbar-icon-desktop"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button
            type="button"
            className="topbar-icon topbar-icon-desktop"
            aria-label="Settings"
          >
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
              <div className="topbar-user-meta">
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
                  onClick={() => setOpenUser(false)}
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
