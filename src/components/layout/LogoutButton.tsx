"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useUIStore } from "@/components/layout/UIProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    onOpen?.();
    setOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      closeMobile();
      await logout();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

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
        <span className={variant === "sidebar" ? "menu-text" : undefined}>Logout</span>
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Logout?"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
