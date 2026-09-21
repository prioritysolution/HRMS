import type { AppLanguage } from "@/i18n/types";
import { DEFAULT_LANGUAGE } from "@/i18n/config";
import { getDictionary, translate } from "@/i18n/dictionaries";

type EssLookupGroup = "titles" | "headers" | "labels" | "options";

function readEssGroup(
  language: AppLanguage,
  group: EssLookupGroup,
): Record<string, string> | undefined {
  const ess = getDictionary(language).ess;
  if (!ess || typeof ess !== "object") return undefined;
  const map = (ess as Record<string, unknown>)[group];
  if (!map || typeof map !== "object") return undefined;
  return map as Record<string, string>;
}

/** Translate ESS config English text (title/header/label/option). Falls back to original. */
export function translateEssLookup(
  language: AppLanguage,
  group: EssLookupGroup,
  text: string,
): string {
  if (!text) return text;
  const primary = readEssGroup(language, group)?.[text];
  if (primary) return primary;
  if (language !== DEFAULT_LANGUAGE) {
    const fallback = readEssGroup(DEFAULT_LANGUAGE, group)?.[text];
    if (fallback) return fallback;
  }
  return text;
}

export function translateEssDescription(language: AppLanguage, moduleId: string): string {
  const key = `ess.descriptions.${moduleId}`;
  const value = translate(language, key);
  return value === key ? "" : value;
}

export function translateEssEmpty(language: AppLanguage, moduleId: string, title: string): string {
  const keyed = `ess.empty.${moduleId}`;
  const value = translate(language, keyed);
  if (value !== keyed) return value;
  return translate(language, "ess.empty.default", { title: title.toLowerCase() });
}

const GREETINGS: Record<AppLanguage, Record<string, string>> = {
  en: {
    "good morning": "Good Morning",
    "good afternoon": "Good Afternoon",
    "good evening": "Good Evening",
    hello: "Hello",
    hi: "Hi",
  },
  bn: {
    "good morning": "শুভ সকাল",
    "good afternoon": "শুভ অপরাহ্ন",
    "good evening": "শুভ সন্ধ্যা",
    hello: "হ্যালো",
    hi: "হ্যালো",
  },
  hi: {
    "good morning": "सुप्रभात",
    "good afternoon": "शुभ दोपहर",
    "good evening": "शुभ संध्या",
    hello: "नमस्ते",
    hi: "नमस्ते",
  },
  or: {
    "good morning": "ଶୁଭ ସକାଳ",
    "good afternoon": "ଶୁଭ ଅପରାହ୍ନ",
    "good evening": "ଶୁଭ ସନ୍ଧ୍ୟା",
    hello: "ନମସ୍କାର",
    hi: "ନମସ୍କାର",
  },
};

export function translateGreeting(language: AppLanguage, greeting: string): string {
  if (!greeting) return GREETINGS[language]?.[ "good morning" ] ?? greeting;
  const key = greeting.trim().toLowerCase();
  return GREETINGS[language]?.[key] ?? greeting;
}

const MONTH_NAMES: Record<AppLanguage, Record<string, string>> = {
  en: {
    january: "January", jan: "Jan",
    february: "February", feb: "Feb",
    march: "March", mar: "Mar",
    april: "April", apr: "Apr",
    may: "May",
    june: "June", jun: "Jun",
    july: "July", jul: "Jul",
    august: "August", aug: "Aug",
    september: "September", sep: "Sep", sept: "Sept",
    october: "October", oct: "Oct",
    november: "November", nov: "Nov",
    december: "December", dec: "Dec",
  },
  bn: {
    january: "জানুয়ারি", jan: "জানু",
    february: "ফেব্রুয়ারি", feb: "ফেব্রু",
    march: "মার্চ", mar: "মার্চ",
    april: "এপ্রিল", apr: "এপ্রিল",
    may: "মে",
    june: "জুন", jun: "জুন",
    july: "জুলাই", jul: "জুলাই",
    august: "আগস্ট", aug: "আগস্ট",
    september: "সেপ্টেম্বর", sep: "সেপ্টে", sept: "সেপ্টে",
    october: "অক্টোবর", oct: "অক্টো",
    november: "নভেম্বর", nov: "নভে",
    december: "ডিসেম্বর", dec: "ডিসে",
  },
  hi: {
    january: "जनवरी", jan: "जन",
    february: "फरवरी", feb: "फर",
    march: "मार्च", mar: "मार्च",
    april: "अप्रैल", apr: "अप्रैल",
    may: "मई",
    june: "जून", jun: "जून",
    july: "जुलाई", jul: "जुलाई",
    august: "अगस्त", aug: "अग",
    september: "सितंबर", sep: "सित", sept: "सित",
    october: "अक्टूबर", oct: "अक्टू",
    november: "नवंबर", nov: "नव",
    december: "दिसंबर", dec: "दिस",
  },
  or: {
    january: "ଜାନୁଆରୀ", jan: "ଜାନୁ",
    february: "ଫେବୃଆରୀ", feb: "ଫେବୃ",
    march: "ମାର୍ଚ୍ଚ", mar: "ମାର୍ଚ୍ଚ",
    april: "ଏପ୍ରିଲ୍", apr: "ଏପ୍ରିଲ୍",
    may: "ମେ",
    june: "ଜୁନ୍", jun: "ଜୁନ୍",
    july: "ଜୁଲାଇ", jul: "ଜୁଲାଇ",
    august: "ଅଗଷ୍ଟ", aug: "ଅଗଷ୍ଟ",
    september: "ସେପ୍ଟେମ୍ବର", sep: "ସେପ୍ଟେ", sept: "ସେପ୍ଟେ",
    october: "ଅକ୍ଟୋବର", oct: "ଅକ୍ଟୋ",
    november: "ନଭେମ୍ବର", nov: "ନଭେ",
    december: "ଡିସେମ୍ବର", dec: "ଡିସେ",
  },
};

export function translateMonthName(language: AppLanguage, month: string): string {
  if (!month) return month;
  const key = month.trim().toLowerCase();
  return MONTH_NAMES[language]?.[key] ?? month;
}

const DAYS_OF_WEEK: Record<AppLanguage, Record<string, string>> = {
  en: {
    monday: "Monday", mon: "Mon",
    tuesday: "Tuesday", tue: "Tue",
    wednesday: "Wednesday", wed: "Wed",
    thursday: "Thursday", thu: "Thu",
    friday: "Friday", fri: "Fri",
    saturday: "Saturday", sat: "Sat",
    sunday: "Sunday", sun: "Sun",
  },
  bn: {
    monday: "সোমবার", mon: "সোম",
    tuesday: "মঙ্গলবার", tue: "মঙ্গল",
    wednesday: "বুধবার", wed: "বুধ",
    thursday: "বৃহস্পতিবার", thu: "বৃহস্পতি",
    friday: "শুক্রবার", fri: "শুক্র",
    saturday: "শনিবার", sat: "শনি",
    sunday: "রবিবার", sun: "রবি",
  },
  hi: {
    monday: "सोमवार", mon: "सोम",
    tuesday: "मंगलवार", tue: "मंगल",
    wednesday: "बुधवार", wed: "बुध",
    thursday: "गुरुवार", thu: "गुरु",
    friday: "शुक्रवार", fri: "शुक्र",
    saturday: "शनिवार", sat: "शनि",
    sunday: "रविवार", sun: "रवि",
  },
  or: {
    monday: "ସୋମବାର", mon: "ସୋମ",
    tuesday: "ମଙ୍ଗଳବାର", tue: "ମଙ୍ଗଳ",
    wednesday: "ବୁଧବାର", wed: "ବୁଧ",
    thursday: "ଗୁରୁବାର", thu: "ଗୁରୁ",
    friday: "ଶୁକ୍ରବାର", fri: "ଶୁକ୍ର",
    saturday: "ଶନିବାର", sat: "ଶନି",
    sunday: "ରବିବାର", sun: "ରବି",
  },
};

export function translateDayOfWeek(language: AppLanguage, day: string): string {
  if (!day) return day;
  const key = day.trim().toLowerCase();
  return DAYS_OF_WEEK[language]?.[key] ?? day;
}

export function formatLocalizedDateString(language: AppLanguage, dateStr: string): string {
  if (!dateStr) return dateStr;
  return dateStr.replace(/\b([A-Za-z]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    if (DAYS_OF_WEEK[language]?.[lower]) return DAYS_OF_WEEK[language][lower];
    if (MONTH_NAMES[language]?.[lower]) return MONTH_NAMES[language][lower];
    return match;
  });
}

const ATTENDANCE_STATUSES: Record<AppLanguage, Record<string, string>> = {
  en: {
    absent: "ABSENT",
    present: "PRESENT",
    leave: "LEAVE",
    late: "LATE",
    holiday: "HOLIDAY",
    "weekly off": "WEEKLY OFF",
    "not marked": "NOT MARKED",
  },
  bn: {
    absent: "অনুপস্থিত",
    present: "উপস্থিত",
    leave: "ছুটি",
    late: "লেট",
    holiday: "ছুটির দিন",
    "weekly off": "সাপ্তাহিক ছুটি",
    "not marked": "চিহ্নিত নয়",
  },
  hi: {
    absent: "अनुपस्थित",
    present: "उपस्थित",
    leave: "छुट्टी",
    late: "देरी",
    holiday: "अवकाश",
    "weekly off": "साप्ताहिक छुट्टी",
    "not marked": "अंकन नहीं",
  },
  or: {
    absent: "ଅନୁପସ୍ଥିତ",
    present: "ଉପସ୍ଥିତି",
    leave: "ଛୁଟି",
    late: "ବିଳମ୍ବ",
    holiday: "ଛୁଟିଦିନ",
    "weekly off": "ସାପ୍ତାହିକ ଛୁଟି",
    "not marked": "ଚିହ୍ନଟ ନୁହେଁ",
  },
};

export function translateAttendanceStatus(language: AppLanguage, status: string): string {
  if (!status) return status;
  const key = status.trim().toLowerCase();
  return ATTENDANCE_STATUSES[language]?.[key] ?? status;
}
