"use client";

import { useRef } from "react";

interface Props {
  onSelect: (files: FileList | null) => void;
}

export default function ImageUploader({ onSelect }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="border-2 border-dashed rounded-xl p-10 text-center">

      <input
        ref={ref}
        hidden
        multiple
        type="file"
        accept="image/*"
        onChange={(e) => onSelect(e.target.files)}
      />

      <button
        className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        onClick={() => ref.current?.click()}
      >
        Selecionar Fotos
      </button>

      <p className="mt-3 text-sm text-gray-500">
        JPG • PNG • WEBP
      </p>

    </div>
  );
}