 "use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/auth-redirect";
import "./AuthForms.css";

export default function LoginForm() {
  const router=useRouter(); const searchParams=useSearchParams(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false); const message=searchParams.get("auth");
  async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError("");
    try {const supabase=createClient(); const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error){setError(error.message.toLowerCase().includes("confirm")?"Confirme seu e-mail antes de entrar. Se necessário, peça um novo e-mail de confirmação no cadastro.":"Não foi possível entrar. Verifique o e-mail e a senha.");return;}
      router.replace(safeInternalPath(new URLSearchParams(window.location.search).get("next")));
    } catch {setError("Não foi possível entrar agora. Verifique a conexão e tente novamente.");} finally {setLoading(false);}
  }
  return <main className="auth-page"><form className="auth-box" onSubmit={submit}>
    <div className="auth-logo">M</div><h1>Bem-vindo de volta.</h1><p>Entre para acessar seu controle financeiro.</p>
    <label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label>
    <label>Senha<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
    {message==="password-updated"&&<div className="auth-success" role="status">Senha atualizada. Entre com sua nova senha.</div>}
    {message==="callback"&&<div className="auth-error" role="alert">Não foi possível validar o link de autenticação. Solicite um novo link.</div>}
    {message==="configuration"&&<div className="auth-error" role="alert">A aplicação não está configurada para autenticação. Tente novamente mais tarde.</div>}
    {error&&<div className="auth-error" role="alert">{error}</div>}
    <button className="auth-btn" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
    <Link className="auth-link" href="/auth/signup">Ainda não tenho conta</Link>
    <Link className="auth-link" href="/auth/esqueci-senha">Esqueci minha senha</Link>
  </form></main>
}
