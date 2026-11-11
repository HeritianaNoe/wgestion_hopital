import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type PatientPdfData = {
  fullName: string;
  rows: [label: string, value: string][];
  /** Titre du document (défaut : « Fiche patient »). */
  docTitle?: string;
  /** Section de texte libre en bas de page ; omise si undefined. */
  medicalHistory?: string;
  sectionTitle?: string;
  generatedAt: string;
};

/** Helvetica (WinAnsi) : on remplace les caractères non encodables au lieu de faire échouer le PDF. */
function safe(font: PDFFont, text: string): string {
  return Array.from(text.replace(/\r/g, ""))
    .map((ch) => {
      try {
        font.encodeText(ch);
        return ch;
      } catch {
        return "?";
      }
    })
    .join("");
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const paragraph = safe(font, raw);
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildPatientPdf(data: PatientPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28, H = 841.89, M = 50;
  const ink = rgb(0.1, 0.12, 0.16), muted = rgb(0.4, 0.44, 0.5), line = rgb(0.85, 0.87, 0.9);
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const ensure = (needed: number) => {
    if (y - needed < M) {
      page = pdf.addPage([W, H]);
      y = H - M;
    }
  };

  page.drawText(safe(bold, `Gestion Hôpital — ${data.docTitle ?? "Fiche patient"}`), { x: M, y, size: 10, font: bold, color: muted });
  y -= 28;
  page.drawText(safe(bold, data.fullName), { x: M, y, size: 20, font: bold, color: ink });
  y -= 12;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: line });
  y -= 26;

  for (const [label, value] of data.rows) {
    ensure(22);
    page.drawText(safe(font, label), { x: M, y, size: 10, font, color: muted });
    const lines = wrap(bold, value || "—", 11, W - M - (M + 150));
    for (const l of lines) {
      ensure(16);
      page.drawText(l, { x: M + 150, y, size: 11, font: bold, color: ink });
      y -= 16;
    }
    y -= 4;
  }

  if (data.medicalHistory !== undefined) {
    y -= 10;
    ensure(40);
    page.drawText(data.sectionTitle ?? "Antécédents médicaux", { x: M, y, size: 13, font: bold, color: ink });
    y -= 20;
    for (const l of wrap(font, data.medicalHistory || "Aucun antécédent renseigné.", 11, W - 2 * M)) {
      ensure(16);
      page.drawText(l, { x: M, y, size: 11, font, color: ink });
      y -= 16;
    }

  }

  pdf.getPages().forEach((p, i, all) => {
    p.drawText(safe(font, `Généré le ${data.generatedAt} — page ${i + 1}/${all.length}`), {
      x: M, y: 28, size: 8, font, color: muted,
    });
  });

  return pdf.save();
}
