"use client";

import { useState } from "react";
import { AtSign, Eye, EyeOff, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthInputProps = {
  id: string;
  label?: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  name?: string;
  icon?: "email" | "user" | "password";
  helpText?: string;
  error?: string;
  className?: string;
  rightSlot?: React.ReactNode;
  value?: string;
  autoComplete?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
};

export function AuthInput({
  id,
  label,
  type = "text",
  placeholder,
  name,
  icon = "email",
  helpText,
  error,
  className,
  rightSlot,
  value,
  autoComplete,
  onChange,
  onBlur,
}: AuthInputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;
  const hasError = Boolean(error);

  return (
    <div className={cn("auth-field", hasError && "is-invalid", className)}>
      {(label || rightSlot) && (
        <div className="auth-label-row">
          {label ? (
            <label className="auth-label mb-0" htmlFor={id}>
              {label}
            </label>
          ) : (
            <span />
          )}
          {rightSlot}
        </div>
      )}
      <div className="auth-input-group">
        <button
          type="button"
          className={cn("auth-input-addon", isPassword && "toggle-password")}
          tabIndex={isPassword ? 0 : -1}
          onClick={() => isPassword && setShow((v) => !v)}
          aria-label={isPassword ? (show ? "Hide password" : "Show password") : undefined}
        >
          {isPassword ? (
            show ? <Eye size={18} /> : <EyeOff size={18} />
          ) : icon === "user" ? (
            <UserRound size={18} />
          ) : (
            <AtSign size={18} />
          )}
        </button>
        <input
          id={id}
          name={name || id}
          type={inputType}
          className="auth-control"
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
        />
      </div>
      {hasError ? (
        <p id={`${id}-error`} className="auth-error" role="alert">
          {error}
        </p>
      ) : (
        helpText && (
          <div id={`${id}-help`} className="auth-help">
            {helpText}
          </div>
        )
      )}
    </div>
  );
}
