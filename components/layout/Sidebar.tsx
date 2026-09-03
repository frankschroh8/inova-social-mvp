"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { nome: "Dashboard", link: "/dashboard" },
  { nome: "Clientes", link: "/clientes" },
  { nome: "Imóveis", link: "/imoveis" },
  { nome: "Agenda", link: "/agenda" },
  { nome: "Funil", link: "/funil" },
  { nome: "Pesquisa de Mercado", link: "/pesquisa-mercado" },
];

export default function Sidebar() {
  const pathname = usePathname();

  function estaAtivo(link: string) {
    return pathname === link || pathname.startsWith(`${link}/`);
  }

  return (
    <aside
      className="crm-sidebar"
    >
      <div className="crm-sidebar-brand">
        <span className="crm-sidebar-logo">IS</span>

        <div>
          <strong>Inova Social AI</strong>
          <span>CRM Imobiliário</span>
        </div>
      </div>

      <nav className="crm-sidebar-nav" aria-label="Menu principal">
        {menus.map((item) => {
          const ativo = estaAtivo(item.link);

          return (
            <Link
              key={item.link}
              href={item.link}
              className={`crm-sidebar-link${
                ativo ? " crm-sidebar-link-active" : ""
              }`}
              aria-current={ativo ? "page" : undefined}
            >
              {item.nome}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
