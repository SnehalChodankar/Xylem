# Feature: Categories Management

## Overview
The Categories page allows users to define how their money is organized. Instead of relying purely on default, inflexible categories, Xylem enables highly customizable categories (with emojis and colors) and incorporates a "Smart Auto-Tagging" rules engine.

## Key Technical Highlights

### 1. Smart Auto-Tagging Engine
Users can define rules linking a `keyword` to a specific category. When CSV files are imported (or when SMS messages are parsed), the application checks the description against these rules. If a `keyword` is found, it automatically tags the transaction, saving the user from manual categorization.

### 2. Deep UI Customization
When adding or editing a category, users are presented with a grid of Emojis and Hex Color Presets. The UI uses Tailwind CSS to dynamically tint backgrounds based on the selected hex color (e.g., `style={{ backgroundColor: form.color + "20" }}`).

### 3. Unified Filtering
The state maintains a `filter` toggle (`all`, `expense`, `income`) that instantly filters the displayed category cards without requiring a database roundtrip.

## Key Code Structures

**File:** `src/app/dashboard/categories/page.tsx`

```tsx
// Smart Auto-Tagging Rule Setup
const handleAddRule = () => {
  if (!ruleKeyword || !ruleCategoryId) return;
  
  // Pushes the rule to the Zustand store, which persists it in Supabase
  addCategoryRule({ 
    keyword: ruleKeyword.trim(), 
    category_id: ruleCategoryId, 
    match_type: "contains" 
  });
  
  setRuleKeyword("");
  setRuleCategoryId("");
};

// Dynamic Color Styling for Categories
<div
  className="flex h-11 w-11 items-center justify-center rounded-xl text-lg flex-shrink-0"
  style={{ backgroundColor: cat.color + "20" }} // Adds 20% opacity alpha channel to the hex code
>
  {cat.icon}
</div>
```
