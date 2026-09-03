import { useState } from "react";

export function useUploadFotos() {
  const [fotos, setFotos] = useState<File[]>([]);

  function adicionar(files: FileList | null) {
    if (!files) return;

    setFotos((antigas) => [...antigas, ...Array.from(files)]);
  }

  function remover(index: number) {
    setFotos((antigas) =>
      antigas.filter((_, i) => i !== index)
    );
  }

  return {
    fotos,
    adicionar,
    remover,
  };
}