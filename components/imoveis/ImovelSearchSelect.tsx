"use client";

import { useEffect, useState } from "react";
import {
  buscarImoveisParaSelecao,
  type ImovelSelecao,
} from "@/services/imoveis";

interface ImovelSearchSelectProps {
  selecionado: ImovelSelecao | null;
  onSelect: (imovel: ImovelSelecao | null) => void;
}

function rotuloImovel(imovel: ImovelSelecao) {
  return [imovel.codigo ? `[${imovel.codigo}]` : "", imovel.titulo]
    .filter(Boolean)
    .join(" ");
}

function detalheLocalizacao(imovel: ImovelSelecao) {
  return [imovel.bairro, imovel.cidade].filter(Boolean).join(" - ");
}

function detalheEndereco(imovel: ImovelSelecao) {
  return [imovel.endereco, imovel.numero].filter(Boolean).join(", ");
}

export function ImovelSearchSelect({
  selecionado,
  onSelect,
}: ImovelSearchSelectProps) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ImovelSelecao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");
  const termoNormalizado = termo.trim();

  useEffect(() => {
    let ativo = true;

    if (selecionado || termoNormalizado.length < 2) {
      setResultados([]);
      setBuscando(false);
      setErro("");
      return;
    }

    setBuscando(true);
    setErro("");

    const timer = window.setTimeout(async () => {
      try {
        const imoveis = await buscarImoveisParaSelecao(termoNormalizado);

        if (ativo) {
          setResultados(imoveis);
        }
      } catch (error) {
        console.error("Erro ao buscar imóveis:", error);

        if (ativo) {
          setErro("Erro ao buscar imóveis.");
          setResultados([]);
        }
      } finally {
        if (ativo) {
          setBuscando(false);
        }
      }
    }, 300);

    return () => {
      ativo = false;
      window.clearTimeout(timer);
    };
  }, [selecionado, termoNormalizado]);

  if (selecionado) {
    const localizacao = detalheLocalizacao(selecionado);

    return (
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 10,
          padding: 12,
          background: "#fff",
        }}
      >
        <small
          style={{
            display: "block",
            color: "#6b7280",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Imóvel selecionado
        </small>

        <strong>{rotuloImovel(selecionado)}</strong>

        {localizacao && (
          <p style={{ margin: "4px 0 0", color: "#4b5563" }}>
            {localizacao}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setTermo("");
            setResultados([]);
          }}
          style={{
            marginTop: 10,
            padding: "7px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#111827",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Trocar imóvel
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        value={termo}
        onChange={(event) => setTermo(event.target.value)}
        placeholder="Buscar imóvel por código, título, bairro, endereço ou proprietário"
        style={{
          display: "block",
          width: "100%",
          padding: 10,
          marginTop: 5,
          border: "1px solid #d1d5db",
          borderRadius: 8,
        }}
      />

      {buscando && (
        <p style={{ margin: "8px 0 0", color: "#6b7280" }}>Buscando...</p>
      )}

      {erro && <p style={{ margin: "8px 0 0", color: "#b91c1c" }}>{erro}</p>}

      {!buscando &&
        !erro &&
        termoNormalizado.length >= 2 &&
        resultados.length === 0 && (
          <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
            Nenhum imóvel encontrado
          </p>
        )}

      {resultados.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 8,
          }}
        >
          {resultados.map((imovel) => {
            const localizacao = detalheLocalizacao(imovel);
            const endereco = detalheEndereco(imovel);

            return (
              <button
                key={imovel.id}
                type="button"
                onClick={() => onSelect(imovel)}
                style={{
                  textAlign: "left",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <strong>{rotuloImovel(imovel)}</strong>

                {localizacao && (
                  <p style={{ margin: "4px 0 0", color: "#4b5563" }}>
                    {localizacao}
                  </p>
                )}

                {endereco && (
                  <small style={{ color: "#6b7280" }}>{endereco}</small>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
