import Image from "next/image";

/**
 * Una foto de sus mesas, desenfocada y muy oscurecida, como textura de fondo
 * de las etapas nocturnas. Nunca compite con el contenido: es atmósfera.
 */
export function FondoNoche({
  foto,
  prioridad = false,
}: {
  foto: string;
  prioridad?: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Image
        src={foto}
        alt=""
        fill
        priority={prioridad}
        sizes="100vw"
        className="scale-110 object-cover opacity-40 blur-xl saturate-50"
      />
      <div className="bg-noche/55 absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--color-noche)_100%)]" />
    </div>
  );
}
