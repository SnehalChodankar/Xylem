# Feature: AI-Powered Receipt Scanning

## Overview
The AI Receipt Scanning feature allows users to capture or upload images of receipts and bills. By leveraging Google's Gemini Vision AI model, the application automatically extracts relevant transaction data (amount, date, description, and inferred category) to streamline ledger entries and reduce manual typing.

## Key Technical Highlights

### 1. Client-Side Image Compression
To ensure rapid uploads and bypass standard API payload size limitations (like Vercel's 4.5MB body limit), the image is compressed natively on the client's browser using HTML5 Canvas before being sent to the OCR backend.

### 2. AI SDK Integration
The system interacts with the `/api/ocr` Next.js route, which wraps the Vercel AI SDK and the Gemini provider to perform zero-shot data extraction, forcing the output into a strict JSON schema.

### 3. Auto-Categorization
The AI returns a `category_hint` which the client intelligently cross-references with the user's existing personalized categories (stored in Zustand) to automatically select the most appropriate category icon.

## Key Code Structures

**File:** `src/components/transactions/scan-receipt-dialog.tsx`

```tsx
// 1. Client-Side Image Compression using Canvas
const compressImage = (dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
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
