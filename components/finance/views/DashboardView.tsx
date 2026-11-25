import { cardAvailable, cardInvoiceTotal, formatCurrency, fromCents, toCents } from "@/lib/finance";
import type { CreditCard, Goal, Transaction } from "@/types/finance";
import { formatPercent } from "../mappers";
import { CategoryBreakdown, EmptyState, GoalLine, Metric, MonthlyChart, PanelTitle, ProgressBar, TransactionList, type MonthSeries } from "../ui";

type Props = {
  totals: { income: number; expense: number };
  balance: number;
  categories: (readonly [string, number])[];
  series: MonthSeries;
  transactions: Transaction[];
  cards: CreditCard[];
  goals: Goal[];
  onNewTransaction: () => void;
  onNewCard: () => void;
  onNewGoal: () => void;
};

export function DashboardView({ totals, balance, categories, series, transactions, cards, goals, onNewTransaction, onNewCard, onNewGoal }: Props) {
  const savingsRate = totals.income ? formatPercent(Math.max(0, (balance / totals.income) * 100)) : "0,0";
  const firstCard = cards[0];

  return (
    <>
      <section className="kpis">
        <Metric label="Saldo disponível" value={formatCurrency(fromCents(balance))} />
        <Metric label="Entradas do mês" value={formatCurrency(fromCents(totals.income))} tone="green" />
        <Metric label="Despesas do mês" value={formatCurrency(fromCents(totals.expense))} tone="red" />
        <Metric label="Economia" value={`${savingsRate}%`} tone="purple" />
      </section>

      <section className="grid">
        <article className="panel">
          <PanelTitle title="Cartão de crédito" link="Cartões" href="/cartoes" />
          {firstCard ? <CardSummary card={firstCard} transactions={transactions} /> : (
            <EmptyState text="Cadastre um cartão para acompanhar a fatura." buttonLabel="Novo cartão" onButtonClick={onNewCard} />
          )}
        </article>
        <article className="panel">
          <PanelTitle title="Despesas por categoria" />
          <CategoryBreakdown categories={categories.slice(0, 6)} emptyText="Suas despesas aparecerão aqui." />
        </article>
      </section>

      <section className="grid">
        <article className="panel">
          <PanelTitle title="Evolução mensal" subtitle="Dados reais dos últimos 6 meses" />
          <MonthlyChart series={series} />
        </article>
        <article className="panel">
          <PanelTitle title="Últimas movimentações" link="Ver todas" href="/movimentacoes" />
          {transactions.length ? <TransactionList items={transactions.slice(0, 6)} /> : (
            <EmptyState text="Registre sua primeira movimentação." buttonLabel="Nova movimentação" onButtonClick={onNewTransaction} />
          )}
        </article>
      </section>

      <section className="panel">
        <PanelTitle title="Metas em andamento" link="Ver metas" href="/metas" />
        {goals.length ? goals.slice(0, 4).map((goal) => <GoalLine goal={goal} key={goal.id} />) : (
          <EmptyState text="Crie uma meta para começar." buttonLabel="Nova meta" onButtonClick={onNewGoal} />
        )}
      </section>
    </>
  );
}

function CardSummary({ card, transactions }: { card: CreditCard; transactions: Transaction[] }) {
  const invoice = cardInvoiceTotal(card, transactions);
  return (
    <>
      <p className="muted">Fatura atual · vence dia {card.due_day}</p>
      <strong className="amount">{formatCurrency(fromCents(invoice))}</strong>
      <ProgressBar value={card.credit_limit ? (invoice / toCents(card.credit_limit)) * 100 : 0} />
      <div className="split">
        <span>Disponível <b>{formatCurrency(fromCents(cardAvailable(card, transactions)))}</b></span>
        <span>Limite <b>{formatCurrency(card.credit_limit)}</b></span>
      </div>
    </>
  );
}
