# Feature: Bulk CSV Import

## Overview
The Bulk CSV Import feature allows users to migrate large amounts of historical financial data from their bank statements into Xylem. It bypasses the tedious manual entry process by parsing raw CSV exports from popular banks (like HDFC, SBI, ICICI) and integrating them directly into the selected ledger account.

## Key Technical Highlights

### 1. Client-Side Parsing
For maximum privacy and speed, the application parses the CSV file entirely within the browser using the HTML5 File API and `FileReader`. No sensitive financial documents are uploaded to a server.

### 2. Multi-Format Heuristics
The parser `parseCSV` doesn't strictly rely on a single layout. It loops through columns trying to intuitively determine if it's looking at an HDFC-style format (Date, Narration, Value Dt, Withdrawal, Deposit, Balance) or a more generic format (Date, Description, Amount), greatly increasing compatibility across different banking institutions.

### 3. Integrated Auto-Categorization
During the parsing phase, each row is passed through `autoCategorize(description)`. This function evaluates the transaction description against:
1. The user's custom `categoryRules` defined in the Categories page.
2. The built-in, generic `CATEGORY_RULES` (e.g., auto-detecting "swiggy" as Food).
If a match is found, the transaction is automatically assigned a `category_id` before the user even reaches the preview step.

## Key Code Structures

**File:** `src/app/dashboard/upload/page.tsx`

```tsx
// File Handling (No Server Upload)
const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const results = parseCSV(content); // Custom parsing logic
      setParsed(results);
      setStep("preview");
    };
    reader.readAsText(file);
  }
}, []);

// Auto-Categorization Logic
const autoCategorize = (desc: string): string | undefined => {
  const lower = desc.toLowerCase();
  
  // 1. Check User-defined Rules First
  for (const rule of categoryRules) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      return rule.category_id;
    }
  }

  // 2. Fallback to System Rules
  for (const rule of CATEGORY_RULES) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      const cat = categories.find(
        (c) => c.name.toLowerCase() === rule.categoryName.toLowerCase()
      );
      return cat?.id;
    }
  }
  return undefined;
};
```
