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
  const pathname = usePathname() || "";

  const rotaDoCrm = rotasComNavegacao.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );

  const rotaSemShell =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/pesquisa-mercado/relatorio";

  if (!rotaDoCrm || rotaSemShell) {
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
