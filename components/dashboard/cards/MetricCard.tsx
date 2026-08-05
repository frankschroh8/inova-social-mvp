"use client";

interface Props {
  titulo: string;
  valor: number;
}

export default function MetricCard({ titulo, valor }: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>

      <h2 className="mt-2 text-3xl font-bold">
        {valor}
      </h2>
    </div>
  );
}