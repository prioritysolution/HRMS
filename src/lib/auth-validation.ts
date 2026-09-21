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

/** Returns an i18n key under auth.errors.* (without the prefix). */
export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "emailRequired";
  if (!EMAIL_PATTERN.test(trimmed)) return "emailInvalid";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "passwordRequired";
  return undefined;
}

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "usernameRequired";
  if (trimmed.length < 2) return "usernameMin";
  if (!/^[a-zA-Z\s'.-]+$/.test(trimmed)) {
    return "usernameChars";
  }
  return undefined;
}

export function validateLoginUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "usernameRequired";
  if (trimmed.length < 2) return "usernameMin";
  if (!LOGIN_USERNAME_PATTERN.test(trimmed)) {
    return "loginUsernameChars";
  }
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (!confirm) return "confirmRequired";
  if (confirm !== password) return "passwordMismatch";
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
