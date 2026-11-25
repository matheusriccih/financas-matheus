import { Search } from "lucide-react";
import { categories, monthName } from "@/lib/finance";
import type { Transaction, TransactionType } from "@/types/finance";
import { EmptyState, PanelTitle, TransactionList } from "../ui";

export type TypeFilter = "all" | TransactionType;

type Props = {
  month: string;
  months: string[];
  onMonthChange: (month: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  type: TypeFilter;
  onTypeChange: (value: TypeFilter) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  items: Transaction[];
  onNew: () => void;
  onEdit: (item: Transaction) => void;
  onDelete: (item: Transaction) => void;
};

export function TransactionsView(props: Props) {
  const { month, months, search, type, category, items } = props;
  return (
    <>
      <section className="filters">
        <MonthFilter month={month} months={months} onChange={props.onMonthChange} />
        <label className="search">
          <Search size={16} />
          <input value={search} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Buscar movimentações" />
        </label>
        <label>Tipo
          <select value={type} onChange={(e) => props.onTypeChange(e.target.value as TypeFilter)}>
            <option value="all">Todos</option>
            <option value="income">Entradas</option>
            <option value="expense">Despesas</option>
          </select>
        </label>
        <label>Categoria
          <select value={category} onChange={(e) => props.onCategoryChange(e.target.value)}>
            <option value="all">Todas</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </section>
      <section className="panel">
        <PanelTitle title={`${items.length} movimentações`} buttonLabel="Nova movimentação" onButtonClick={props.onNew} />
        {items.length ? <TransactionList items={items} onEdit={props.onEdit} onDelete={props.onDelete} /> : <EmptyState text="Nenhuma movimentação encontrada." />}
      </section>
    </>
  );
}

export function MonthFilter({ month, months, onChange }: { month: string; months: string[]; onChange: (month: string) => void }) {
  return (
    <label>Período
      <select value={month} onChange={(e) => onChange(e.target.value)}>
        {months.map((m) => <option value={m} key={m}>{monthName(m)}</option>)}
      </select>
    </label>
  );
}
