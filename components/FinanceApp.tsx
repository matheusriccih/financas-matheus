"use client";
import "./finance-app.css";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Menu, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cardInvoiceTotal, currentMonth, fromCents, monthTotals, toCents } from "@/lib/finance";
import type { CreditCard, Goal, Transaction, TransactionType } from "@/types/finance";
import { AdjustGoalForm, CreditCardForm, GoalForm, TransactionForm } from "./finance/forms";
import { toCreditCard, toGoal, toMoney, toTransaction } from "./finance/mappers";
import { ConfirmDialog } from "./finance/Modal";
import { navigation, type Page } from "./finance/navigation";
import { Sidebar } from "./finance/Sidebar";
import { Loading } from "./finance/ui";
import { useFinanceData } from "./finance/useFinanceData";
import { CardsView } from "./finance/views/CardsView";
import { DashboardView } from "./finance/views/DashboardView";
import { GoalsView } from "./finance/views/GoalsView";
import { ReportsView } from "./finance/views/ReportsView";
import { SettingsView } from "./finance/views/SettingsView";
import { TransactionsView, type TypeFilter } from "./finance/views/TransactionsView";

type ModalState =
  | { kind: "transaction"; item: Transaction | null }
  | { kind: "card"; item: CreditCard | null }
  | { kind: "goal"; item: Goal | null }
  | { kind: "adjust"; item: Goal }
  | null;

type Table = "transactions" | "credit_cards" | "goals";

export default function FinanceApp({ page }: { page: Page }) {
  const router = useRouter();
  const data = useFinanceData();
  const { transactions, setTransactions, cards, setCards, goals, setGoals, email, name, setName } = data;

  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Filtros
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState("all");

  const notify = (message: string) => setNotice(message);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  // ---------- Dados derivados ----------
  const months = useMemo(
    () => [...new Set([currentMonth(), ...transactions.map((t) => t.date.slice(0, 7))])].sort().reverse(),
    [transactions],
  );
  const monthly = useMemo(() => transactions.filter((t) => t.date.startsWith(month)), [transactions, month]);
  const totals = useMemo(() => monthTotals(monthly), [monthly]);
  const balance = totals.income - totals.expense;

  const visibleTransactions = useMemo(() => monthly.filter((t) =>
    (type === "all" || t.type === type) &&
    (category === "all" || t.category === category) &&
    `${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase()),
  ), [monthly, type, category, search]);

  // Despesas do mês por categoria, em centavos, da maior para a menor.
  const expenseByCategory = useMemo(() => {
    const sums = new Map<string, number>();
    monthly.filter((t) => t.type === "expense").forEach((t) => sums.set(t.category, (sums.get(t.category) ?? 0) + toCents(t.amount)));
    return [...sums.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthly]);

  const totalInvoice = useMemo(
    () => cards.reduce((sum, card) => sum + cardInvoiceTotal(card, transactions), 0),
    [cards, transactions],
  );

  const lastSixMonths = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5 + i);
    const key = date.toISOString().slice(0, 7);
    return { key, ...monthTotals(transactions.filter((t) => t.date.startsWith(key))) };
  }), [transactions]);

  // ---------- Ações ----------
  const closeModal = () => setModal(null);

  async function saveTransaction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const editing = modal?.kind === "transaction" ? modal.item : null;
    const form = new FormData(e.currentTarget);
    const amount = toMoney(form.get("amount"));
    const txType: TransactionType = form.get("type") === "income" ? "income" : "expense";
    const paidWithCard = txType === "expense" && form.get("payment") === "credit";
    const creditCardId = paidWithCard ? String(form.get("credit_card_id") ?? "") || null : null;
    const payload = {
      description: String(form.get("description") ?? "").trim(),
      amount,
      type: txType,
      category: String(form.get("category") ?? "").trim(),
      date: String(form.get("date")),
      credit_card_id: creditCardId,
      note: String(form.get("note") ?? "").trim() || null,
    };
    if (!payload.description || !payload.category || amount <= 0) return notify("Preencha descrição, categoria e valor válido.");
    if (form.get("payment") === "credit" && !creditCardId) return notify("Selecione o cartão usado.");

    setSaving(true);
    try {
      const table = createClient().from("transactions");
      const result = editing
        ? await table.update(payload).eq("id", editing.id).select().single()
        : await table.insert(payload).select().single();
      if (result.error || !result.data) throw result.error;
      const item = toTransaction(result.data);
      setTransactions((list) => (editing ? list.map((t) => (t.id === item.id ? item : t)) : [item, ...list]));
      closeModal();
      notify("Movimentação salva.");
    } catch {
      notify("Não foi possível salvar a movimentação.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const editing = modal?.kind === "card" ? modal.item : null;
    const form = new FormData(e.currentTarget);
    const limit = toMoney(form.get("credit_limit"));
    const lastFour = String(form.get("last_four") ?? "").replace(/\D/g, "");
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      credit_limit: limit,
      closing_day: Number(form.get("closing_day")),
      due_day: Number(form.get("due_day")),
      brand: String(form.get("brand") ?? "").trim() || null,
      last_four: lastFour || null,
      color: String(form.get("color") ?? "#2f72ff"),
    };
    const validDay = (day: number) => day >= 1 && day <= 31;
    if (!payload.name || limit <= 0 || !validDay(payload.closing_day) || !validDay(payload.due_day) || (lastFour && lastFour.length !== 4)) {
      return notify("Informe os dados do cartão corretamente.");
    }

    setSaving(true);
    try {
      const table = createClient().from("credit_cards");
      const result = editing
        ? await table.update(payload).eq("id", editing.id).select().single()
        : await table.insert(payload).select().single();
      if (result.error || !result.data) throw result.error;
      const item = toCreditCard(result.data);
      setCards((list) => (editing ? list.map((c) => (c.id === item.id ? item : c)) : [item, ...list]));
      closeModal();
      notify("Cartão salvo.");
    } catch {
      notify("Não foi possível salvar o cartão. Verifique se a migração foi executada.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const editing = modal?.kind === "goal" ? modal.item : null;
    const form = new FormData(e.currentTarget);
    const target = toMoney(form.get("target"));
    const current = toMoney(form.get("current"));
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      target,
      current,
      due_date: String(form.get("due_date") ?? "") || null,
      description: String(form.get("description") ?? "").trim() || null,
    };
    if (!payload.name || target <= 0 || current < 0) return notify("Informe os dados da meta corretamente.");

    setSaving(true);
    try {
      const table = createClient().from("goals");
      const result = editing
        ? await table.update(payload).eq("id", editing.id).select().single()
        : await table.insert(payload).select().single();
      if (result.error || !result.data) throw result.error;
      const item = toGoal(result.data);
      setGoals((list) => (editing ? list.map((g) => (g.id === item.id ? item : g)) : [item, ...list]));
      closeModal();
      notify("Meta salva.");
    } catch {
      notify("Não foi possível salvar a meta.");
    } finally {
      setSaving(false);
    }
  }

  async function adjustGoal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (modal?.kind !== "adjust") return;
    const goal = modal.item;
    const form = new FormData(e.currentTarget);
    const delta = toCents(form.get("amount")) * (form.get("direction") === "remove" ? -1 : 1);
    const current = Math.max(0, toCents(goal.current) + delta);

    setSaving(true);
    try {
      const result = await createClient().from("goals").update({ current: fromCents(current) }).eq("id", goal.id).select().single();
      if (result.error || !result.data) throw result.error;
      const item = toGoal(result.data);
      setGoals((list) => list.map((g) => (g.id === item.id ? item : g)));
      closeModal();
      notify("Progresso atualizado.");
    } catch {
      notify("Não foi possível atualizar a meta.");
    } finally {
      setSaving(false);
    }
  }

  function askToDelete(table: Table, id: string, label: string) {
    setConfirm({
      text: `Excluir “${label}”? Esta ação não pode ser desfeita.`,
      run: async () => {
        try {
          const { error } = await createClient().from(table).delete().eq("id", id);
          if (error) throw error;
          if (table === "transactions") setTransactions((list) => list.filter((t) => t.id !== id));
          if (table === "credit_cards") setCards((list) => list.filter((c) => c.id !== id));
          if (table === "goals") setGoals((list) => list.filter((g) => g.id !== id));
          notify("Item excluído.");
        } catch {
          notify("Não foi possível excluir o item.");
        } finally {
          setConfirm(null);
        }
      },
    });
  }

  function deleteCard(card: CreditCard) {
    if (transactions.some((t) => t.credit_card_id === card.id)) {
      return notify("Este cartão tem compras vinculadas. Reclassifique-as antes de excluir.");
    }
    askToDelete("credit_cards", card.id, card.name);
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await createClient().auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;
      notify("Configurações salvas.");
    } catch {
      notify("Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  const newTransaction = () => setModal({ kind: "transaction", item: null });
  const newCard = () => setModal({ kind: "card", item: null });
  const newGoal = () => setModal({ kind: "goal", item: null });

  // ---------- Conteúdo da página ----------
  function renderPage() {
    switch (page) {
      case "dashboard":
        return (
          <DashboardView
            totals={totals} balance={balance} categories={expenseByCategory} series={lastSixMonths}
            transactions={transactions} cards={cards} goals={goals}
            onNewTransaction={newTransaction} onNewCard={newCard} onNewGoal={newGoal}
          />
        );
      case "movimentacoes":
        return (
          <TransactionsView
            month={month} months={months} onMonthChange={setMonth}
            search={search} onSearchChange={setSearch}
            type={type} onTypeChange={setType}
            category={category} onCategoryChange={setCategory}
            items={visibleTransactions}
            onNew={newTransaction}
            onEdit={(item) => setModal({ kind: "transaction", item })}
            onDelete={(item) => askToDelete("transactions", item.id, item.description)}
          />
        );
      case "cartoes":
        return <CardsView cards={cards} transactions={transactions} onNew={newCard} onEdit={(item) => setModal({ kind: "card", item })} onDelete={deleteCard} />;
      case "metas":
        return (
          <GoalsView
            goals={goals} onNew={newGoal}
            onEdit={(item) => setModal({ kind: "goal", item })}
            onDelete={(item) => askToDelete("goals", item.id, item.name)}
            onAdjust={(item) => setModal({ kind: "adjust", item })}
          />
        );
      case "relatorios":
        return (
          <ReportsView
            month={month} months={months} onMonthChange={setMonth}
            totals={totals} balance={balance} totalInvoice={totalInvoice}
            categories={expenseByCategory} series={lastSixMonths}
          />
        );
      case "configuracoes":
        return <SettingsView name={name} email={email} saving={saving} onNameChange={setName} onSave={saveSettings} onLogout={() => void logout()} />;
    }
  }

  const title = navigation.find((item) => item.page === page)?.label;

  return (
    <div className="finance-app">
      <Sidebar page={page} open={menuOpen} userName={name} onClose={() => setMenuOpen(false)} onLogout={() => void logout()} />
      {menuOpen && <button className="overlay" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <main>
        <header>
          <button className="icon mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div>
            <small>FINANÇAS MATHEUS</small>
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <span>{email}</span>
            {page !== "configuracoes" && <button className="primary" onClick={newTransaction}><Plus size={17} />Nova movimentação</button>}
          </div>
        </header>

        {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}

        {data.loading ? <Loading /> : data.error ? (
          <section className="error">
            <h2>Não foi possível abrir o sistema</h2>
            <p>{data.error}</p>
            <button className="primary" onClick={() => void data.reload()}>Tentar novamente</button>
          </section>
        ) : renderPage()}
      </main>

      {modal?.kind === "transaction" && <TransactionForm transaction={modal.item} cards={cards} saving={saving} onClose={closeModal} onSubmit={saveTransaction} />}
      {modal?.kind === "card" && <CreditCardForm card={modal.item} saving={saving} onClose={closeModal} onSubmit={saveCard} />}
      {modal?.kind === "goal" && <GoalForm goal={modal.item} saving={saving} onClose={closeModal} onSubmit={saveGoal} />}
      {modal?.kind === "adjust" && <AdjustGoalForm goal={modal.item} saving={saving} onClose={closeModal} onSubmit={adjustGoal} />}
      {confirm && <ConfirmDialog text={confirm.text} onCancel={() => setConfirm(null)} onConfirm={() => void confirm.run()} />}
    </div>
  );
}
