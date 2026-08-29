const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export type SignInValues = {
  userName: string;
  password: string;
};

export type SignUpValues = {
  userName: string;
  emailId: string;
  password: string;
  confirmPsw: string;
};

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return undefined;
}

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Username is required.";
  if (trimmed.length < 2) return "Username must be at least 2 characters.";
  if (!/^[a-zA-Z\s'.-]+$/.test(trimmed)) {
    return "Username can only contain letters, spaces, and basic punctuation.";
  }
  return undefined;
}

export function validateLoginUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Username is required.";
  if (trimmed.length < 2) return "Username must be at least 2 characters.";
  if (!LOGIN_USERNAME_PATTERN.test(trimmed)) {
    return "Username can only contain letters, numbers, dots, hyphens, and underscores.";
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return "Please confirm your password.";
  if (confirm !== password) return "Passwords do not match.";
  return undefined;
}

export function validateSignInField(
  field: keyof SignInValues,
  values: SignInValues,
): string | undefined {
  switch (field) {
    case "userName":
      return validateLoginUsername(values.userName);
    case "password":
      return validatePassword(values.password);
    default:
      return undefined;
  }
}

export function validateSignIn(values: SignInValues): FieldErrors<keyof SignInValues> {
  const errors: FieldErrors<keyof SignInValues> = {};
  (Object.keys(values) as Array<keyof SignInValues>).forEach((field) => {
    const error = validateSignInField(field, values);
    if (error) errors[field] = error;
  });
  return errors;
}

export function validateSignUpField(
  field: keyof SignUpValues,
  values: SignUpValues,
): string | undefined {
  switch (field) {
    case "userName":
      return validateUsername(values.userName);
    case "emailId":
      return validateEmail(values.emailId);
    case "password":
      return validatePassword(values.password);
    case "confirmPsw":
      return validateConfirmPassword(values.password, values.confirmPsw);
    default:
      return undefined;
  }
}

export function validateSignUp(values: SignUpValues): FieldErrors<keyof SignUpValues> {
  const errors: FieldErrors<keyof SignUpValues> = {};
  (Object.keys(values) as Array<keyof SignUpValues>).forEach((field) => {
    const error = validateSignUpField(field, values);
    if (error) errors[field] = error;
  });
  return errors;
}
