interface Props {
  imagens: string[];
}

export default function PropertyGallery({ imagens }: Props) {

  return (

    <div className="grid grid-cols-3 gap-4">

      {imagens.map((img) => (

        <img
          key={img}
          src={img}
          className="rounded-xl h-40 w-full object-cover"
        />

      ))}

    </div>

  );

}