interface Props {
  item: any;
}

export default function AgendaCard({ item }: Props) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">

      <h3 className="font-semibold">
        {item.titulo}
      </h3>

      <p className="text-sm text-gray-500">
        {item.data}
      </p>

      <p className="text-sm">
        {item.hora}
      </p>

    </div>
  );
}