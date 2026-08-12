import { CITAS } from "../contenido";
import { IconoCita } from "../iconos";
import type { Giro } from "../lib/almacenamiento";
import { nombreDeMesDeCiclo } from "../lib/cumplemes";
import { citaPorId } from "../lib/premios";

/**
 * Las citas de los meses anteriores. Se muestra solo a partir del segundo
 * ciclo: el primer mes no tiene pasado que recordar.
 */
export function Historial({ giros }: { giros: readonly Giro[] }) {
  if (giros.length === 0) return null;

  const enOrden = [...giros].sort((a, b) => b.ciclo.localeCompare(a.ciclo));

  return (
    <div className="mt-12 w-full max-w-sm">
      <h3 className="text-papel/60 text-center text-[13px]">
        Lo que ya te tocó
      </h3>

      <ul className="mt-4 flex flex-col gap-2">
        {enOrden.map((giro) => {
          const cita = citaPorId(CITAS, giro.citaId);
          if (!cita) return null;

          return (
            <li
              key={giro.ciclo}
              className="border-papel/10 bg-noche-alto/60 flex items-center gap-3 rounded-suave border px-4 py-3"
            >
              <IconoCita
                clave={cita.icono}
                size={18}
                strokeWidth={1.75}
                className="text-rosa-clara shrink-0"
              />
              <span className="text-papel/85 flex-1 text-[14px]">
                {cita.titulo}
              </span>
              <span className="text-papel/55 text-[12px]">
                {nombreDeMesDeCiclo(giro.ciclo)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
