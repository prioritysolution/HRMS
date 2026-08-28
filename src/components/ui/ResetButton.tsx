import { RotateCcw } from "lucide-react";

type ResetButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export function ResetButton({ onClick, label = "Reset", className }: ResetButtonProps) {
  return (
    <button
      type="button"
      className={["btn-reset-light", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <RotateCcw size={14} strokeWidth={2.25} />
      {label}
    </button>
  );
}
