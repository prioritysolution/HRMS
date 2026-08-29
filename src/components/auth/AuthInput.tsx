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

  const LeadingIcon = isPassword ? null : icon === "user" ? UserRound : AtSign;

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

      <div className="auth-input-shell">
        {LeadingIcon ? (
          <span className="auth-input-leading" aria-hidden="true">
            <LeadingIcon size={17} strokeWidth={2.1} />
          </span>
        ) : null}

        <input
          id={id}
          name={name || id}
          type={inputType}
          className={cn("auth-control", LeadingIcon && "has-leading-icon")}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
        />

        {isPassword ? (
          <button
            type="button"
            className="auth-input-trailing"
            tabIndex={0}
            onClick={() => setShow((visible) => !visible)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        ) : null}
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
