import type { HrmsRow } from "@/types/hrms";
import type {
  ReportCardTitle,
  ReportExportColumn,
  ReportFieldGroup,
  ReportPdfOptions,
} from "@/lib/report-export/types";
import {
  REPORT_BORDER,
  REPORT_CARD_BG,
  REPORT_PRIMARY,
  REPORT_TEXT_DARK,
  REPORT_TEXT_MUTED,
  defaultFilename,
  displayValue,
  formatGeneratedAt,
  loadImageDataUrl,
  resolveBrand,
} from "@/lib/report-export/utils";

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  getNumberOfPages: () => number;
  setPage: (page: number) => void;
  addPage: () => void;
  setFillColor: (...args: number[]) => void;
  setDrawColor: (...args: number[]) => void;
  setTextColor: (...args: number[]) => void;
  setFont: (name: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (width: number) => void;
  text: (text: string | string[], x: number, y: number, options?: object) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  roundedRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  splitTextToSize: (text: string, size: number) => string[];
  getTextWidth: (text: string) => number;
  save: (filename: string) => void;
};

type LogoAsset = { dataUrl: string; format: "PNG" | "JPEG" | "WEBP" };

type LetterheadContext = {
  doc: JsPdfDoc;
  pageWidth: number;
  pageHeight: number;
  marginX: number;
  contentWidth: number;
  bottomLimit: number;
  /** Y where page body content should start (below heading). */
  contentStartY: number;
  /** Draw logo + company + title heading on the current page. */
  drawHeading: () => number;
};

function normalizeMultiline(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function drawReportHeading(
  doc: JsPdfDoc,
  options: {
    pageWidth: number;
    marginX: number;
    companyName: string;
    title: string;
    meta: string;
    logo: LogoAsset | null;
  },
): number {
  const { pageWidth, marginX, companyName, title, meta, logo } = options;
  let y = 28;

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 8, "F");
  doc.setFillColor(...REPORT_PRIMARY);
  doc.rect(0, 0, pageWidth, 4, "F");

  let logoDrawn = false;
  if (logo) {
    try {
      doc.addImage(logo.dataUrl, logo.format, marginX, y, 96, 34);
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  const textX = logoDrawn ? marginX + 110 : marginX;
  const textWidth = pageWidth - textX - marginX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...REPORT_PRIMARY);
  const companyLines = doc.splitTextToSize(companyName, textWidth);
  doc.text(companyLines, textX, y + 12);
  y += Math.max(logoDrawn ? 34 : 0, companyLines.length * 14 + 4) + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...REPORT_TEXT_DARK);
  doc.text(title, marginX, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...REPORT_TEXT_MUTED);
  doc.text(meta, marginX, y);
  y += 12;

  doc.setDrawColor(...REPORT_PRIMARY);
  doc.setLineWidth(1.25);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 16;

  return y;
}

async function createLetterheadDoc(options: {
  title: string;
  filterSummary?: string;
  recordCount: number;
  brand?: ReportPdfOptions["brand"];
  orientation?: "portrait" | "landscape";
}): Promise<LetterheadContext> {
  const { jsPDF } = await import("jspdf");
  const brand = resolveBrand(options.brand);
  const doc = new jsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "pt",
    format: "a4",
  }) as unknown as JsPdfDoc;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 48;
  const logo = await loadImageDataUrl(brand.logoUrl);
  const meta = [
    `Generated: ${formatGeneratedAt()}`,
    options.filterSummary ?? `Total records: ${options.recordCount}`,
  ].join("   ·   ");

  const drawHeading = () =>
    drawReportHeading(doc, {
      pageWidth,
      marginX,
      companyName: brand.companyName,
      title: options.title,
      meta,
      logo,
    });

  const contentStartY = drawHeading();

  return {
    doc,
    pageWidth,
    pageHeight,
    marginX,
    contentWidth,
    bottomLimit,
    contentStartY,
    drawHeading,
  };
}

function drawPageChrome(
  doc: JsPdfDoc,
  pageWidth: number,
  pageHeight: number,
  pageNumber: number,
  pageCount: number,
  reportTitle: string,
) {
  doc.setDrawColor(...REPORT_BORDER);
  doc.setLineWidth(0.6);
  doc.line(36, pageHeight - 32, pageWidth - 36, pageHeight - 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...REPORT_TEXT_MUTED);
  const left = `PrioHRM · ${reportTitle}`;
  doc.text(doc.splitTextToSize(left, pageWidth - 160)[0] ?? left, 36, pageHeight - 18);
  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 36, pageHeight - 18, {
    align: "right",
  });
}

function finalizePages(doc: JsPdfDoc, pageWidth: number, pageHeight: number, title: string) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawPageChrome(doc, pageWidth, pageHeight, page, pageCount, title);
  }
}

function valueLines(doc: JsPdfDoc, value: string, width: number): string[] {
  return doc.splitTextToSize(normalizeMultiline(value), width);
}

function measureFieldHeight(doc: JsPdfDoc, value: string, width: number): number {
  const lines = valueLines(doc, value, width);
  return 11 + lines.length * 11 + 10;
}

function drawField(
  doc: JsPdfDoc,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...REPORT_TEXT_MUTED);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...REPORT_TEXT_DARK);
  const lines = valueLines(doc, value, width);
  doc.text(lines, x, y + 11);
  return measureFieldHeight(doc, value, width);
}

function isFullWidthField(field: ReportExportColumn, value: string): boolean {
  if (field.fullWidth) return true;
  return normalizeMultiline(value).includes("\n") || value.length > 42;
}

function estimateCardHeight(
  doc: JsPdfDoc,
  groups: ReportFieldGroup[],
  row: HrmsRow,
  colWidth: number,
  fullWidth: number,
): number {
  let height = 34 + 14;
  for (const group of groups) {
    height += 24;
    let i = 0;
    while (i < group.fields.length) {
      const left = group.fields[i];
      const leftValue = displayValue(row[left.key]);
      if (isFullWidthField(left, leftValue) || !group.fields[i + 1]) {
        height += measureFieldHeight(doc, leftValue, fullWidth);
        i += 1;
        continue;
      }
      const right = group.fields[i + 1];
      const rightValue = displayValue(row[right.key]);
      if (isFullWidthField(right, rightValue)) {
        height += measureFieldHeight(doc, leftValue, colWidth);
        height += measureFieldHeight(doc, rightValue, fullWidth);
        i += 2;
        continue;
      }
      height += Math.max(
        measureFieldHeight(doc, leftValue, colWidth),
        measureFieldHeight(doc, rightValue, colWidth),
      );
      i += 2;
    }
    height += 8;
  }
  return height + 8;
}

function resolveCardTitle(
  row: HrmsRow,
  index: number,
  cardTitle?: ReportCardTitle,
): { primary: string; secondary: string; badge: string } {
  const primaryKey = cardTitle?.primaryKey ?? "Display_name";
  const secondaryKey = cardTitle?.secondaryKey;
  const badgeKey = cardTitle?.badgeKey;

  const primary = displayValue(row[primaryKey]);
  const secondary = secondaryKey ? displayValue(row[secondaryKey]) : "";
  const badge = badgeKey ? displayValue(row[badgeKey]) : "";

  return {
    primary: primary === "—" ? `Record ${index + 1}` : primary,
    secondary: secondary === "—" ? "" : secondary,
    badge: badge === "—" ? "" : badge,
  };
}

async function exportCardsPdf(options: ReportPdfOptions) {
  const {
    doc,
    pageWidth,
    pageHeight,
    marginX,
    contentWidth,
    bottomLimit,
    contentStartY,
    drawHeading,
  } = await createLetterheadDoc({
    title: options.title,
    filterSummary: options.filterSummary,
    recordCount: options.rows.length,
    brand: options.brand,
    orientation: options.orientation ?? "portrait",
  });

  const cardPad = 12;
  const colGap = 18;
  const innerWidth = contentWidth - cardPad * 2;
  const colWidth = (innerWidth - colGap) / 2;
  const groups: ReportFieldGroup[] =
    options.fieldGroups && options.fieldGroups.length > 0
      ? options.fieldGroups
      : [{ title: "Details", fields: options.columns }];

  let y = contentStartY;

  options.rows.forEach((row, index) => {
    const { primary, secondary, badge } = resolveCardTitle(row, index, options.cardTitle);
    const estimated = estimateCardHeight(doc, groups, row, colWidth, innerWidth);

    if (estimated > bottomLimit - y && y > contentStartY + 4) {
      doc.addPage();
      y = drawHeading();
    }

    const cardTop = y;
    const headerH = 30;

    const titleLeft = `${index + 1}.  ${primary}`;
    const metaParts = [secondary, badge].filter(Boolean);
    const metaText = metaParts.join("  ·  ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const metaWidth = metaText
      ? Math.min(doc.getTextWidth(metaText) + 10, contentWidth * 0.4)
      : 0;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    const titleMaxWidth = contentWidth - cardPad * 2 - metaWidth - 8;
    const titleLine =
      doc.splitTextToSize(titleLeft, Math.max(titleMaxWidth, 120))[0] ?? titleLeft;

    // Card shell
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...REPORT_BORDER);
    doc.setLineWidth(0.9);
    doc.roundedRect(marginX, cardTop, contentWidth, estimated, 5, 5, "FD");

    // Header
    doc.setFillColor(...REPORT_PRIMARY);
    doc.roundedRect(marginX, cardTop, contentWidth, headerH, 5, 5, "F");
    doc.rect(marginX, cardTop + 14, contentWidth, headerH - 14, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(titleLine, marginX + cardPad, cardTop + 19);
    if (metaText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(metaText, marginX + contentWidth - cardPad, cardTop + 19, {
        align: "right",
      });
    }

    let cursor = cardTop + headerH + cardPad;

    for (const group of groups) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...REPORT_PRIMARY);
      doc.text(group.title.toUpperCase(), marginX + cardPad, cursor);
      cursor += 5;
      doc.setDrawColor(...REPORT_BORDER);
      doc.setLineWidth(0.5);
      doc.line(marginX + cardPad, cursor, marginX + contentWidth - cardPad, cursor);
      cursor += 12;

      let i = 0;
      while (i < group.fields.length) {
        const left = group.fields[i];
        const leftValue = displayValue(row[left.key]);

        if (isFullWidthField(left, leftValue)) {
          cursor += drawField(
            doc,
            left.header,
            leftValue,
            marginX + cardPad,
            cursor,
            innerWidth,
          );
          i += 1;
          continue;
        }

        const right = group.fields[i + 1];
        if (!right) {
          cursor += drawField(
            doc,
            left.header,
            leftValue,
            marginX + cardPad,
            cursor,
            colWidth,
          );
          i += 1;
          continue;
        }

        const rightValue = displayValue(row[right.key]);
        if (isFullWidthField(right, rightValue)) {
          cursor += drawField(
            doc,
            left.header,
            leftValue,
            marginX + cardPad,
            cursor,
            colWidth,
          );
          cursor += drawField(
            doc,
            right.header,
            rightValue,
            marginX + cardPad,
            cursor,
            innerWidth,
          );
          i += 2;
          continue;
        }

        const leftH = drawField(
          doc,
          left.header,
          leftValue,
          marginX + cardPad,
          cursor,
          colWidth,
        );
        const rightH = drawField(
          doc,
          right.header,
          rightValue,
          marginX + cardPad + colWidth + colGap,
          cursor,
          colWidth,
        );
        cursor += Math.max(leftH, rightH);
        i += 2;
      }

      cursor += 6;
    }

    const cardBottom = Math.max(cursor + 4, cardTop + estimated);
    doc.setDrawColor(...REPORT_BORDER);
    doc.setLineWidth(0.9);
    doc.roundedRect(marginX, cardTop, contentWidth, cardBottom - cardTop, 5, 5, "S");

    y = cardBottom + 14;
  });

  finalizePages(doc, pageWidth, pageHeight, options.title);
  doc.save(options.filename ?? defaultFilename(options.title, "pdf"));
}

async function exportTablePdf(options: ReportPdfOptions) {
  const [{ default: autoTable }] = await Promise.all([import("jspdf-autotable")]);

  const orientation =
    options.orientation ?? (options.columns.length > 8 ? "landscape" : "portrait");

  const {
    doc,
    pageWidth,
    pageHeight,
    marginX,
    contentStartY,
    drawHeading,
  } = await createLetterheadDoc({
    title: options.title,
    filterSummary: options.filterSummary,
    recordCount: options.rows.length,
    brand: options.brand,
    orientation,
  });

  autoTable(doc as never, {
    startY: contentStartY,
    head: [["SI No.", ...options.columns.map((column) => column.header)]],
    body: options.rows.map((row, index) => [
      String(index + 1),
      ...options.columns.map((column) => displayValue(row[column.key])),
    ]),
    styles: {
      fontSize: orientation === "landscape" ? 7.5 : 8,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "top",
      textColor: REPORT_TEXT_DARK,
      lineColor: REPORT_BORDER,
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: REPORT_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: REPORT_CARD_BG,
    },
    margin: {
      left: marginX,
      right: marginX,
      top: contentStartY,
      bottom: 44,
    },
    // Redraw report heading on every page (page 1 already has it from createLetterheadDoc).
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) {
        drawHeading();
      }
    },
  });

  finalizePages(doc, pageWidth, pageHeight, options.title);
  doc.save(options.filename ?? defaultFilename(options.title, "pdf"));
}

/** Common PDF template used by all reports (`cards` or `table`). */
export async function exportReportPdf(options: ReportPdfOptions) {
  if (!options.columns?.length && !options.fieldGroups?.length) {
    throw new Error("Report PDF requires columns or fieldGroups.");
  }

  const layout = options.layout ?? (options.fieldGroups?.length ? "cards" : "table");
  if (layout === "cards") {
    await exportCardsPdf({
      ...options,
      columns: options.columns?.length
        ? options.columns
        : (options.fieldGroups ?? []).flatMap((group) => group.fields),
    });
    return;
  }

  await exportTablePdf(options);
}
