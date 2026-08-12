import type { TiempoJuntos } from "../lib/cumplemes";

/**
 * Muestra un desglose de tiempo. Se usa para "cuánto llevamos juntos" en la
 * carta y para "cuánto falta para el próximo giro" en la etapa del premio.
 *
 * Es un componente tonto: recibe el tiempo ya calculado, no lee el reloj.
 */
export function Contador({
  tiempo,
  tono = "papel",
}: {
  tiempo: TiempoJuntos;
  tono?: "papel" | "noche";
}) {
  const unidades = [
    { valor: tiempo.dias, etiqueta: tiempo.dias === 1 ? "día" : "días" },
    { valor: tiempo.horas, etiqueta: tiempo.horas === 1 ? "hora" : "horas" },
    { valor: tiempo.minutos, etiqueta: "min" },
    { valor: tiempo.segundos, etiqueta: "seg" },
  ];

  const colorValor = tono === "papel" ? "text-tinta" : "text-rosa-clara";
  const colorEtiqueta = tono === "papel" ? "text-humo" : "text-papel/55";

  return (
    <div className="flex items-baseline justify-center gap-4 sm:gap-6">
      {unidades.map((unidad) => (
        <div key={unidad.etiqueta} className="text-center">
          <div
            className={`${colorValor} text-2xl font-semibold tabular-nums sm:text-3xl`}
          >
            {unidad.valor}
          </div>
          <div
            className={`${colorEtiqueta} mt-0.5 text-[11px] tracking-wide`}
          >
            {unidad.etiqueta}
          </div>
        </div>
      ))}
    </div>
  );
}
