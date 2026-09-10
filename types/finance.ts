export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  credit_card_id: string | null;
  note: string | null;
  created_at?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  brand: string | null;
  last_four: string | null;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color: string | null;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  due_date: string | null;
  description: string | null;
  created_at?: string;
};
