import { ArrowDownLeft, BarChart3, CreditCard, LayoutDashboard, Settings, Target } from "lucide-react";

export type Page = "dashboard" | "movimentacoes" | "cartoes" | "metas" | "relatorios" | "configuracoes";

export const navigation = [
  { page: "dashboard", href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { page: "movimentacoes", href: "/movimentacoes", label: "Movimentações", icon: ArrowDownLeft },
  { page: "cartoes", href: "/cartoes", label: "Cartões", icon: CreditCard },
  { page: "metas", href: "/metas", label: "Metas", icon: Target },
  { page: "relatorios", href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { page: "configuracoes", href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;
