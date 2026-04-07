export interface Transaction {
  id: string;
  user_id?: string;
  account_id?: string;
  category_id?: string;
  type: "debit" | "credit" | "transfer";
  amount: number;
  description: string;
  notes?: string;
  date: string;
  payment_method?: string;
  is_recurring?: boolean;
  recurring_id?: string;
  import_source?: "manual" | "csv_upload" | "pdf_upload";
  import_hash?: string;
  created_at?: string;
  updated_at?: string;
  category?: Category;
  account?: Account;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income" | "both";
  parent_id?: string | null;
  is_system?: boolean;
  created_at?: string;
}

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: "bank" | "credit_card" | "cash" | "wallet" | "other";
  balance: number; // This is the OPENING/INITIAL balance entered by the user
  icon?: string;
  color?: string;
  is_default?: boolean;
  created_at?: string;
}

export interface ReconciliationResult {
  accountId: string;
  accountName: string;
  xylemBalance: number;      // Computed live balance from Xylem ledger
  realBalance: number;       // What user types in from their actual bank
  discrepancy: number;       // realBalance - xylemBalance
}

export interface Budget {
  id: string;
  user_id?: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at?: string;
  category?: Category;
  spent?: number;
}

export interface RecurringTransaction {
  id: string;
  user_id?: string;
  account_id?: string;
  category_id?: string;
  type: "debit" | "credit";
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_date: string;
  end_date?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CategoryRule {
  id: string;
  user_id?: string;
  category_id: string;
  keyword: string;
  match_type: "contains" | "starts_with" | "exact";
  created_at?: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  topCategories: { category: Category; amount: number }[];
}

export type DateRange = {
  from: Date;
  to: Date;
};
export type ViewMode = "month" | "quarter" | "year" | "custom";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface SmsTransaction {
  id: string;
  user_id?: string;
  sender: string;
  raw_message: string;
  amount: number;
  type: "debit" | "credit";
  description: string;
  account_id?: string | null;
  category_id?: string | null;
  status: "pending" | "approved" | "rejected";
  date: string;
  created_at?: string;
}

export interface SmsSenderMapping {
  id: string;
  user_id?: string;
  sender_pattern: string;
  account_id?: string | null;
  label?: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  account_id?: string | null;
  name: string;
  icon: string;
  color: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  is_completed: boolean;
  created_at?: string;
}
