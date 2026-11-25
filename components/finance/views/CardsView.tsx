import { Pencil, Plus, Trash2 } from "lucide-react";
import { cardAvailable, cardInvoiceTotal, formatCurrency, fromCents, toCents } from "@/lib/finance";
import type { CreditCard, Transaction } from "@/types/finance";
import { ProgressBar } from "../ui";

type Props = {
  cards: CreditCard[];
  transactions: Transaction[];
  onNew: () => void;
  onEdit: (card: CreditCard) => void;
  onDelete: (card: CreditCard) => void;
};

export function CardsView({ cards, transactions, onNew, onEdit, onDelete }: Props) {
  return (
    <section className="cards">
      {cards.map((card) => {
        const invoice = cardInvoiceTotal(card, transactions);
        return (
          <article className="panel" key={card.id}>
            <div className="card-visual" style={{ background: `linear-gradient(135deg,${card.color ?? "#2f72ff"},#14223d)` }}>
              <small>{card.brand || "Crédito"}</small>
              <b>{card.name}</b>
              <span>{card.last_four ? `•••• ${card.last_four}` : "Final não informado"}</span>
            </div>
            <div className="actions">
              <div>
                <small className="muted">Fatura atual</small>
                <strong>{formatCurrency(fromCents(invoice))}</strong>
              </div>
              <button className="icon" aria-label="Editar cartão" onClick={() => onEdit(card)}><Pencil size={16} /></button>
              <button className="icon danger" aria-label="Excluir cartão" onClick={() => onDelete(card)}><Trash2 size={16} /></button>
            </div>
            <ProgressBar value={card.credit_limit ? (invoice / toCents(card.credit_limit)) * 100 : 0} />
            <div className="split">
              <span>Disponível <b>{formatCurrency(fromCents(cardAvailable(card, transactions)))}</b></span>
              <span>Vence dia <b>{card.due_day}</b></span>
            </div>
            <p className="muted">Fecha dia {card.closing_day} · limite {formatCurrency(card.credit_limit)}</p>
          </article>
        );
      })}
      <button className="add-card" onClick={onNew}><Plus />Adicionar cartão</button>
    </section>
  );
}
