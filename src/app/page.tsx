"use client";

import { useState, useRef, useCallback } from "react";
import { searchInPDF, SearchResult, ExtractionProgress } from "@/lib/pdfSearch";
import { exportToTXT, exportToWord } from "@/lib/exportUtils";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [usedOCR, setUsedOCR] = useState(false);
  const [totalLines, setTotalLines] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [exporting, setExporting] = useState<"txt" | "word" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Hanya file PDF yang didukung.");
      return;
    }
    setFile(f);
    setResults([]);
    setSearched(false);
    setError(null);
    setUsedOCR(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSearch = async () => {
    if (!file || !keyword.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);
    setProgress(null);

    try {
      const { results: r, usedOCR: ocr, totalLines: tl } = await searchInPDF(
        file,
        keyword.trim(),
        caseSensitive,
        (p) => setProgress(p)
      );
      setResults(r);
      setUsedOCR(ocr);
      setTotalLines(tl);
      setSearched(true);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses PDF.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const handleExportTXT = async () => {
    if (!file) return;
    setExporting("txt");
    try {
      await exportToTXT(results, keyword, file.name);
    } finally {
      setExporting(null);
    }
  };

  const handleExportWord = async () => {
    if (!file) return;
    setExporting("word");
    try {
      await exportToWord(results, keyword, file.name);
    } finally {
      setExporting(null);
    }
  };

  const highlightKeyword = (text: string, kw: string, cs: boolean) => {
    const flags = cs ? "g" : "gi";
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, flags);
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PDF Word Search</h1>
            <p className="text-xs text-gray-500">Cari kata dalam PDF • OCR & Multi-bahasa</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-blue-500 bg-blue-50"
              : file
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti file</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Drop file PDF di sini</p>
                <p className="text-sm text-gray-400 mt-1">atau klik untuk memilih file</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {["Text PDF", "PDF Scan/Foto", "Multi-bahasa", "OCR otomatis"].map((tag) => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Masukkan kata yang dicari..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !file || !keyword.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Cari
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="caseSensitive"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="caseSensitive" className="text-sm text-gray-600 cursor-pointer select-none">
              Case sensitive (bedakan huruf besar/kecil)
            </label>
          </div>
        </div>

        {/* Progress */}
        {loading && progress && (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {progress.method === "ocr" ? "Memproses OCR (scan/foto)..." : "Mengekstrak teks..."}
                </p>
                <p className="text-sm text-gray-500">
                  Halaman {progress.page} dari {progress.total}
                  {progress.method === "ocr" && (
                    <span className="ml-2 text-orange-600 font-medium">• Mode OCR aktif</span>
                  )}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${progress.method === "ocr" ? "bg-orange-500" : "bg-blue-500"}`}
                style={{ width: `${(progress.page / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Results header */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${results.length > 0 ? "text-gray-900" : "text-gray-500"}`}>
                    {results.length} hasil ditemukan
                  </span>
                  {usedOCR && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      OCR
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Kata: <span className="font-medium text-blue-600">"{keyword}"</span>
                  {" "}• {totalLines} baris diproses
                  {usedOCR && " • PDF gambar/scan dideteksi"}
                </p>
              </div>

              {/* Export buttons */}
              {results.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExportTXT}
                    disabled={exporting !== null}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {exporting === "txt" ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    Export TXT
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={exporting !== null}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {exporting === "word" ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    Export Word
                  </button>
                </div>
              )}
            </div>

            {/* Result items */}
            {results.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Kata tidak ditemukan dalam dokumen</p>
                <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain atau periksa ejaan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 mt-0.5 min-w-[64px] text-center">
                        Line {result.lineNumber}
                      </span>
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {highlightKeyword(result.lineText, keyword, caseSensitive)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="text-center text-xs text-gray-400 pb-4 space-y-1">
          <p>Mendukung PDF teks biasa dan PDF scan/foto (via OCR)</p>
          <p>Bahasa didukung: Indonesia, English, Arabic, Chinese, Japanese, Korean, French, German, Spanish, Portuguese, Russian, dan lainnya</p>
        </div>
      </div>
    </main>
  );
}
