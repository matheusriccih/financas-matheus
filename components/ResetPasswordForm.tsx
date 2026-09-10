"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import "./AuthForms.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password.length < 8) return setError("Use uma senha com pelo menos 8 caracteres.");
    if (password !== confirmation) return setError("As senhas não coincidem.");
    setLoading(true);
    try {
      const supabase = createClient(); const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      router.replace("/auth/login?auth=password-updated");
    } catch { setError("Não foi possível atualizar a senha. Solicite um novo link e tente novamente."); }
    finally { setLoading(false); }
  }

  return <main className="auth-page"><form className="auth-box" onSubmit={submit}>
    <div className="auth-logo">M</div><h1>Defina uma nova senha</h1><p>Escolha uma senha forte para proteger sua conta.</p>
    {!ready && <div className="auth-error" role="alert">Este link não é válido ou expirou. Solicite uma nova recuperação.</div>}
    <label>Nova senha<input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!ready || loading}/></label>
    <label>Confirmar nova senha<input type="password" required minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={!ready || loading}/></label>
    {error && <div className="auth-error" role="alert">{error}</div>}
    <button className="auth-btn" disabled={!ready || loading}>{loading ? "Atualizando..." : "Atualizar senha"}</button>
    <Link className="auth-link" href="/auth/esqueci-senha">Solicitar outro link</Link>
  </form></main>;
}
