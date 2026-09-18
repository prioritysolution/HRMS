"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUIStore } from "@/components/layout/UIProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: "sidebar" | "menu";
  className?: string;
  onOpen?: () => void;
};

export function LogoutButton({
  variant = "sidebar",
  className,
  onOpen,
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const { closeMobile } = useUIStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      closeMobile();
      onOpen?.();
      await logout();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={open}
      onClose={() => {
        if (loading) return;
        setOpen(false);
      }}
      onConfirm={handleConfirm}
      title={t("common.logoutTitle")}
      message={t("common.logoutMessage")}
      confirmLabel={t("common.logout")}
      cancelLabel={t("common.cancel")}
      variant="danger"
      loading={loading}
    />
  );

  return (
    <>
      <button
        type="button"
        className={cn(
          variant === "sidebar" ? "sidebar-logout-btn" : "dropdown-logout-btn",
          className,
        )}
        onClick={handleOpen}
      >
        <LogOut size={variant === "sidebar" ? 18 : 15} strokeWidth={2} />
        <span className={variant === "sidebar" ? "menu-text" : undefined}>
          {t("common.logout")}
        </span>
      </button>

      {mounted && open ? createPortal(dialog, document.body) : null}
    </>
  );
}
