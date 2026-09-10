 "use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/auth-redirect";
import "./AuthForms.css";

export default function SignupForm() {
  const router=useRouter(); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState(""); const [error,setError]=useState(""); const [ok,setOk]=useState(""); const [loading,setLoading]=useState(false); const [resending,setResending]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setError("");setOk("");setLoading(true);
    const supabase=createClient();
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:authCallbackUrl("/dashboard")}});
    if(error){setError(error.message.toLowerCase().includes("rate")?"Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.":"Não foi possível criar a conta. Tente novamente em alguns instantes.");setLoading(false);return;}
    if(data.session){router.replace("/dashboard");return;}
    setOk("Conta criada. Confirme seu e-mail para ativar o acesso ao Finanças Matheus.");
    setLoading(false);
  }
  async function resend(){if(!email)return setError("Informe seu e-mail acima para reenviar a confirmação.");setResending(true);setError("");try{const {error}=await createClient().auth.resend({type:"signup",email,options:{emailRedirectTo:authCallbackUrl("/dashboard")}});if(error)throw error;setOk("Enviamos um novo link de confirmação. Verifique sua caixa de entrada e spam.");}catch{setError("Não foi possível reenviar agora. A conta pode já estar confirmada ou o limite de envio foi atingido. Tente novamente mais tarde.");}finally{setResending(false)}}
  return <main className="auth-page"><form className="auth-box" onSubmit={submit}>
    <div className="auth-logo">M</div><h1>Crie sua conta.</h1><p>Comece a organizar sua vida financeira.</p>
    <label>Nome<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Matheus" disabled={loading||resending}/></label>
    <label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" disabled={loading||resending}/></label>
    <label>Senha<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="mínimo 8 caracteres" disabled={loading||resending}/></label>
    {error&&<div className="auth-error" role="alert">{error}</div>}{ok&&<div className="auth-success" role="status">{ok}</div>}
    <button className="auth-btn" disabled={loading||resending}>{loading?"Criando conta...":"Criar conta"}</button>
    {ok&&<button className="auth-link auth-link-button" type="button" onClick={()=>void resend()} disabled={resending}>{resending?"Enviando e-mail...":"Reenviar e-mail de confirmação"}</button>}
    <Link className="auth-link" href="/auth/login">Já tenho uma conta</Link>
  </form></main>
}
