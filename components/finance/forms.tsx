import type { FormEvent } from "react";
import { categories } from "@/lib/finance";
import type { CreditCard, Goal, Transaction } from "@/types/finance";
import { today } from "./mappers";
import { Modal, ModalActions } from "./Modal";

// Formulários não controlados: os valores são lidos com FormData no envio.

type FormProps = {
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TransactionForm({ transaction, cards, saving, onClose, onSubmit }: FormProps & { transaction: Transaction | null; cards: CreditCard[] }) {
  const x = transaction;
  return (
    <Modal title={x ? "Editar movimentação" : "Nova movimentação"} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <label>Descrição<input name="description" required maxLength={120} defaultValue={x?.description ?? ""} /></label>
        <div className="two">
          <label>Valor<input name="amount" type="number" step="0.01" min="0.01" required defaultValue={x?.amount ?? ""} /></label>
          <label>Data<input name="date" type="date" required defaultValue={x?.date ?? today()} /></label>
        </div>
        <div className="two">
          <label>Tipo
            <select name="type" defaultValue={x?.type ?? "expense"}>
              <option value="expense">Despesa</option>
              <option value="income">Entrada</option>
            </select>
          </label>
          <label>Categoria
            <select name="category" defaultValue={x?.category ?? "Outros"}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <div className="two">
          <label>Pagamento
            <select name="payment" defaultValue={x?.credit_card_id ? "credit" : "account"}>
              <option value="account">Conta / débito</option>
              <option value="credit">Cartão de crédito</option>
            </select>
          </label>
          <label>Cartão
            <select name="credit_card_id" defaultValue={x?.credit_card_id ?? ""}>
              <option value="">Selecione</option>
              {cards.map((c) => <option value={c.id} key={c.id}>{c.last_four ? `${c.name} •••• ${c.last_four}` : c.name}</option>)}
            </select>
          </label>
        </div>
        <label>Observação <small>opcional</small><textarea name="note" defaultValue={x?.note ?? ""} maxLength={500} /></label>
        <ModalActions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function CreditCardForm({ card, saving, onClose, onSubmit }: FormProps & { card: CreditCard | null }) {
  const x = card;
  return (
    <Modal title={x ? "Editar cartão" : "Novo cartão"} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <label>Nome<input name="name" required defaultValue={x?.name ?? ""} /></label>
        <div className="two">
          <label>Bandeira<input name="brand" defaultValue={x?.brand ?? ""} /></label>
          <label>Últimos 4 dígitos<input name="last_four" inputMode="numeric" maxLength={4} defaultValue={x?.last_four ?? ""} /></label>
        </div>
        <label>Limite<input name="credit_limit" type="number" required min="0.01" step="0.01" defaultValue={x?.credit_limit ?? ""} /></label>
        <div className="two">
          <label>Fechamento<input name="closing_day" type="number" required min="1" max="31" defaultValue={x?.closing_day ?? 1} /></label>
          <label>Vencimento<input name="due_day" type="number" required min="1" max="31" defaultValue={x?.due_day ?? 10} /></label>
        </div>
        <label>Cor<input name="color" type="color" defaultValue={x?.color ?? "#2f72ff"} /></label>
        <ModalActions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function GoalForm({ goal, saving, onClose, onSubmit }: FormProps & { goal: Goal | null }) {
  const x = goal;
  return (
    <Modal title={x ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <label>Nome<input name="name" required defaultValue={x?.name ?? ""} /></label>
        <div className="two">
          <label>Objetivo<input name="target" type="number" required min="0.01" step="0.01" defaultValue={x?.target ?? ""} /></label>
          <label>Valor atual<input name="current" type="number" required min="0" step="0.01" defaultValue={x?.current ?? 0} /></label>
        </div>
        <label>Prazo <small>opcional</small><input name="due_date" type="date" defaultValue={x?.due_date ?? ""} /></label>
        <label>Descrição <small>opcional</small><textarea name="description" defaultValue={x?.description ?? ""} /></label>
        <ModalActions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function AdjustGoalForm({ goal, saving, onClose, onSubmit }: FormProps & { goal: Goal | null }) {
  return (
    <Modal title={`Ajustar ${goal?.name ?? "meta"}`} onClose={onClose}>
      <form className="form" onSubmit={onSubmit}>
        <label>Operação
          <select name="direction">
            <option value="add">Adicionar valor</option>
            <option value="remove">Remover valor</option>
          </select>
        </label>
        <label>Valor<input name="amount" type="number" required min="0.01" step="0.01" autoFocus /></label>
        <ModalActions saving={saving} onCancel={onClose} label="Atualizar" />
      </form>
    </Modal>
  );
}
