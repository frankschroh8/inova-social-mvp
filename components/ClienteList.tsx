"use client";

import { Cliente } from "@/types/cliente";

interface Props {
  clientes: Cliente[];
}

export default function ClienteList({ clientes }: Props) {
  return (
    <div>
      <h2>Clientes</h2>

      {clientes.length === 0 ? (
        <p>Nenhum cliente cadastrado.</p>
      ) : (
        clientes.map((cliente) => (
          <div key={cliente.id}>
            <strong>{cliente.nome}</strong>
            <br />
            {cliente.telefone}
          </div>
        ))
      )}
    </div>
  );
}