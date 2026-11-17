import { jsPDF } from "jspdf";
// import { commonStyles } from "./default";

export type StudentPassword = { code: string; password: string };

/**
 * Render a printable credentials sheet for a group.
 * Layout: purple header, table of Code | Password in two centered columns
 * with a vertical divider, footer on every page.
 */
export function generateGroupPasswordsPdf(
  group: string,
  rows: StudentPassword[],
  options?: { teacherName?: string }
) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  // ── palette (from commonStyles) ───────────────────────────────────
  const PURPLE: [number, number, number] = [170, 59, 255];      // #aa3bff
  const CLEAR_PURPLE: [number, number, number] = [192, 132, 252]; // #c084fc
  const FADED_PURPLE: [number, number, number] = [240, 227, 255]; // light tint of #c084fc
  const WHITE: [number, number, number] = [255, 255, 255];
  const DARK: [number, number, number] = [40, 20, 60];

  // ── page geometry ─────────────────────────────────────────────────
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 48;
  const marginBottom = 48;

  // Two-column layout
  const contentW = pageW - marginX * 2;
  const centerX = pageW / 2;
  const colLeftCenterX = marginX + contentW / 4;
  const colRightCenterX = marginX + (contentW * 3) / 4;

  // ── header band ───────────────────────────────────────────────────
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageW, 110, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("TestMe", marginX, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Group Credentials", marginX, 70);

  if (options?.teacherName) {
    doc.setFontSize(10);
    doc.text(`Teacher: ${options.teacherName}`, marginX, 86);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(62);
  doc.text(group, pageW - marginX, 72, { align: "right" });

  // ── subtitle / date ───────────────────────────────────────────────
  let y = 140;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const generated = new Date().toLocaleString();
  doc.text(`Generated: ${generated}`, marginX, y);
  doc.text(`Total students: ${rows.length}`, pageW - marginX, y, { align: "right" });

  // ── table header (centered in each column) ────────────────────────
  y += 22;
  const rowH = 24;

  doc.setFillColor(...FADED_PURPLE);
  doc.rect(marginX, y, contentW, rowH, "F");

  doc.setTextColor(...PURPLE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Code", colLeftCenterX, y + 16, { align: "center" });
  doc.text("Password", colRightCenterX, y + 16, { align: "center" });

  // vertical divider in the header
  doc.setDrawColor(...CLEAR_PURPLE);
  doc.setLineWidth(0.75);
  doc.line(centerX, y, centerX, y + rowH);

  y += rowH;

  // ── rows ──────────────────────────────────────────────────────────
  for (let i = 0; i < rows.length; i++) {
    // page break if needed
    if (y + rowH > pageH - marginBottom - 20) {
      doc.addPage();
      y = marginTop;
    }

    // zebra stripe
    if (i % 2 === 1) {
      doc.setFillColor(...FADED_PURPLE);
      doc.rect(marginX, y, contentW, rowH, "F");
    }

    // horizontal row separator
    doc.setDrawColor(...CLEAR_PURPLE);
    doc.setLineWidth(0.4);
    doc.line(marginX, y + rowH, pageW - marginX, y + rowH);

    // vertical divider through the row
    doc.setDrawColor(...CLEAR_PURPLE);
    doc.setLineWidth(0.4);
    doc.line(centerX, y, centerX, y + rowH);

    // code (centered in left column)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PURPLE);
    doc.text(rows[i].code, colLeftCenterX, y + 16, { align: "center" });

    // password (centered in right column, monospace)
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(rows[i].password, colRightCenterX, y + 16, { align: "center" });

    y += rowH;
  }

  // ── empty state ───────────────────────────────────────────────────
  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...PURPLE);
    doc.text("No students in this group.", centerX, y + 16, { align: "center" });
    y += rowH;
  }

  // ── footer on each page ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PURPLE);
    // doc.text(
    //   "Keep this document secure — it contains plaintext credentials.",
    //   marginX,
    //   pageH - 24
    // );
    doc.text(
      `Page ${p} of ${pageCount}`,
      pageW - marginX,
      pageH - 24,
      { align: "right" }
    );
  }

  // ── save ──────────────────────────────────────────────────────────
  doc.save(`TestME Group (${group}) Passwords.pdf`);
}