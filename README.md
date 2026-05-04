# PDF Word Search

Aplikasi web Next.js untuk mencari kata dalam file PDF dengan dukungan OCR dan multi-bahasa.

## Fitur

- **Pencarian teks** dalam PDF biasa (digital)
- **OCR otomatis** untuk PDF scan/foto (gambar) — tidak perlu setting manual
- **Multi-bahasa**: Indonesia, Inggris, Arab, China, Jepang, Korea, Prancis, Jerman, Spanyol, Portugis, Rusia, dan lainnya
- **Highlight** kata yang ditemukan langsung di UI
- **Case sensitive** opsional
- **Export ke TXT** — format plain text siap pakai
- **Export ke Word (.docx)** — dengan highlight kata kunci berwarna kuning
- **Progress bar** saat memproses PDF besar

## Output

```
Line 5
Kalimat lengkap yang mengandung kata yang dicari
```

## Cara Menjalankan

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:3000

### 3. Build production

```bash
npm run build
npm start
```

## Teknologi

- **Next.js 14** — framework React
- **Tailwind CSS** — styling
- **pdf.js** — ekstraksi teks dari PDF
- **Tesseract.js** — OCR untuk PDF gambar/scan
- **docx** — generate file Word
- **file-saver** — download file di browser

## Catatan

- File PDF diproses **sepenuhnya di browser** (tidak dikirim ke server)
- OCR mungkin membutuhkan waktu lebih lama tergantung ukuran PDF
- Untuk PDF scan dengan banyak halaman, proses OCR bisa memakan beberapa menit
