export const ONBOARDING_UNIQUE_FIELDS = [
  "Device_user_id",
  "Id_card_number",
  "Work_email",
  "Username",
] as const;

export type OnboardingUniqueField = (typeof ONBOARDING_UNIQUE_FIELDS)[number];

export type UniqueConflictRecord = {
  Employee_id?: string;
  Onboard_id?: string;
  values: Record<OnboardingUniqueField, string[]>;
};

type UniqueFieldConfig = {
  keys: string[];
  message: string;
  normalize: (value: string) => string;
};

const UNIQUE_FIELD_CONFIG: Record<OnboardingUniqueField, UniqueFieldConfig> = {
  Device_user_id: {
    keys: ["Device_user_id", "device_user_id"],
    message: "This Device ID is already assigned to another employee.",
    normalize: (value) => value.trim(),
  },
  Id_card_number: {
    keys: ["Id_card_number", "id_card_number", "IdCard_No", "Id_card_no", "idcard_no"],
    message: "This ID Card Number is already in use.",
    normalize: (value) => value.trim().toLowerCase(),
  },
  Work_email: {
    keys: ["Work_email", "Work_Email", "work_email", "Email", "email"],
    message: "This work email is already in use.",
    normalize: (value) => value.trim().toLowerCase(),
  },
  Username: {
    keys: ["Username", "User_Name", "username", "user_name"],
    message: "This username is already taken.",
    normalize: (value) => value.trim().toLowerCase(),
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readText(record: Record<string, unknown>, keys: string[]): string[] {
  const values: string[] = [];
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null || value === "") continue;
    const text = String(value).trim();
    if (text && !values.includes(text)) values.push(text);
  }
  return values;
}

export function isOnboardingUniqueField(name: string): name is OnboardingUniqueField {
  return (ONBOARDING_UNIQUE_FIELDS as readonly string[]).includes(name);
}

export function toUniqueConflictRecord(value: unknown): UniqueConflictRecord | null {
  const record = asRecord(value);
  if (!record) return null;

  const employeeId = readText(record, ["Employee_id", "employee_id"])[0];
  const onboardId = readText(record, ["Onboard_id", "onboard_id"])[0];
  const values = {
    Device_user_id: readText(record, UNIQUE_FIELD_CONFIG.Device_user_id.keys).map(
      UNIQUE_FIELD_CONFIG.Device_user_id.normalize,
    ),
    Id_card_number: readText(record, UNIQUE_FIELD_CONFIG.Id_card_number.keys).map(
      UNIQUE_FIELD_CONFIG.Id_card_number.normalize,
    ),
    Work_email: readText(record, UNIQUE_FIELD_CONFIG.Work_email.keys).map(
      UNIQUE_FIELD_CONFIG.Work_email.normalize,
    ),
    Username: readText(record, UNIQUE_FIELD_CONFIG.Username.keys).map(
      UNIQUE_FIELD_CONFIG.Username.normalize,
    ),
  };

  if (
    !values.Device_user_id.length &&
    !values.Id_card_number.length &&
    !values.Work_email.length &&
    !values.Username.length
  ) {
    return null;
  }

  return {
    Employee_id: employeeId,
    Onboard_id: onboardId,
    values,
  };
}

export function collectUniqueConflictRecords(sources: unknown[]): UniqueConflictRecord[] {
  return sources
    .map((source) => toUniqueConflictRecord(source))
    .filter((record): record is UniqueConflictRecord => Boolean(record));
}

function isSameRecord(
  record: UniqueConflictRecord,
  exclude: { employeeId?: string; onboardId?: string },
): boolean {
  const employeeId = String(exclude.employeeId ?? "").trim();
  const onboardId = String(exclude.onboardId ?? "").trim();
  if (employeeId && record.Employee_id && String(record.Employee_id) === employeeId) return true;
  if (onboardId && record.Onboard_id && String(record.Onboard_id) === onboardId) return true;
  return false;
}

export function getUniqueFieldError(
  fieldName: OnboardingUniqueField,
  rawValue: unknown,
  records: UniqueConflictRecord[],
  exclude: { employeeId?: string; onboardId?: string },
): string | undefined {
  if (rawValue === undefined || rawValue === null || rawValue === false) return undefined;
  const config = UNIQUE_FIELD_CONFIG[fieldName];
  const value = config.normalize(String(rawValue));
  if (!value) return undefined;

  const taken = records.some((record) => {
    if (isSameRecord(record, exclude)) return false;
    return record.values[fieldName].includes(value);
  });

  return taken ? config.message : undefined;
}

export function getOnboardingUniqueErrors(
  values: Record<string, unknown>,
  records: UniqueConflictRecord[],
  exclude: { employeeId?: string; onboardId?: string },
): Record<string, string> {
  const errors: Record<string, string> = {};
  ONBOARDING_UNIQUE_FIELDS.forEach((fieldName) => {
    const error = getUniqueFieldError(fieldName, values[fieldName], records, exclude);
    if (error) errors[fieldName] = error;
  });
  return errors;
}
