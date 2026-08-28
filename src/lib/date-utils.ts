const DISPLAY_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDateDisplay(value: string): string {
  if (!value) return "";

  const iso = value.match(ISO_PATTERN);
  if (iso) {
    return `${iso[3]}-${iso[2]}-${iso[1]}`;
  }

  const display = value.match(DISPLAY_PATTERN);
  if (display) return value;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${pad2(parsed.getDate())}-${pad2(parsed.getMonth() + 1)}-${parsed.getFullYear()}`;
  }

  return value;
}

export function parseDateToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const display = trimmed.match(DISPLAY_PATTERN);
  if (display) {
    return `${display[3]}-${display[2]}-${display[1]}`;
  }

  const iso = trimmed.match(ISO_PATTERN);
  if (iso) return trimmed;

  return "";
}

export function isValidDateValue(value: string): boolean {
  const iso = parseDateToIso(value);
  if (!iso) return value.trim() === "";

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isoToDate(iso: string): Date | null {
  if (!iso || !isValidDateValue(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function formatInputMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function getCalendarDays(viewDate: Date): Array<{ date: Date; inMonth: boolean }> {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === month };
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
