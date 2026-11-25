import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, goalProgress } from "@/lib/finance";
import type { Goal, Transaction } from "@/types/finance";
import { formatPercent } from "./mappers";

export function PanelTitle({ title, subtitle, link, href, buttonLabel, onButtonClick }: {
  title: string;
  subtitle?: string;
  link?: string;
  href?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}) {
  return (
    <div className="title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {link && href && <Link href={href}>{link}</Link>}
      {buttonLabel && <button className="secondary" onClick={onButtonClick}><Plus size={15} />{buttonLabel}</button>}
    </div>
  );
}

export function Metric({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "purple" }) {
  return (
    <article className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function ProgressBar({ value, purple = false }: { value: number; purple?: boolean }) {
  const width = Math.max(0, Math.min(100, value));
  return <div className={`bar ${purple ? "purple" : ""}`}><i style={{ width: `${width}%` }} /></div>;
}

export function EmptyState({ text, buttonLabel, onButtonClick }: { text: string; buttonLabel?: string; onButtonClick?: () => void }) {
  return (
    <div className="empty">
      <p>{text}</p>
      {buttonLabel && <button className="secondary" onClick={onButtonClick}>{buttonLabel}</button>}
    </div>
  );
}

export function Loading() {
  return <div className="loading"><i />Carregando seus dados financeiros…</div>;
}

export function CategoryBreakdown({ categories, emptyText }: { categories: (readonly [string, number])[]; emptyText: string }) {
  if (!categories.length) return <EmptyState text={emptyText} />;
  const max = categories[0][1];
  return categories.map(([name, cents]) => (
    <div className="category" key={name}>
      <span>{name}</span>
      <ProgressBar value={(cents / max) * 100} />
      <b>{formatCurrency(cents / 100)}</b>
    </div>
  ));
}

export function TransactionList({ items, onEdit, onDelete }: {
  items: Transaction[];
  onEdit?: (item: Transaction) => void;
  onDelete?: (item: Transaction) => void;
}) {
  const showActions = Boolean(onEdit && onDelete);
  return (
    <div className="tx-list">
      {items.map((item) => (
        <div className="tx" key={item.id}>
          <i className={item.type}>{item.type === "income" ? <ArrowUpRight size={17} /> : <ArrowDownLeft size={17} />}</i>
          <div>
            <b>{item.description}</b>
            <small>{item.category} · {formatDate(item.date)}</small>
          </div>
          <strong className={item.type}>{item.type === "income" ? "+" : "−"} {formatCurrency(item.amount)}</strong>
          {showActions && (
            <span className="tx-buttons">
              <button className="icon" aria-label="Editar movimentação" onClick={() => onEdit?.(item)}><Pencil size={15} /></button>
              <button className="icon danger" aria-label="Excluir movimentação" onClick={() => onDelete?.(item)}><Trash2 size={15} /></button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function GoalLine({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  return (
    <div className="goal-line">
      <div>
        <b>{goal.name}</b>
        <span>{formatCurrency(goal.current)} de {formatCurrency(goal.target)}</span>
      </div>
      <ProgressBar value={progress} purple />
      <small>{formatPercent(progress)}% concluído</small>
    </div>
  );
}

export type MonthSeries = { key: string; income: number; expense: number }[];

export function MonthlyChart({ series }: { series: MonthSeries }) {
  const max = Math.max(1, ...series.flatMap((month) => [month.income, month.expense]));
  const points = (key: "income" | "expense") =>
    series.map((month, index) => `${index * 120},${180 - (month[key] / max) * 160}`).join(" ");
  const monthLabel = (key: string) =>
    new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${key}-01T12:00:00`)).replace(".", "");

  return (
    <div className="chart">
      <svg viewBox="0 0 600 190">
        <title>Entradas e despesas reais por mês</title>
        <polyline className="income-line" points={points("income")} />
        <polyline className="expense-line" points={points("expense")} />
      </svg>
      <p><span className="income-dot" />Entradas <span className="expense-dot" />Despesas</p>
      <div>{series.map((month) => <small key={month.key}>{monthLabel(month.key)}</small>)}</div>
    </div>
  );
}
