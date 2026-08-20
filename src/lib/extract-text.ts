// Browser-side text extraction for uploaded files.
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return file.text();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out +=
        content.items.map((it) => ("str" in it ? (it as { str: string }).str : "")).join(" ") +
        "\n\n";
    }
    return out.trim();
  }

  throw new Error("Unsupported file type. Use .pdf, .md, .txt or .docx");
}

export function hashSourceSet(ids: string[]): string {
  const joined = [...ids].sort().join("|");
  let h1 = 0x811c9dc5;
  for (let i = 0; i < joined.length; i++) {
    h1 ^= joined.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0");
}
