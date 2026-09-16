import type { HrmsRow } from "@/types/hrms";
import type { ReportBrand } from "@/lib/report-export/types";

export const REPORT_PRIMARY: [number, number, number] = [70, 102, 225];
export const REPORT_TEXT_MUTED: [number, number, number] = [100, 116, 139];
export const REPORT_TEXT_DARK: [number, number, number] = [15, 23, 42];
export const REPORT_BORDER: [number, number, number] = [226, 232, 240];
export const REPORT_CARD_BG: [number, number, number] = [248, 250, 252];
export const DEFAULT_REPORT_LOGO = "/images/logos/logo-light.png";

export const DEFAULT_REPORT_BRAND: ReportBrand = {
  companyName: "PrioHRM",
  logoUrl: DEFAULT_REPORT_LOGO,
};

export function cellText(value: HrmsRow[string]): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function displayValue(value: HrmsRow[string]): string {
  const text = cellText(value).trim();
  return text || "—";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function stamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatGeneratedAt(): string {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function defaultFilename(title: string, ext: "xlsx" | "pdf") {
  return `${title.replace(/\s+/g, "-").toLowerCase()}-${stamp()}.${ext}`;
}

export function resolveBrand(brand?: Partial<ReportBrand>): ReportBrand {
  return {
    companyName: brand?.companyName?.trim() || DEFAULT_REPORT_BRAND.companyName,
    logoUrl: brand?.logoUrl?.trim() || DEFAULT_REPORT_BRAND.logoUrl,
  };
}

export async function loadImageDataUrl(
  url: string,
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read logo"));
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return null;

    const mime = blob.type.toLowerCase();
    const format: "PNG" | "JPEG" | "WEBP" = mime.includes("png")
      ? "PNG"
      : mime.includes("webp")
        ? "WEBP"
        : "JPEG";
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export function estimateColWidth(header: string, rows: HrmsRow[], key: string): number {
  let max = header.length;
  for (const row of rows) {
    const text = cellText(row[key]);
    const longest = text
      .split(/\r?\n/)
      .reduce((lineMax, line) => Math.max(lineMax, line.length), 0);
    max = Math.max(max, longest || text.length);
  }
  return Math.min(Math.max(max + 2, 12), 42);
}

/**
 * Insert soft line breaks so long text wraps in Excel/PDF-friendly cells.
 * Preserves existing newlines and breaks on word boundaries when possible.
 */
export function softWrapText(value: string, maxCharsPerLine = 40): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return "";
  if (maxCharsPerLine < 8) return normalized;

  const wrapParagraph = (paragraph: string): string => {
    if (paragraph.length <= maxCharsPerLine) return paragraph;

    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) return paragraph;

    const lines: string[] = [];
    let current = "";

    const pushChunkedWord = (word: string) => {
      let remaining = word;
      while (remaining.length > maxCharsPerLine) {
        if (current) {
          lines.push(current);
          current = "";
        }
        lines.push(remaining.slice(0, maxCharsPerLine));
        remaining = remaining.slice(maxCharsPerLine);
      }
      current = remaining;
    };

    for (const word of words) {
      if (!current) {
        if (word.length > maxCharsPerLine) {
          pushChunkedWord(word);
        } else {
          current = word;
        }
        continue;
      }

      if (`${current} ${word}`.length <= maxCharsPerLine) {
        current = `${current} ${word}`;
        continue;
      }

      lines.push(current);
      if (word.length > maxCharsPerLine) {
        current = "";
        pushChunkedWord(word);
      } else {
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines.join("\n");
  };

  return normalized
    .split("\n")
    .map((paragraph) => wrapParagraph(paragraph.trim()))
    .filter(Boolean)
    .join("\n");
}

export function sheetNameFromTitle(title: string): string {
  const cleaned = title.replace(/[\\/?*[\]:]/g, "").trim() || "Report";
  return cleaned.slice(0, 31);
}
