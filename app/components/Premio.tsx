"use client";

import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { CITAS, type Cita } from "../contenido";
import { IconoCita } from "../iconos";
import type { Giro } from "../lib/almacenamiento";
import type { TiempoJuntos } from "../lib/cumplemes";
import { citasNoDescubiertas } from "../lib/premios";
import { Contador } from "./Contador";
import { FondoNoche } from "./FondoNoche";
import { Historial } from "./Historial";

/**
 * La cita que ganó, más el pasado y la espera.
 *
 * Es también la pantalla que ve al volver a entrar dentro del mismo ciclo,
 * en vez de la ruleta.
 */
export function Premio({
  cita,
  numeroDeCumplemes,
  historial,
  faltan,
  onVolver,
}: {
  cita: Cita;
  numeroDeCumplemes: number;
  historial: readonly Giro[];
  faltan: TiempoJuntos;
  onVolver: () => void;
}) {
  const reducirMovimiento = useReducedMotion();
  const porDescubrir = citasNoDescubiertas(
    [...historial, { citaId: cita.id }],
    CITAS,
  );

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-14">
      <FondoNoche foto="/fotos/mesa-pabellon.jpg" prioridad />

      <button
        type="button"
        onClick={onVolver}
        className="text-papel/60 hover:text-papel absolute left-4 top-5 z-10 flex cursor-pointer items-center gap-1 rounded-full py-2 pl-2 pr-3 text-sm transition-colors"
      >
        <ArrowLeft size={18} />
        Volver
      </button>

      <motion.div
        initial={reducirMovimiento ? false : { opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex w-full max-w-sm flex-col items-center"
      >
        <p className="text-papel/65 text-[13px]">Cumplemes {numeroDeCumplemes}</p>

        <div className="border-rosa/45 bg-papel mt-4 w-full rounded-suave border-2 px-7 py-9 text-center shadow-[0_34px_70px_-28px_rgba(0,0,0,0.85)]">
          <div className="bg-rosa/18 border-rosa/35 mx-auto flex h-16 w-16 items-center justify-center rounded-full border">
            <IconoCita
              clave={cita.icono}
              size={30}
              strokeWidth={1.6}
              className="text-rosa-honda"
            />
          </div>

          <h2 className="text-tinta mt-6 text-[26px] font-semibold leading-tight tracking-tight">
            {cita.titulo}
          </h2>

          <p className="font-carta text-tinta/80 mt-4 text-[17px] leading-relaxed">
            {cita.descripcion}
          </p>

          <p className="text-humo border-humo/25 mt-7 border-t pt-5 text-[13px]">
            Te la debo. Vale por una cita.
          </p>
        </div>

        <div className="mt-10 text-center">
          <p className="text-papel/65 text-[13px]">
            El próximo giro se abre en
          </p>
          <div className="mt-3">
            <Contador tiempo={faltan} tono="noche" />
          </div>
          <p className="text-papel/60 mt-5 text-[12px]">
            {porDescubrir === 1
              ? "Queda 1 cita por descubrir"
              : `Quedan ${porDescubrir} citas por descubrir`}
          </p>
        </div>

        <Historial giros={historial} />
      </motion.div>
    </section>
  );
}
