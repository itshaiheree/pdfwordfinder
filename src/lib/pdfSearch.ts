"use client";

export interface SearchResult {
  lineNumber: number;
  lineText: string;
  matchedWord: string;
  pageNumber: number;
}

export interface ExtractionProgress {
  page: number;
  total: number;
  method: "text" | "ocr";
}

// Extract text from PDF using pdf.js
async function extractTextFromPDF(
  file: File,
  onProgress?: (p: ExtractionProgress) => void
): Promise<{ lines: string[]; usedOCR: boolean }> {
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];
  let hasRealText = false;

  // First pass: try native text extraction
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.({ page: pageNum, total: pdf.numPages, method: "text" });
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();

    if (pageText.length > 10) {
      hasRealText = true;
    }

    // Split into lines by sentences/newlines
    const lines = pageText
      .split(/(?<=[.!?])\s+|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    allLines.push(...lines);
  }

  // If no real text found, fall back to OCR
  if (!hasRealText) {
    return extractTextWithOCR(file, pdf, onProgress);
  }

  return { lines: allLines, usedOCR: false };
}

// OCR fallback using Tesseract.js
async function extractTextWithOCR(
  file: File,
  pdf: any,
  onProgress?: (p: ExtractionProgress) => void
): Promise<{ lines: string[]; usedOCR: boolean }> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng+ind+ara+chi_sim+jpn+kor+fra+deu+spa+por+rus");

  const pdfjsLib = await import("pdfjs-dist");
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    onProgress?.({ page: pageNum, total: pdfDoc.numPages, method: "ocr" });

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const imageDataUrl = canvas.toDataURL("image/png");
    const { data } = await worker.recognize(imageDataUrl);

    const lines = data.lines
      .map((l: any) => l.text.trim())
      .filter((l: string) => l.length > 0);

    allLines.push(...lines);
  }

  await worker.terminate();
  return { lines: allLines, usedOCR: true };
}

// Main search function
export async function searchInPDF(
  file: File,
  keyword: string,
  caseSensitive: boolean = false,
  onProgress?: (p: ExtractionProgress) => void
): Promise<{ results: SearchResult[]; usedOCR: boolean; totalLines: number }> {
  const { lines, usedOCR } = await extractTextFromPDF(file, onProgress);

  const results: SearchResult[] = [];
  const searchTerm = caseSensitive ? keyword : keyword.toLowerCase();

  lines.forEach((line, index) => {
    const compareLine = caseSensitive ? line : line.toLowerCase();
    if (compareLine.includes(searchTerm)) {
      results.push({
        lineNumber: index + 1,
        lineText: line,
        matchedWord: keyword,
        pageNumber: 0, // simplified
      });
    }
  });

  return { results, usedOCR, totalLines: lines.length };
}
