import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, goalProgress } from "@/lib/finance";
import type { Goal } from "@/types/finance";
import { formatPercent } from "../mappers";
import { ProgressBar } from "../ui";

type Props = {
  goals: Goal[];
  onNew: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onAdjust: (goal: Goal) => void;
};

export function GoalsView({ goals, onNew, onEdit, onDelete, onAdjust }: Props) {
  return (
    <section className="cards">
      {goals.map((goal) => {
        const progress = goalProgress(goal);
        return (
          <article className="panel" key={goal.id}>
            <div className="actions">
              <div>
                <h2>{goal.name}</h2>
                <p className="muted">{goal.description || "Sem descrição"}</p>
              </div>
              <button className="icon" aria-label="Editar meta" onClick={() => onEdit(goal)}><Pencil size={16} /></button>
              <button className="icon danger" aria-label="Excluir meta" onClick={() => onDelete(goal)}><Trash2 size={16} /></button>
            </div>
            <strong className="amount">{formatCurrency(goal.current)} <small>de {formatCurrency(goal.target)}</small></strong>
            <ProgressBar value={progress} purple />
            <div className="split">
              <span>{formatPercent(progress)}% concluído</span>
              <button className="secondary" onClick={() => onAdjust(goal)}>Ajustar valor</button>
            </div>
            {goal.due_date && <p className="muted">Prazo: {formatDate(goal.due_date)}</p>}
          </article>
        );
      })}
      <button className="add-card" onClick={onNew}><Plus />Nova meta</button>
    </section>
  );
}
