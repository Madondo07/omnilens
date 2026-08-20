import type { Generation } from "./omnilens.types";

const MARGIN = 48;

/** Renders a generation as a well-formatted 1-page PDF poster and triggers a browser download. Only the document itself — no app metadata (coverage score, cache hash, timestamps). */
export async function exportGenerationToPdf(gen: Generation) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const line = (text: string, size: number, style: "normal" | "bold" = "normal", gap = 6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentW) as string[];
    for (const l of lines) {
      ensureSpace(size * 1.25 + 2);
      doc.text(l, MARGIN, y);
      y += size * 1.25;
    }
    y += gap;
  };

  // --- Title block ---
  doc.setTextColor(20, 30, 45);
  line("OMNILENS AI · 1-PAGE EXECUTIVE POSTER", 9, "bold", 4);
  line(gen.title, 20, "bold", 8);
  doc.setDrawColor(200, 210, 220);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 18;

  // --- Brief ---
  line(gen.brief, 11, "normal", 14);

  // --- Sections (structured prose) ---
  if (gen.sections?.length) {
    for (const sec of gen.sections) {
      y += 6;
      ensureSpace(30);

      // Section heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 50, 65);
      doc.text(sec.heading.toUpperCase(), MARGIN, y);
      y += 14;

      // Separator line under heading
      doc.setDrawColor(210, 218, 228);
      doc.line(MARGIN, y, MARGIN + 80, y);
      y += 8;

      // Bullet points
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 60, 75);
      for (const bullet of sec.bullets) {
        const bulletLines = doc.splitTextToSize(bullet, contentW - 16) as string[];
        ensureSpace(bulletLines.length * 13 + 4);
        doc.text("•", MARGIN + 4, y);
        for (let li = 0; li < bulletLines.length; li++) {
          doc.text(bulletLines[li]!, MARGIN + 16, y);
          y += 13;
        }
        y += 3;
      }
    }
  } else if (gen.rows?.length) {
    // Legacy fallback — render rows as sections
    const groups = [
      { heading: "Key Metrics", items: gen.rows.map((r) => `${r.metric} — Target: ${r.target}`) },
      { heading: "Risks", items: gen.rows.map((r) => r.risk) },
      { heading: "Owners", items: gen.rows.map((r) => `${r.metric} → ${r.owner}`) },
    ];
    for (const group of groups) {
      y += 6;
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 50, 65);
      doc.text(group.heading.toUpperCase(), MARGIN, y);
      y += 14;
      doc.setDrawColor(210, 218, 228);
      doc.line(MARGIN, y, MARGIN + 80, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 60, 75);
      for (const item of group.items) {
        const lines = doc.splitTextToSize(item, contentW - 16) as string[];
        ensureSpace(lines.length * 13 + 4);
        doc.text("•", MARGIN + 4, y);
        for (const l of lines) {
          doc.text(l, MARGIN + 16, y);
          y += 13;
        }
        y += 3;
      }
    }
  }

  // --- Caveat (a legitimate disclosure about the content, not app metadata) ---
  if (gen.unresolvedConflictCount > 0) {
    y += 10;
    doc.setTextColor(150, 90, 10);
    line(
      `⚠ Generated with ${gen.unresolvedConflictCount} unresolved conflict${
        gen.unresolvedConflictCount === 1 ? "" : "s"
      } in the source pool — ambiguities are surfaced in the Risks section, not silently decided.`,
      9,
      "normal",
      2,
    );
  }

  const safe = gen.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`omnilens-poster-${safe}.pdf`);
}
