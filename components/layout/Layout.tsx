"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const rotasComNavegacao = [
  "/dashboard",
  "/clientes",
  "/imoveis",
  "/agenda",
  "/funil",
  "/pesquisa-mercado",
];

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const deveMostrarNavegacao =
    rotasComNavegacao.some(
      (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
    ) && pathname !== "/pesquisa-mercado/relatorio";

  if (!deveMostrarNavegacao) {
    return <>{children}</>;
  }

  return (
    <div className="crm-shell">
      <Sidebar />

      <div className="crm-content">
        {children}
      </div>
    </div>
  );
}
