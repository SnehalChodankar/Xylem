# Feature: AI-Powered Receipt Scanning

## Overview
The AI Receipt Scanning feature allows users to capture or upload images of receipts and bills to automatically extract relevant transaction data (amount, date, description, and inferred category). This streamlines ledger entries and reduces manual typing. 

It uses a highly optimized, three-tier hybrid engine to ensure speed, high accuracy (including handwriting), and near 100% uptime while preserving API quota.

## Key Technical Highlights

### 1. The Hybrid OCR Engine
The backend (`/api/ocr`) utilizes a three-tier pipeline:
1. **Google Cloud Vision API:** The image is sent to the `DOCUMENT_TEXT_DETECTION` engine to extract raw, unformatted text. This has its own dedicated free quota (1,000/month) and handles crumpled or handwritten receipts exceptionally well.
2. **Gemini Text-Only Parsing:** The raw text is passed to the lightweight `gemini-2.0-flash-lite` model. Because no image is passed, this step consumes roughly ~50 tokens per scan (a 40x reduction compared to Gemini Vision), formatting the chaotic text into clean JSON.
3. **Regex Fallback:** If Gemini is unavailable or quota is exhausted, a custom Regular Expression fallback parser extracts amounts, dates, and infers merchants/categories directly from the Vision text, ensuring the feature never completely fails.

### 2. Client-Side Image Compression
To ensure rapid uploads and bypass standard API payload size limitations, the image is compressed natively on the client's browser using HTML5 Canvas (max 768px width, 60% JPEG quality) before being sent to the OCR backend.

### 3. Auto-Categorization
The backend returns a `category_hint` which the client intelligently cross-references with the user's existing personalized categories (stored in Zustand) to automatically select the most appropriate category icon.

## Key Code Structures

**File:** `src/components/transactions/scan-receipt-dialog.tsx`

```tsx
// 1. Client-Side Image Compression using Canvas
const compressImage = (dataUrl: string, maxWidth = 768, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // ... width/height scaling math ...
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality)); // Output compressed JPEG
    };
    img.src = dataUrl;
  });
};

// 2. Submitting to OCR API
const processImage = async (base64Image: string) => {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });
  const result = await res.json();
  const data = result.data as OcrResult;
  
  // 3. Category Hint Matching
  if (data.category_hint) {
    const hint = data.category_hint.toLowerCase();
    const match = categories.find(
      (c) => c.name.toLowerCase().includes(hint) || hint.includes(c.name.toLowerCase())
    );
    if (match) setCategoryId(match.id);
  }
};
```
