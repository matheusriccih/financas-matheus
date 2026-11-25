import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-bg" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon close" onClick={onClose} aria-label="Fechar"><X /></button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

export function ModalActions({ saving, onCancel, label = "Salvar" }: { saving: boolean; onCancel: () => void; label?: string }) {
  return (
    <div className="modal-actions">
      <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
      <button className="primary" disabled={saving}>{saving ? "Salvando…" : label}</button>
    </div>
  );
}

export function ConfirmDialog({ text, onCancel, onConfirm }: { text: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal title="Confirmar exclusão" onClose={onCancel}>
      <p>{text}</p>
      <div className="modal-actions">
        <button className="secondary" onClick={onCancel}>Cancelar</button>
        <button className="danger-button" onClick={onConfirm}>Excluir</button>
      </div>
    </Modal>
  );
}
