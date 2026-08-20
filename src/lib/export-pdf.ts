import type { Generation } from "./omnilens.types";

const MARGIN = 48;

/** Renders a generation as a 1-page PDF poster and triggers a browser download. */
export async function exportGenerationToPdf(
  gen: Generation,
  opts: { stale: boolean; author?: string | undefined },
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  const line = (text: string, size: number, style: "normal" | "bold" = "normal", gap = 6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentW) as string[];
    for (const l of lines) {
      if (y > pageH - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(l, MARGIN, y);
      y += size * 1.25;
    }
    y += gap;
  };

  doc.setTextColor(20, 30, 45);
  line("OMNILENS AI · 1-PAGE EXECUTIVE POSTER", 9, "bold", 4);
  line(gen.isCustom ? gen.lens : `${gen.lens} lens`, 20, "bold", 8);
  doc.setDrawColor(200, 210, 220);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 18;

  line(gen.brief, 11, "normal", 14);

  // Table
  const cols = ["Metric", "Target", "Risk", "Owner"];
  const widths = [contentW * 0.24, contentW * 0.22, contentW * 0.34, contentW * 0.2];
  const drawRow = (cells: string[], bold: boolean) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9.5 : 9.5);
    const wrapped = cells.map(
      (c, i) => doc.splitTextToSize(c || "—", widths[i]! - 10) as string[],
    );
    const rowH = Math.max(...wrapped.map((w) => w.length)) * 12 + 10;
    if (y + rowH > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    let x = MARGIN;
    wrapped.forEach((w, i) => {
      w.forEach((l, li) => doc.text(l, x, y + 10 + li * 12));
      x += widths[i]!;
    });
    y += rowH;
    doc.setDrawColor(225, 232, 240);
    doc.line(MARGIN, y, pageW - MARGIN, y);
  };

  drawRow(cols, true);
  for (const r of gen.rows) drawRow([r.metric, r.target, r.risk, r.owner], false);
  y += 20;

  const caveats: string[] = [];
  if (gen.unresolvedConflictCount > 0) {
    caveats.push(
      `Generated with ${gen.unresolvedConflictCount} unresolved conflict${
        gen.unresolvedConflictCount === 1 ? "" : "s"
      } in the source pool — ambiguities are surfaced in the Risks column, not silently decided.`,
    );
  }
  if (opts.stale) caveats.push("The source pool has changed since this version was generated.");

  if (caveats.length) {
    doc.setTextColor(150, 90, 10);
    for (const c of caveats) line(`! ${c}`, 9, "normal", 2);
    y += 8;
  }

  doc.setTextColor(120, 130, 145);
  line(
    `Source set ${gen.sourceSetHash} · generated ${new Date(gen.createdAt).toLocaleString()}${
      opts.author ? ` · ${opts.author}` : ""
    }`,
    8,
    "normal",
    0,
  );

  const safe = gen.lens.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`omnilens-poster-${safe}.pdf`);
}
