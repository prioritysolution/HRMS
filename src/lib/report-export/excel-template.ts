import type { ReportExcelOptions } from "@/lib/report-export/types";
import {
  cellText,
  defaultFilename,
  downloadBlob,
  formatGeneratedAt,
  resolveBrand,
  sheetNameFromTitle,
  softWrapText,
} from "@/lib/report-export/utils";

type ExcelJsModule = typeof import("exceljs");
type ExcelFill = import("exceljs").Fill;

const HEADER_FILL: ExcelFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4666E1" },
};

const ALT_ROW_FILL: ExcelFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF8FAFC" },
};

const LONG_TEXT_KEYS = new Set([
  "Remarks",
  "remarks",
  "Identifications",
  "identifications",
  "Active_asset_codes",
  "Description",
  "description",
  "Address",
  "address",
]);

function lineCount(value: string): number {
  return Math.max(1, value.split(/\r?\n/).length);
}

function longestLineWidth(value: string): number {
  return value.split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0);
}

function isLongTextColumn(key: string, header: string): boolean {
  if (LONG_TEXT_KEYS.has(key)) return true;
  const label = header.toLowerCase();
  return (
    label.includes("remark") ||
    label.includes("note") ||
    label.includes("comment") ||
    label.includes("description") ||
    label.includes("identification")
  );
}

function resolveColumnWidth(
  header: string,
  key: string,
  rows: ReportExcelOptions["rows"],
): number {
  if (isLongTextColumn(key, header)) {
    let longest = header.length;
    let totalChars = 0;
    for (const row of rows) {
      const text = cellText(row[key]);
      totalChars = Math.max(totalChars, text.length);
      longest = Math.max(longest, longestLineWidth(text));
    }
    // Wider remarks/notes columns; grow with content but stay printable.
    if (totalChars > 180) return 55;
    if (totalChars > 100) return 48;
    if (longest > 40 || totalChars > 40) return 42;
    return 36;
  }

  let max = header.length;
  for (const row of rows) {
    max = Math.max(max, longestLineWidth(cellText(row[key])));
  }
  // Keep date/time columns readable.
  if (key.toLowerCase().includes("created") || key.toLowerCase().includes("date")) {
    return Math.min(Math.max(max + 2, 18), 24);
  }
  return Math.min(Math.max(max + 2, 12), 36);
}

function estimateRowHeight(lineCountValue: number): number {
  if (lineCountValue <= 1) return 20;
  // Dynamic height from wrapped lines (Excel points ≈ font size + padding).
  const height = 8 + lineCountValue * 16;
  return Math.min(Math.max(height, 20), 420);
}

/** Common Excel template used by all reports (supports real line-break wrap). */
export async function exportReportExcel(options: ReportExcelOptions) {
  const ExcelJS = ((await import("exceljs")) as ExcelJsModule).default;
  const brand = resolveBrand(options.brand);
  const includeSerial = options.includeSerial !== false;
  const generatedAt = formatGeneratedAt();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PrioHRM";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    options.sheetName?.trim() || sheetNameFromTitle(options.title),
  );

  const colCount = options.columns.length + (includeSerial ? 1 : 0);
  const columnWidths = options.columns.map((column) =>
    resolveColumnWidth(column.header, column.key, options.rows),
  );

  const metaRows: string[] = [
    brand.companyName,
    options.title,
    `Generated: ${generatedAt}`,
  ];
  if (options.filterSummary) metaRows.push(options.filterSummary);
  metaRows.push(`Total records: ${options.rows.length}`);

  metaRows.forEach((text, index) => {
    const row = sheet.addRow([text]);
    sheet.mergeCells(row.number, 1, row.number, Math.max(colCount, 1));
    row.font =
      index === 0
        ? { bold: true, size: 14, color: { argb: "FF4666E1" } }
        : index === 1
          ? { bold: true, size: 12, color: { argb: "FF0F172A" } }
          : { size: 10, color: { argb: "FF64748B" } };
    row.alignment = { vertical: "middle", wrapText: true };
    row.height = index === 0 ? 22 : 18;
  });

  sheet.addRow([]);

  const headerValues = [
    ...(includeSerial ? ["SI No."] : []),
    ...options.columns.map((column) => column.header),
  ];
  const headerRow = sheet.addRow(headerValues);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });
  headerRow.height = 20;

  options.rows.forEach((row, index) => {
    const values = [
      ...(includeSerial ? [index + 1] : []),
      ...options.columns.map((column, columnIndex) => {
        const raw = cellText(row[column.key]);
        const width = columnWidths[columnIndex] ?? 20;
        // Soft-wrap using column width so long remarks get more chars per line.
        const charsPerLine = isLongTextColumn(column.key, column.header)
          ? Math.max(28, Math.floor(width) - 1)
          : Math.max(16, Math.floor(width) - 2);
        return softWrapText(raw, charsPerLine);
      }),
    ];
    const dataRow = sheet.addRow(values);
    let maxLines = 1;

    dataRow.eachCell((cell, colNumber) => {
      const raw = String(cell.value ?? "");
      maxLines = Math.max(maxLines, lineCount(raw));
      cell.alignment = {
        vertical: "top",
        horizontal: colNumber === 1 && includeSerial ? "center" : "left",
        wrapText: true,
      };
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (index % 2 === 1) cell.fill = ALT_ROW_FILL;
    });

    dataRow.height = estimateRowHeight(maxLines);
  });

  if (includeSerial) {
    sheet.getColumn(1).width = 8;
  }

  options.columns.forEach((_, index) => {
    sheet.getColumn(index + (includeSerial ? 2 : 1)).width = columnWidths[index];
  });

  sheet.views = [{ state: "frozen", ySplit: headerRow.number }];

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    options.filename ?? defaultFilename(options.title, "xlsx"),
  );
}
