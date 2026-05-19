# Feature: Financial Goals Management

## Overview
The Goals Management feature encourages healthy financial habits by allowing users to define savings targets. Whether saving for a new car, an emergency fund, or a vacation, users can create highly visual goals linked directly to their specific financial accounts.

## Key Technical Highlights

### 1. High Customizability
To make savings engaging, users can customize their goals with a combination of Emojis and Hex Color Presets. This ensures the dashboard feels personalized and distinct.

### 2. Account Linking
A goal can exist independently, or it can be linked to an `account_id`. This allows the application to dynamically track the balance of a specific savings account against the target goal amount.

### 3. Form Validation
Utilizes `react-hook-form` to ensure proper data entry, preventing invalid target amounts or empty goal names from reaching the global store.

## Key Code Structures

**File:** `src/components/dashboard/add-goal-dialog.tsx`

```tsx
// Form Setup with React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

// Presets for Customization
const EMOJI_PRESETS = ["🎯", "🚗", "🏠", "✈️", "📱", "💍", "🎓", "🏥", "💼", "🌍", "🎮", "🛒", "💰", "🏋️", "🐶"];
const COLOR_PRESETS = ["#22c55e", "#3b82f6", "#a78bfa", "#f59e0b", "#ec4899", "#06b6d4", "#f97316", "#84cc16"];

// Goal Submission Handler
const onSubmit: SubmitHandler<FormValues> = async (values) => {
  setLoading(true);
  
  // Dispatching to Zustand store which handles API/DB sync
  await addGoal({
    name: values.name,
    target_amount: parseFloat(String(values.target_amount)),
    deadline: values.deadline || undefined,
    account_id: values.account_id === "none" ? null : (values.account_id ?? null),
    icon: selectedIcon,   // Passed from local component state
    color: selectedColor, // Passed from local component state
  });
  
  onClose();
};
```
