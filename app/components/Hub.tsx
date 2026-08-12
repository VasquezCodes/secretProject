"use client";

import { motion, useReducedMotion } from "motion/react";

import { CARTA, ELLA, type Cita } from "../contenido";
import { IconoCita } from "../iconos";
import type { Giro } from "../lib/almacenamiento";
import { nombreDeMesDeCiclo } from "../lib/cumplemes";
import { FondoNoche } from "./FondoNoche";
import { RuedaMini } from "./RuedaMini";

/**
 * El hub: la pantalla a la que vuelve siempre.
 *
 * No es un menú de tarjetas iguales. Es una mesa con sus cosas encima: la
 * rueda en miniatura (la de verdad, misma geometría), la carta ladeada como
 * si la hubiera dejado ahí, y sus citas como fichas que se van llenando.
 *
 * Las fichas son lo que crece: dentro de un año son el regalo, más que
 * cualquier giro suelto.
 */
export function Hub({
  citas,
  giros,
  citaDeEsteCiclo,
  ciclo,
  numeroDeCumplemes,
  onRuleta,
  onCarta,
}: {
  citas: readonly Cita[];
  giros: readonly Giro[];
  citaDeEsteCiclo: Cita | null;
  ciclo: string;
  numeroDeCumplemes: number;
  onRuleta: () => void;
  onCarta: () => void;
}) {
  const reducirMovimiento = useReducedMotion();

  const descubiertas = new Set(giros.map((giro) => giro.citaId));
  const indiceGanador = citaDeEsteCiclo
    ? citas.findIndex((cita) => cita.id === citaDeEsteCiclo.id)
    : -1;

  const entrada = (retraso: number) => ({
    initial: reducirMovimiento ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: retraso, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 py-12">
      <FondoNoche foto="/fotos/mesa-arepas.jpg" prioridad />

      <div className="relative flex w-full max-w-sm flex-col">
        <motion.header {...entrada(0)} className="self-start">
          <p className="text-papel/50 text-[13px] capitalize">
            {nombreDeMesDeCiclo(ciclo)}
          </p>
          <h1 className="text-papel mt-0.5 text-3xl font-semibold tracking-tight">
            Cumplemes {numeroDeCumplemes}
          </h1>
        </motion.header>

        <motion.button
          {...entrada(0.1)}
          type="button"
          onClick={onRuleta}
          className="group mt-9 flex cursor-pointer flex-col items-center"
        >
          <div className="w-[68%] transition-transform duration-300 group-active:scale-[0.97]">
            <RuedaMini
              citas={citas}
              indiceGanador={indiceGanador >= 0 ? indiceGanador : null}
              esperando={citaDeEsteCiclo === null}
            />
          </div>

          {citaDeEsteCiclo ? (
            <>
              <p className="text-papel mt-1 text-xl font-semibold">
                {citaDeEsteCiclo.titulo}
              </p>
              <p className="text-papel/50 mt-1 text-[13px]">
                Tu cita de este mes. Toca para verla.
              </p>
            </>
          ) : (
            <>
              <p className="text-rosa-clara mt-1 text-xl font-semibold">
                Te toca girar
              </p>
              <p className="text-papel/50 mt-1 text-[13px]">
                Tienes un giro esperando
              </p>
            </>
          )}
        </motion.button>

        <motion.button
          {...entrada(0.2)}
          type="button"
          onClick={onCarta}
          className="bg-papel-alto mt-12 -rotate-[1.5deg] cursor-pointer rounded-suave px-5 py-4 text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] transition-transform duration-300 hover:rotate-0 active:scale-[0.98]"
        >
          <p className="text-humo text-[12px]">La carta del primer mes</p>
          <p className="font-carta text-tinta mt-1.5 line-clamp-2 text-[16px] italic leading-snug">
            {ELLA.apodo}, {CARTA[0]}
          </p>
        </motion.button>

        <motion.div {...entrada(0.3)} className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-papel/85 text-[15px] font-semibold">Tus citas</h2>
            <p className="text-papel/45 text-[12px]">
              {descubiertas.size} de {citas.length}
            </p>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2.5">
            {citas.map((cita) => {
              const tiene = descubiertas.has(cita.id);

              return (
                <li key={cita.id}>
                  <div
                    title={tiene ? cita.titulo : "Todavía sin descubrir"}
                    className={
                      tiene
                        ? "border-rosa/60 bg-rosa-honda/35 flex h-11 w-11 items-center justify-center rounded-full border"
                        : "border-papel/15 flex h-11 w-11 items-center justify-center rounded-full border border-dashed"
                    }
                  >
                    {tiene ? (
                      <IconoCita
                        clave={cita.icono}
                        size={19}
                        strokeWidth={1.75}
                        className="text-rosa-clara"
                      />
                    ) : (
                      <span className="text-papel/25 text-[15px] font-bold">?</span>
                    )}
                  </div>
                  <span className="sr-only">
                    {tiene ? cita.titulo : "Cita sin descubrir"}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
