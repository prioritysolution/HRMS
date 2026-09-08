export type HolidayRemark = {
  date: string;
  names: string[];
  description: string;
};

export const HOLIDAY_REMARKS: HolidayRemark[] = [
  {
    date: "2026-01-01",
    names: ["new year"],
    description: "First day of the year. Let's celebrate new beginnings!",
  },
  {
    date: "2026-01-23",
    names: ["netaji", "saraswati"],
    description: "Birth anniversary of Netaji Subhas Chandra Bose and Saraswati Puja.",
  },
  {
    date: "2026-01-26",
    names: ["republic day"],
    description: "Anniversary of the Constitution of India coming into effect.",
  },
  {
    date: "2026-02-04",
    names: ["shab-e-barat", "shab e barat"],
    description: "Night of forgiveness, observed by the Muslim community.",
  },
  {
    date: "2026-03-03",
    names: ["holi", "doljatra", "dol jatra"],
    description: "Festival of colors, marking the arrival of spring.",
  },
  {
    date: "2026-03-21",
    names: ["eid-ul-fitr", "eid ul fitr", "eid"],
    description: "Festival marking the end of Ramadan.",
  },
  {
    date: "2026-04-15",
    names: ["bengali new year", "pohela boishakh"],
    description: "Bengali New Year, the first day of the Bengali calendar.",
  },
  {
    date: "2026-05-01",
    names: ["labour day", "labor day", "may day"],
    description: "Celebration of laborers and the working classes.",
  },
  {
    date: "2026-05-27",
    names: ["id-ud-zoha", "eid-ul-adha", "bakrid"],
    description: "Festival of sacrifice, observed by the Muslim community.",
  },
  {
    date: "2026-08-15",
    names: ["independence day"],
    description: "Commemorating the Independence of India in 1947.",
  },
  {
    date: "2026-09-07",
    names: ["ganesh chaturthi"],
    description: "Hindu festival celebrating the birth of Lord Ganesha.",
  },
  {
    date: "2026-10-02",
    names: ["gandhi jayanti"],
    description: "Birth anniversary of Mahatma Gandhi, the father of the nation.",
  },
  {
    date: "2026-10-23",
    names: ["dussehra"],
    description: "Vijayadashami festival marking the victory of good over evil.",
  },
  {
    date: "2026-11-12",
    names: ["diwali"],
    description: "Festival of lights, one of the most popular Hindu festivals.",
  },
  {
    date: "2026-12-25",
    names: ["christmas"],
    description: "Annual festival commemorating the birth of Jesus Christ.",
  },
];

function toIsoDate(value: string): string {
  const trimmed = value.trim().slice(0, 10);
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return trimmed;
  const display = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (display) return `${display[3]}-${display[2]}-${display[1]}`;
  return trimmed;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function lookupHolidayDescription(date: string, name: string): string {
  const isoDate = toIsoDate(date);
  const holidayName = normalizeName(name);

  const byDate = HOLIDAY_REMARKS.find((item) => item.date === isoDate);
  if (byDate) return byDate.description;

  if (!holidayName) return "";

  const byName = HOLIDAY_REMARKS.find((item) =>
    item.names.some((alias) => holidayName.includes(alias) || alias.includes(holidayName)),
  );
  return byName?.description ?? "";
}
