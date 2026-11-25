import type { FormEvent } from "react";
import { LogOut } from "lucide-react";
import { PanelTitle } from "../ui";

type Props = {
  name: string;
  email: string;
  saving: boolean;
  onNameChange: (value: string) => void;
  onSave: (event: FormEvent) => void;
  onLogout: () => void;
};

export function SettingsView({ name, email, saving, onNameChange, onSave, onLogout }: Props) {
  return (
    <section className="settings">
      <form className="panel form" onSubmit={onSave}>
        <PanelTitle title="Conta" subtitle="Informações do seu perfil" />
        <label>Nome<input value={name} onChange={(e) => onNameChange(e.target.value)} maxLength={80} /></label>
        <label>E-mail<input value={email} disabled /></label>
        <button className="primary" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
      </form>
      <article className="panel">
        <PanelTitle title="Sessão e privacidade" />
        <p className="muted">Os registros financeiros são protegidos por usuário no banco de dados.</p>
        <button className="secondary" onClick={onLogout}><LogOut size={16} />Encerrar sessão</button>
      </article>
    </section>
  );
}
