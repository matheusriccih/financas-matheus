import { formatCurrency, fromCents } from "@/lib/finance";
import { CategoryBreakdown, Metric, MonthlyChart, PanelTitle, type MonthSeries } from "../ui";
import { MonthFilter } from "./TransactionsView";

type Props = {
  month: string;
  months: string[];
  onMonthChange: (month: string) => void;
  totals: { income: number; expense: number };
  balance: number;
  totalInvoice: number;
  categories: (readonly [string, number])[];
  series: MonthSeries;
};

export function ReportsView({ month, months, onMonthChange, totals, balance, totalInvoice, categories, series }: Props) {
  return (
    <>
      <section className="filters">
        <MonthFilter month={month} months={months} onChange={onMonthChange} />
      </section>
      <section className="kpis">
        <Metric label="Entradas" value={formatCurrency(fromCents(totals.income))} tone="green" />
        <Metric label="Despesas" value={formatCurrency(fromCents(totals.expense))} tone="red" />
        <Metric label="Saldo" value={formatCurrency(fromCents(balance))} />
        <Metric label="Fatura atual" value={formatCurrency(fromCents(totalInvoice))} tone="purple" />
      </section>
      <section className="grid">
        <article className="panel">
          <PanelTitle title="Evolução de 6 meses" />
          <MonthlyChart series={series} />
        </article>
        <article className="panel">
          <PanelTitle title="Categorias" />
          <CategoryBreakdown categories={categories} emptyText="Ainda não há despesas no período." />
        </article>
      </section>
    </>
  );
}
