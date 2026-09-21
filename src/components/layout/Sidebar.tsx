"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { navigation, type NavIcon, type NavItem, type NavSection } from "@/config/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useUIStore } from "@/components/layout/UIProvider";
import { menuService } from "@/lib/api/services/menu.service";
import { toMenuLangCode } from "@/lib/menu/format-menu-label";
import { menuTreeToNavigation } from "@/lib/menu/map-menu-tree";
import { readMenuCache, writeMenuCache } from "@/lib/menu/menu-cache";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const sectionIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
};

const itemIcons: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  organization: Building2,
  employees: UsersRound,
  attendance: Clock3,
  payroll: Wallet,
  reports: BarChart3,
  settings: Settings,
  helpdesk: CircleHelp,
  ess: UserRound,
  shield: ShieldCheck,
};

function isActivePath(pathname: string, href?: string, exact?: boolean) {
  if (!href) return false;
  if (exact || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveChild(pathname: string, item: NavItem) {
  return (
    item.children?.some((child) => isActivePath(pathname, child.href, child.exact)) ?? false
  );
}

function sameSections(a: NavSection[], b: NavSection[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function menuTitle(label: string, labelSecondary?: string) {
  return labelSecondary ? `${label} — ${labelSecondary}` : label;
}

function MenuLabelText({
  label,
  labelSecondary,
  className,
}: {
  label: string;
  labelSecondary?: string;
  className?: string;
}) {
  const title = menuTitle(label, labelSecondary);
  if (!labelSecondary) {
    return (
      <span className={cn("menu-text", className)} title={title}>
        {label}
      </span>
    );
  }
  return (
    <span className={cn("menu-text has-secondary", className)} title={title}>
      <span className="menu-text-primary">{label}</span>
      <span className="menu-text-secondary">{labelSecondary}</span>
    </span>
  );
}

const FLYOUT_VIEWPORT_PADDING = 12;

function placeCollapsedFlyout(el: HTMLElement | null) {
  if (!el) return;

  el.style.setProperty("--flyout-shift", "0px");

  const viewportHeight = window.innerHeight;
  const maxHeight = Math.max(180, viewportHeight - FLYOUT_VIEWPORT_PADDING * 2);
  el.style.setProperty("--flyout-max-height", `${maxHeight}px`);

  const rect = el.getBoundingClientRect();
  const visibleHeight = Math.min(rect.height, maxHeight);
  const bottom = rect.top + visibleHeight;
  let shift = 0;

  if (bottom > viewportHeight - FLYOUT_VIEWPORT_PADDING) {
    shift = viewportHeight - FLYOUT_VIEWPORT_PADDING - bottom;
  }

  if (rect.top + shift < FLYOUT_VIEWPORT_PADDING) {
    shift = FLYOUT_VIEWPORT_PADDING - rect.top;
  }

  el.style.setProperty("--flyout-shift", `${Math.round(shift)}px`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { closeMobile, mobileOpen, isMobile, sidebarCollapsed } = useUIStore();
  const { language } = useI18n();
  const [sections, setSections] = useState<NavSection[]>([]);
  const [menuReady, setMenuReady] = useState(false);
  const langCode = toMenuLangCode(language);

  useLayoutEffect(() => {
    let active = true;

    const cached = readMenuCache(langCode);
    if (cached?.length) {
      setSections(cached);
      setMenuReady(true);
    } else {
      setMenuReady(false);
    }

    async function loadMenu() {
      try {
        const tree = await menuService.tree({ status: 1, Lang_Code: langCode });
        const mapped = menuTreeToNavigation(tree);
        const fromApi =
          mapped.length && mapped[0].items.length > 0 ? mapped : null;

        // Prefer API tree; if empty/unavailable keep cache; else static fallback.
        const existing = readMenuCache(langCode);
        const next = fromApi ?? (existing?.length ? existing : navigation);

        // Always persist — do not skip because of Strict Mode remount/cancel.
        if (!existing?.length || !sameSections(existing, next)) {
          writeMenuCache(next, langCode);
        }

        if (!active) return;
        setSections((prev) => (sameSections(prev, next) ? prev : next));
        setMenuReady(true);
      } catch {
        const existing = readMenuCache(langCode);
        if (existing?.length) {
          if (active) {
            setSections(existing);
            setMenuReady(true);
          }
          return;
        }
        writeMenuCache(navigation, langCode);
        if (!active) return;
        setSections(navigation);
        setMenuReady(true);
      }
    }

    void loadMenu();
    return () => {
      active = false;
    };
  }, [langCode]);

  const initiallyOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && hasActiveChild(pathname, item)) {
          open[item.label] = true;
        }
      });
    });
    return open;
  }, [pathname, sections]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [flyoutLabel, setFlyoutLabel] = useState<string | null>(null);
  const flyoutMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarMenuRef = useRef<HTMLDivElement | null>(null);
  const iconOnly = sidebarCollapsed && !isMobile;

  const positionOpenFlyout = useCallback(() => {
    placeCollapsedFlyout(flyoutMenuRef.current);
  }, []);

  useEffect(() => {
    setOpenGroups((prev) => ({ ...prev, ...initiallyOpen }));
  }, [initiallyOpen]);

  useEffect(() => {
    setFlyoutLabel(null);
  }, [pathname]);

  // Restore scroll position on initial load / menuReady
  useEffect(() => {
    if (!menuReady || !sidebarMenuRef.current) return;
    const savedPos = sessionStorage.getItem("sidebar_scroll_pos");
    if (savedPos !== null) {
      const top = Number(savedPos);
      if (Number.isFinite(top) && top > 0) {
        sidebarMenuRef.current.scrollTop = top;
      }
    }
  }, [menuReady]);

  // Save scroll position when user scrolls sidebar
  const handleMenuScroll = useCallback(() => {
    if (sidebarMenuRef.current) {
      sessionStorage.setItem("sidebar_scroll_pos", String(sidebarMenuRef.current.scrollTop));
    }
  }, []);

  // Ensure active menu item is scrolled into view only on initial page load / refresh (not on menu clicks)
  const hasScrolledInitialActive = useRef(false);

  useEffect(() => {
    if (!menuReady || iconOnly || hasScrolledInitialActive.current) return;

    const timer = setTimeout(() => {
      if (hasScrolledInitialActive.current) return;
      const container = sidebarMenuRef.current;
      if (!container) return;

      const activeEl = container.querySelector(".nav-link.active") as HTMLElement | null;
      if (!activeEl) return;

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const isAbove = activeRect.top < containerRect.top;
      const isBelow = activeRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        activeEl.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "smooth",
        });
      }
      hasScrolledInitialActive.current = true;
    }, 150);

    return () => clearTimeout(timer);
  }, [menuReady, iconOnly]);

  useLayoutEffect(() => {
    if (!iconOnly || !flyoutLabel) return;

    positionOpenFlyout();

    const menu = document.querySelector(".leftbar-menu");
    window.addEventListener("resize", positionOpenFlyout);
    menu?.addEventListener("scroll", positionOpenFlyout, { passive: true });

    return () => {
      window.removeEventListener("resize", positionOpenFlyout);
      menu?.removeEventListener("scroll", positionOpenFlyout);
    };
  }, [iconOnly, flyoutLabel, positionOpenFlyout, sections]);

  const toggleGroup = (label: string, isActiveParent: boolean) => {
    setOpenGroups((prev) => {
      const currentState = prev[label] ?? isActiveParent;
      return { ...prev, [label]: !currentState };
    });
  };

  const closeFlyout = () => {
    setFlyoutLabel(null);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleNavClick = (parentLabel?: string) => {
    closeFlyout();
    if (isMobile) {
      closeMobile();
    }
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {};
      sections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.children) {
            next[item.label] = item.label === parentLabel;
          }
        });
      });
      return next;
    });
  };

  return (
    <aside
      id="app-sidebar"
      className={cn("left-sidebar", mobileOpen && "is-open")}
    >
      <div
        className="leftbar-menu"
        ref={sidebarMenuRef}
        onScroll={handleMenuScroll}
      >
        {!menuReady ? (
          <div className="p-3 space-y-2.5 animate-pulse select-none" aria-busy="true">
            <div className="h-2.5 w-16 bg-[var(--border)] rounded opacity-40 mb-3 ml-2" />
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-24 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-32 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-28 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="h-2.5 w-20 bg-[var(--border)] rounded opacity-40 mt-5 mb-3 ml-2" />
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-36 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-28 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-32 rounded bg-[var(--border)] opacity-50" />
            </div>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-5 h-5 rounded bg-[var(--border)] opacity-60 flex-shrink-0" />
              <div className="h-3.5 w-20 rounded bg-[var(--border)] opacity-50" />
            </div>
          </div>
        ) : (
          sections.map((section) => {
          const SectionIcon = sectionIcons[section.icon];
          return (
            <div key={section.title || "menu"}>
              {section.title ? (
                <div className="menu-title">
                  <SectionIcon size={14} />
                  <p className="fw-semibold mb-0 d-inline-block">{section.title}</p>
                </div>
              ) : null}
              {section.items.map((item) => {
                const Icon = itemIcons[item.icon] ?? LayoutDashboard;
                if (item.children) {
                  const isActiveParent = hasActiveChild(pathname, item);
                  const open = openGroups[item.label] ?? isActiveParent;
                  const showSubmenu = iconOnly || open;
                  return (
                    <div
                      className={cn("nav-item", iconOnly && flyoutLabel === item.label && "is-flyout-open")}
                      key={item.label}
                      onMouseEnter={() => {
                        if (iconOnly) setFlyoutLabel(item.label);
                      }}
                      onMouseLeave={() => {
                        if (iconOnly) setFlyoutLabel(null);
                      }}
                    >
                      <button
                        type="button"
                        title={menuTitle(item.label, item.labelSecondary)}
                        className={cn(
                          "nav-link menu-drop-btn",
                          iconOnly ? isActiveParent && "active" : open && "open",
                          item.labelSecondary && "has-secondary-label",
                        )}
                        onClick={() => {
                          if (iconOnly) {
                            setFlyoutLabel(item.label);
                            return;
                          }
                          toggleGroup(item.label, isActiveParent);
                        }}
                      >
                        <div className="drop-link-title">
                          <span className="menu-icon">
                            <Icon size={18} strokeWidth={1.75} />
                          </span>
                          <MenuLabelText label={item.label} labelSecondary={item.labelSecondary} />
                        </div>
                        <ChevronDown size={16} className="menu-arrow" />
                      </button>
                      {showSubmenu && (
                        <div
                          className="sub-menu"
                          ref={flyoutLabel === item.label ? flyoutMenuRef : undefined}
                        >
                          <div className="collapsed-flyout-title">
                            <MenuLabelText label={item.label} labelSecondary={item.labelSecondary} />
                          </div>
                          {item.children.map((child) => (
                            <div className="nav-item" key={`${item.label}-${child.href}`}>
                              <Link
                                href={child.href}
                                onClick={() => handleNavClick(item.label)}
                                title={menuTitle(child.label, child.labelSecondary)}
                                className={cn(
                                  "nav-link",
                                  child.labelSecondary && "has-secondary-label",
                                  isActivePath(pathname, child.href, child.exact) && "active",
                                )}
                              >
                                <span className="menu-icon">
                                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                </span>
                                <MenuLabelText
                                  label={child.label}
                                  labelSecondary={child.labelSecondary}
                                />
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="nav-item" key={item.href ?? item.label}>
                    <Link
                      href={item.href!}
                      onClick={() => handleNavClick()}
                      title={menuTitle(item.label, item.labelSecondary)}
                      className={cn(
                        "nav-link",
                        item.labelSecondary && "has-secondary-label",
                        isActivePath(pathname, item.href) && "active",
                      )}
                    >
                      <span className="menu-icon">
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <MenuLabelText label={item.label} labelSecondary={item.labelSecondary} />
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })
        )}
      </div>
      <div className="sidebar-footer">
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  );
}
