"use client";

import { useUploadFotos } from "@/hooks/useUploadFotos";

export default function UploadFotos() {

  const {
    fotos,
    adicionar,
    remover
  } = useUploadFotos();

  return (

    <div>

      <input

        multiple

        type="file"

        accept="image/*"

        onChange={(e)=>adicionar(e.target.files)}

      />

      <div className="grid grid-cols-4 gap-4 mt-5">

        {fotos.map((foto,index)=>(

          <div key={index}>

            <img

              src={URL.createObjectURL(foto)}

              className="rounded-xl h-40 w-full object-cover"

            />

            <button

              onClick={()=>remover(index)}

            >

              Remover

            </button>

          </div>

        ))}

      </div>

    </div>

  );

}