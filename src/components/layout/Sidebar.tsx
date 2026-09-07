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
import { menuTreeToNavigation } from "@/lib/menu/map-menu-tree";
import { readMenuCache, writeMenuCache } from "@/lib/menu/menu-cache";
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
  const [sections, setSections] = useState<NavSection[]>(navigation);
  const [menuReady, setMenuReady] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  useLayoutEffect(() => {
    let active = true;

    const cached = readMenuCache();
    if (cached?.length) {
      setSections(cached);
    }

    async function loadMenu() {
      try {
        const tree = await menuService.tree({ status: 1 });
        const mapped = menuTreeToNavigation(tree);
        const fromApi =
          mapped.length && mapped[0].items.length > 0 ? mapped : null;

        // Prefer API tree; if empty/unavailable keep cache; else static fallback.
        const existing = readMenuCache();
        const next = fromApi ?? (existing?.length ? existing : navigation);

        // Always persist — do not skip because of Strict Mode remount/cancel.
        if (!existing?.length || !sameSections(existing, next)) {
          writeMenuCache(next);
        }

        if (!active) return;
        setSections((prev) => (sameSections(prev, next) ? prev : next));
        setMenuReady(true);
        setShowLoading(false);
      } catch {
        const existing = readMenuCache();
        if (existing?.length) {
          if (active) {
            setSections(existing);
            setMenuReady(true);
            setShowLoading(false);
          }
          return;
        }
        writeMenuCache(navigation);
        if (!active) return;
        setSections(navigation);
        setMenuReady(true);
        setShowLoading(false);
      }
    }

    void loadMenu();
    return () => {
      active = false;
    };
  }, []);

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

  const handleNavClick = () => {
    closeFlyout();
    if (isMobile) {
      closeMobile();
    }
  };

  return (
    <aside
      id="app-sidebar"
      className={cn("left-sidebar", mobileOpen && "is-open")}
    >
      <div className="leftbar-menu">
        {!menuReady ? (
          showLoading ? (
            <div className="menu-title">
              <p className="fw-semibold mb-0 d-inline-block opacity-60">Loading menu...</p>
            </div>
          ) : null
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
                        title={item.label}
                        className={cn(
                          "nav-link menu-drop-btn",
                          iconOnly ? isActiveParent && "active" : open && "open",
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
                          <span className="menu-text" title={item.label}>
                            {item.label}
                          </span>
                        </div>
                        <ChevronDown size={16} className="menu-arrow" />
                      </button>
                      {showSubmenu && (
                        <div
                          className="sub-menu"
                          ref={flyoutLabel === item.label ? flyoutMenuRef : undefined}
                        >
                          <div className="collapsed-flyout-title">{item.label}</div>
                          {item.children.map((child) => (
                            <div className="nav-item" key={`${item.label}-${child.href}`}>
                              <Link
                                href={child.href}
                                onClick={handleNavClick}
                                className={cn(
                                  "nav-link",
                                  isActivePath(pathname, child.href, child.exact) && "active",
                                )}
                              >
                                <span className="menu-icon">
                                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                                </span>
                                <span className="menu-text">{child.label}</span>
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
                      onClick={handleNavClick}
                      title={item.label}
                      className={cn(
                        "nav-link",
                        isActivePath(pathname, item.href) && "active",
                      )}
                    >
                      <span className="menu-icon">
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <span className="menu-text">{item.label}</span>
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
