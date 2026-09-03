"use client";

import Link from "next/link";

const menus = [
  { nome: "Dashboard", link: "/dashboard" },
  { nome: "Clientes", link: "/clientes" },
  { nome: "Imóveis", link: "/imoveis" },
  { nome: "Pesquisa de Mercado", link: "/pesquisa-mercado" },
  { nome: "Captação", link: "/captacao" },
  { nome: "Agenda", link: "/agenda" },
  { nome: "IA", link: "/ia" },
  { nome: "Marketing", link: "/marketing" },
  { nome: "Financeiro", link: "/financeiro" },
  { nome: "Documentos", link: "/documentos" },
  { nome: "Configurações", link: "/configuracoes" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 250,
        background: "#111827",
        color: "#fff",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <h2>Inova Social AI</h2>

      <hr />

      {menus.map((item) => (
        <div key={item.link} style={{ marginTop: 15 }}>
          <Link
            href={item.link}
            style={{
              color: "#fff",
              textDecoration: "none",
            }}
          >
            {item.nome}
          </Link>
        </div>
      ))}
    </aside>
  );
}
