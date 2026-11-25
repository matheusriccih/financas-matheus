"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CreditCard, Goal, Transaction } from "@/types/finance";
import { toCreditCard, toGoal, toTransaction } from "./mappers";

type FinanceSnapshot = {
  email: string;
  isDemo: boolean;
  name: string;
  transactions: Transaction[];
  cards: CreditCard[];
  goals: Goal[];
};

// Busca usuário, movimentações, cartões e metas. O RLS do banco garante
// que cada consulta retorne apenas os registros do usuário autenticado.
async function fetchFinanceData(): Promise<FinanceSnapshot> {
  const supabase = createClient();
  const user = await supabase.auth.getUser();
  if (user.error || !user.data.user) throw Error("Sua sessão expirou. Entre novamente.");

  const [tx, cc, gl] = await Promise.all([
    supabase.from("transactions").select("id,description,amount,type,category,date,credit_card_id,note").order("date", { ascending: false }),
    supabase.from("credit_cards").select("id,name,brand,last_four,credit_limit,closing_day,due_day,color").order("created_at", { ascending: false }),
    supabase.from("goals").select("id,name,target,current,due_date,description").order("created_at", { ascending: false }),
  ]);
  if (tx.error || cc.error || gl.error) {
    throw Error("Não foi possível carregar os dados financeiros. Execute a migração do Supabase e tente novamente.");
  }

  return {
    email: user.data.user.email ?? "",
    // A conta de demonstração é marcada em app_metadata (só o banco pode alterar).
    isDemo: user.data.user.app_metadata?.demo === true,
    name: String(user.data.user.user_metadata.full_name ?? ""),
    transactions: (tx.data ?? []).map(toTransaction),
    cards: (cc.data ?? []).map(toCreditCard),
    goals: (gl.data ?? []).map(toGoal),
  };
}

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((promise: Promise<FinanceSnapshot>) =>
    promise
      .then((snapshot) => {
        setEmail(snapshot.email);
        setName(snapshot.name);
        setIsDemo(snapshot.isDemo);
        setTransactions(snapshot.transactions);
        setCards(snapshot.cards);
        setGoals(snapshot.goals);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar seus dados."))
      .finally(() => setLoading(false)), []);

  useEffect(() => {
    void apply(fetchFinanceData());
  }, [apply]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return apply(fetchFinanceData());
  }, [apply]);

  return {
    transactions, setTransactions,
    cards, setCards,
    goals, setGoals,
    email, name, setName, isDemo,
    loading, error, reload,
  };
}
