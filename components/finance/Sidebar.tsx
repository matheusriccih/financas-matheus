import Link from "next/link";
import { LogOut, WalletCards, X } from "lucide-react";
import { navigation, type Page } from "./navigation";

export function Sidebar({ page, open, userName, onClose, onLogout }: {
  page: Page;
  open: boolean;
  userName: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <WalletCards size={21} />
        <b>Finanças Matheus</b>
        <button className="icon close" onClick={onClose} aria-label="Fechar menu"><X /></button>
      </div>
      <nav>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link className={page === item.page ? "active" : ""} href={item.href} key={item.page} onClick={onClose}>
              <Icon size={18} />{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <small>{userName || "Sua conta"}</small>
        <button onClick={onLogout}><LogOut size={17} />Sair</button>
      </div>
    </aside>
  );
}
