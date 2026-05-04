"use client";

import { SearchResult } from "./pdfSearch";

export async function exportToTXT(
  results: SearchResult[],
  keyword: string,
  filename: string
): Promise<void> {
  const lines = [
  `Keyword: ${keyword}`,
  `Found: ${results.length} matches`,
  "=".repeat(60),
  "",
  ...results.map((r) => `Line ${r.lineNumber}\n${r.lineText}`),
];

  const content = lines.join("\n\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const { saveAs } = await import("file-saver");
  saveAs(blob, `hasil-pencarian-${keyword}.txt`);
}

export async function exportToWord(
  results: SearchResult[],
  keyword: string,
  filename: string
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
  } = await import("docx");

  const children: any[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `Hasil Pencarian: "${keyword}"`,
          bold: true,
          size: 32,
          font: "Arial",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `File sumber: ${filename}`,
          size: 20,
          font: "Arial",
          color: "555555",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Ditemukan: ${results.length} baris mengandung kata "${keyword}"`,
          size: 20,
          font: "Arial",
          color: "555555",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tanggal: ${new Date().toLocaleString("id-ID")}`,
          size: 20,
          font: "Arial",
          color: "555555",
        }),
      ],
    }),
    new Paragraph({
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "2563EB", space: 1 },
      },
      children: [new TextRun({ text: "" })],
    }),
    new Paragraph({ children: [new TextRun({ text: "" })] }),
  ];

  // Add each result
  results.forEach((result) => {
    // Line label
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Line ${result.lineNumber}`,
            bold: true,
            size: 22,
            font: "Arial",
            color: "2563EB",
          }),
        ],
      })
    );

    // Build text with highlighted keyword
    const text = result.lineText;
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const parts: any[] = [];
    let lastIndex = 0;

    let idx = lowerText.indexOf(lowerKeyword, lastIndex);
    while (idx !== -1) {
      // text before match
      if (idx > lastIndex) {
        parts.push(
          new TextRun({
            text: text.slice(lastIndex, idx),
            size: 22,
            font: "Arial",
          })
        );
      }
      // matched keyword (bold)
      parts.push(
        new TextRun({
          text: text.slice(idx, idx + keyword.length),
          size: 22,
          font: "Arial",
          bold: true,
          highlight: "yellow",
        })
      );
      lastIndex = idx + keyword.length;
      idx = lowerText.indexOf(lowerKeyword, lastIndex);
    }

    // remaining text
    if (lastIndex < text.length) {
      parts.push(
        new TextRun({
          text: text.slice(lastIndex),
          size: 22,
          font: "Arial",
        })
      );
    }

    children.push(
      new Paragraph({
        children: parts.length > 0 ? parts : [new TextRun({ text, size: 22, font: "Arial" })],
      })
    );

    // Spacer
    children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const { saveAs } = await import("file-saver");
  saveAs(blob, `hasil-pencarian-${keyword}.docx`);
}
