"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
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
import { cn } from "@/lib/utils";
import { notifications } from "@/data/mock";
import { navigation, type NavSection } from "@/config/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { TopbarLanguageMenu } from "@/components/layout/TopbarLanguageMenu";
import { useAuth } from "@/lib/auth/AuthProvider";
import { menuService } from "@/lib/api/services/menu.service";
import { menuTreeToNavigation } from "@/lib/menu/map-menu-tree";
import { readMenuCache, writeMenuCache } from "@/lib/menu/menu-cache";
import { useUIStore } from "@/components/layout/UIProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { resolvePublicFileUrl } from "@/lib/env";
import { useI18n } from "@/i18n";

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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function TopbarAvatar({
  name,
  photoPath,
}: {
  name: string;
  photoPath?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const photoUrl = useMemo(() => {
    if (!photoPath) return "";
    return resolvePublicFileUrl(photoPath, "storage/employees/photos");
  }, [photoPath]);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  if (!photoUrl || failed) {
    return (
      <span className="topbar-avatar topbar-avatar-fallback" aria-hidden="true">
        {initialsFromName(name)}
      </span>
    );
  }

  const isRemote = /^https?:\/\//i.test(photoUrl);

  if (isRemote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={36}
        height={36}
        className="topbar-avatar"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={name}
      width={36}
      height={36}
      className="topbar-avatar"
      onError={() => setFailed(true)}
    />
  );
}

export function Topbar() {
  const router = useRouter();
  const { theme, toggleTheme, toggleSidebar, mobileOpen } = useUIStore();
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const [openNoti, setOpenNoti] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuSections, setMenuSections] = useState<NavSection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedResult, setHighlightedResult] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? "";
  const displayEmail = user?.email ?? "";
  const displayRole = user?.role ?? "";

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
            aria-label={mobileOpen ? t("topbar.closeSidebar") : t("topbar.openSidebar")}
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
              placeholder={t("topbar.searchPlaceholder")}
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
                  <div className="topbar-search-empty">{t("topbar.noMenuFound")}</div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="topbar-icon"
            onClick={toggleTheme}
            aria-label={t("topbar.toggleTheme")}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <TopbarLanguageMenu />

          <button
            type="button"
            className="topbar-icon topbar-icon-desktop"
            onClick={toggleFullscreen}
            aria-label={t("topbar.toggleFullscreen")}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          <button
            type="button"
            className="topbar-icon topbar-icon-desktop"
            aria-label={t("topbar.settings")}
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
              aria-label={t("topbar.notifications")}
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
            </button>
            {openNoti && (
              <div className="dropdown-panel">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <h5 className="m-0 text-sm font-semibold">{t("topbar.notificationsTitle")}</h5>
                  <p className="m-0 text-xs text-muted">{t("topbar.notificationsSubtitle")}</p>
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
            {!ready || !user ? (
              <div
                className="topbar-user-trigger flex items-center gap-2 opacity-85 pointer-events-none select-none"
                aria-busy="true"
                aria-label="Loading profile..."
              >
                <div className="ui-skeleton w-[34px] h-[34px] rounded-full flex-shrink-0" />
                <div className="topbar-user-meta hidden lg:flex flex-col gap-1.5 py-0.5">
                  <div className="ui-skeleton w-20 h-3 rounded" />
                  <div className="ui-skeleton w-14 h-2.5 rounded" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={cn("topbar-user-trigger", openUser && "is-open")}
                onClick={() => {
                  setOpenUser((v) => !v);
                  setOpenNoti(false);
                }}
                aria-expanded={openUser}
                aria-haspopup="menu"
              >
                <div className="topbar-avatar-wrapper">
                  <TopbarAvatar name={displayName} photoPath={user?.photoPath} />
                  <span className="topbar-user-status-dot" aria-hidden="true" />
                </div>
                <div className="topbar-user-meta hidden lg:flex lg:flex-col">
                  <span className="topbar-user-name">{displayName}</span>
                  <span className="topbar-user-role">{displayRole}</span>
                </div>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={cn(
                    "topbar-user-chevron hidden lg:block",
                    openUser && "rotate-180"
                  )}
                />
              </button>
            )}
            {openUser && (
              <div className="dropdown-panel w-56">
                <div className="border-b border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <TopbarAvatar name={displayName} photoPath={user?.photoPath} />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{displayName}</div>
                      <div className="text-xs text-muted truncate">{displayEmail || displayRole}</div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/employees/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--card-soft)]"
                  onClick={() => setOpenUser(false)}
                >
                  <UserRound size={15} /> {t("common.profile")}
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
