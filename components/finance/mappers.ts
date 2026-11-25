import { fromCents, toCents } from "@/lib/finance";
import type { CreditCard, Goal, Transaction } from "@/types/finance";

// Converte as linhas retornadas pelo Supabase nos tipos usados pela interface.
// Valores monetários passam por centavos para evitar erros de ponto flutuante.

type Row = Record<string, unknown>;

const asRow = (value: unknown) => value as Row;
const optionalString = (value: unknown) => (typeof value === "string" ? value : null);
export const toMoney = (value: unknown) => fromCents(toCents(value));

export function toTransaction(value: unknown): Transaction {
  const row = asRow(value);
  return {
    id: String(row.id),
    description: String(row.description),
    amount: toMoney(row.amount),
    type: row.type === "income" ? "income" : "expense",
    category: String(row.category),
    date: String(row.date),
    credit_card_id: optionalString(row.credit_card_id),
    note: optionalString(row.note),
  };
}

export function toCreditCard(value: unknown): CreditCard {
  const row = asRow(value);
  return {
    id: String(row.id),
    name: String(row.name),
    brand: optionalString(row.brand),
    last_four: optionalString(row.last_four),
    // `limit` é a coluna legada; `credit_limit` é a fonte de verdade.
    credit_limit: toMoney(row.credit_limit ?? row.limit),
    closing_day: Number(row.closing_day ?? 1),
    due_day: Number(row.due_day ?? 10),
    color: optionalString(row.color),
  };
}

export function toGoal(value: unknown): Goal {
  const row = asRow(value);
  return {
    id: String(row.id),
    name: String(row.name),
    target: toMoney(row.target),
    current: toMoney(row.current),
    due_date: optionalString(row.due_date),
    description: optionalString(row.description),
  };
}

export const today = () => new Date().toISOString().slice(0, 10);

export const formatPercent = (value: number) => value.toFixed(1).replace(".", ",");
