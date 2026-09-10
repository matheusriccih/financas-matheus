import type { CreditCard, Goal, Transaction } from "@/types/finance";

export const categories = [
  "Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer",
  "Assinaturas", "Compras", "Contas", "Salário", "Freelance", "Investimentos", "Outros",
];

export function toCents(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2,
  }).format(fromCents(toCents(value)));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function monthName(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, number - 1, 1));
}

export function monthTotals(transactions: Transaction[]) {
  return transactions.reduce((totals, transaction) => {
    const amount = toCents(transaction.amount);
    if (transaction.type === "income") totals.income += amount;
    else totals.expense += amount;
    return totals;
  }, { income: 0, expense: 0 });
}

function dateAtDay(base: Date, day: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(day, new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate())));
}

export function invoicePeriod(closingDay: number, reference = new Date()) {
  const today = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()));
  const thisClosing = dateAtDay(today, closingDay);
  const end = today <= thisClosing ? thisClosing : dateAtDay(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)), closingDay);
  const start = dateAtDay(new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1)), closingDay);
  start.setUTCDate(start.getUTCDate() + 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function cardInvoiceTotal(card: CreditCard, transactions: Transaction[]): number {
  const period = invoicePeriod(card.closing_day);
  return transactions.filter((transaction) => transaction.type === "expense" && transaction.credit_card_id === card.id && transaction.date >= period.start && transaction.date <= period.end)
    .reduce((sum, transaction) => sum + toCents(transaction.amount), 0);
}

export function cardAvailable(card: CreditCard, transactions: Transaction[]): number {
  return Math.max(0, toCents(card.credit_limit) - cardInvoiceTotal(card, transactions));
}

export function goalProgress(goal: Goal): number {
  return goal.target > 0 ? Math.min(100, Math.max(0, (toCents(goal.current) / toCents(goal.target)) * 100)) : 0;
}
