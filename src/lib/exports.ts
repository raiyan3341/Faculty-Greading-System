import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportMeta = {
  heading: string;
  subheading: string;
  lines: string[];
};

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function downloadXlsx(
  filename: string,
  sheetName: string,
  columns: string[],
  rows: (string | number)[][],
) {
  const sheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 30));
  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  saveBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

export function buildReportPdf(
  meta: ReportMeta,
  columns: string[],
  rows: (string | number)[][],
): jsPDF {
  const doc = new jsPDF({ orientation: columns.length > 8 ? "landscape" : "portrait", unit: "pt" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(meta.heading, pageWidth / 2, 46, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(meta.subheading, pageWidth / 2, 64, { align: "center" });

  doc.setFontSize(9);
  let y = 86;
  meta.lines.forEach((line) => {
    doc.text(line, 40, y);
    y += 13;
  });

  autoTable(doc, {
    head: [columns],
    body: rows.map((r) => r.map((c) => String(c ?? ""))),
    startY: y + 6,
    styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 195, 180], lineWidth: 0.4 },
    headStyles: { fillColor: [33, 44, 41], textColor: [244, 241, 233], fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 246, 240] },
    theme: "grid",
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  doc.setFontSize(9);
  doc.text("Faculty signature: ______________________", 40, Math.min(finalY + 42, doc.internal.pageSize.getHeight() - 30));
  doc.text(
    `Generated ${new Date().toLocaleDateString()}`,
    pageWidth - 40,
    Math.min(finalY + 42, doc.internal.pageSize.getHeight() - 30),
    { align: "right" },
  );
  return doc;
}

export function downloadPdf(
  filename: string,
  meta: ReportMeta,
  columns: string[],
  rows: (string | number)[][],
) {
  buildReportPdf(meta, columns, rows).save(filename);
}

export function pdfPreviewUrl(
  meta: ReportMeta,
  columns: string[],
  rows: (string | number)[][],
): string {
  return buildReportPdf(meta, columns, rows).output("datauristring");
}
