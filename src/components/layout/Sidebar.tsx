"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { navigation, type NavItem } from "@/config/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useUIStore } from "@/components/layout/UIProvider";
import { cn } from "@/lib/utils";

const sectionIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
};

const itemIcons: Record<NavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  organization: Building2,
  employees: UsersRound,
  attendance: Clock3,
};

function isActivePath(pathname: string, href?: string, exact?: boolean) {
  if (!href) return false;
  if (exact || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasActiveChild(pathname: string, item: NavItem) {
  return (
    item.children?.some((child) => isActivePath(pathname, child.href, child.exact)) ??
    false
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { closeMobile } = useUIStore();
  const initiallyOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children && hasActiveChild(pathname, item)) {
          open[item.label] = true;
        }
      });
    });
    return open;
  }, [pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initiallyOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavClick = () => {
    if (window.innerWidth < 992) {
      closeMobile();
    }
  };

  return (
    <aside className="left-sidebar">
      <div className="leftbar-menu">
        {navigation.map((section) => {
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
                const Icon = itemIcons[item.icon];
                if (item.children) {
                  const open = openGroups[item.label] || hasActiveChild(pathname, item);
                  return (
                    <div className="nav-item" key={item.label}>
                      <button
                        type="button"
                        className={cn("nav-link menu-drop-btn", open && "open")}
                        onClick={() => toggleGroup(item.label)}
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
                      {open && (
                        <div className="sub-menu">
                          {item.children.map((child) => (
                            <div className="nav-item" key={child.href}>
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
                  <div className="nav-item" key={item.href}>
                    <Link
                      href={item.href!}
                      onClick={handleNavClick}
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
        })}
      </div>
      <div className="sidebar-footer">
        <LogoutButton variant="sidebar" />
      </div>
    </aside>
  );
}
