"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authCallbackUrl } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";
import "./AuthForms.css";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      const { error: requestError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: authCallbackUrl("/auth/redefinir-senha"),
      });
      if (requestError) throw requestError;
      setMessage("Se houver uma conta para este e-mail, enviaremos as instruções de recuperação em instantes.");
    } catch {
      setError("Não foi possível enviar as instruções agora. Verifique o e-mail e tente novamente mais tarde.");
    } finally { setLoading(false); }
  }

  return <main className="auth-page"><form className="auth-box" onSubmit={submit}>
    <div className="auth-logo">M</div><h1>Recuperar senha</h1><p>Informe seu e-mail para receber um link seguro de recuperação.</p>
    <label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" disabled={loading}/></label>
    {error && <div className="auth-error" role="alert">{error}</div>}{message && <div className="auth-success" role="status">{message}</div>}
    <button className="auth-btn" disabled={loading}>{loading ? "Enviando..." : "Enviar instruções"}</button>
    <Link className="auth-link" href="/auth/login">Voltar para entrar</Link>
  </form></main>;
}
