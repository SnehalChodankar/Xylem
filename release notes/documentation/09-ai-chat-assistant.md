# Feature: Xylem AI Chat Assistant

## Overview
The Xylem AI is an embedded chat interface that allows users to converse with their financial data. Users can ask questions like "Am I on track to hit my budget?" or "Summarize my recent transactions", and the AI will respond with context-aware, hyper-accurate answers based on the user's actual ledger.

## Key Technical Highlights

### 1. Vercel AI SDK Integration
The feature leverages the `@ai-sdk/react` library, utilizing the `useChat` hook to manage real-time streaming of AI responses, handling loading states, and formatting the markdown output seamlessly.

### 2. Context Injection
Before sending the user's message to the server, the client generates a rich `financialContext` payload using `generateFinancialContext()`. This JSON string contains the user's current balances, recent transactions, and active budgets. The server system prompt uses this context to ground the AI's answers, preventing hallucinations.

### 3. Local Storage Persistence
To ensure a continuous experience, the chat history is hydrated from and synced to `localStorage`. If a user refreshes the page, their conversation with the AI remains intact.

## Key Code Structures

**File:** `src/app/dashboard/chat/page.tsx`

```tsx
// Initializing AI Chat
const chat = useChat({ api: "/api/chat" });

// Context Injection on Submission
const submitToAI = (text: string) => {
  // Grabs real-time data from the Zustand store
  const freshContext = generateFinancialContext(); 
  const payload = { role: "user", content: text };
  
  // Injects the context into the body of the request behind the scenes
  const options = { body: { financialContext: freshContext } };
  chat.append(payload, options);
};

// LocalStorage Hydration
useEffect(() => {
  const saved = localStorage.getItem("xylem_chat_history");
  if (saved) {
    setMessages(JSON.parse(saved));
  }
  setHasHydrated(true);
}, []);
```
