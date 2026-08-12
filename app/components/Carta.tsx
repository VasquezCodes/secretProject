"use client";

import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { CARTA, CIERRE, ELLA, FIRMA, FOTOS } from "../contenido";
import type { TiempoJuntos } from "../lib/cumplemes";
import { Contador } from "./Contador";
import { Corazones } from "./Corazones";

/**
 * La carta. El objeto que se está imitando es una carta de papel, así que se
 * compone como una carta: Garamond, medida de lectura corta, interlínea
 * generosa, y la firma en itálica al pie.
 */
export function Carta({
  tiempo,
  numeroDeCumplemes,
  puedeGirar,
  onContinuar,
  onVolver,
}: {
  tiempo: TiempoJuntos;
  numeroDeCumplemes: number;
  puedeGirar: boolean;
  onContinuar: () => void;
  /** Ausente la primera vez: todavía no hay hub al que volver. */
  onVolver?: () => void;
}) {
  const reducirMovimiento = useReducedMotion();

  const parrafo = {
    oculto: reducirMovimiento ? {} : { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="bg-papel relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-3 py-14 sm:px-5">
      <Corazones />

      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="text-humo hover:text-tinta absolute left-3 top-4 z-10 flex cursor-pointer items-center gap-1 rounded-full py-2 pl-2 pr-3 text-sm transition-colors"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      )}

      <motion.article
        initial={reducirMovimiento ? false : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="bg-papel-alto relative w-full max-w-[31rem] rounded-suave px-6 py-10 shadow-[0_30px_70px_-32px_rgba(42,30,26,0.45)] sm:px-11"
      >
        <motion.div
          initial={reducirMovimiento ? false : { opacity: 0, scale: 0.94, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto -mt-20 mb-8 w-40 rounded-[10px] bg-white p-2 pb-6 shadow-[0_16px_34px_-14px_rgba(42,30,26,0.55)] sm:w-48"
        >
          <Image
            src={FOTOS.retrato}
            alt={`${ELLA.nombre}, este mes`}
            width={420}
            height={520}
            priority
            className="h-44 w-full rounded-[6px] object-cover object-top sm:h-52"
          />
        </motion.div>

        <p className="font-carta text-tinta text-2xl italic sm:text-[27px]">
          {ELLA.apodo},
        </p>

        <div className="font-carta text-tinta mt-5 space-y-5 text-[17px] leading-[1.75] sm:text-[19px]">
          {CARTA.map((texto, i) => (
            <motion.p
              key={i}
              variants={parrafo}
              initial="oculto"
              animate="visible"
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.18,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {texto}
            </motion.p>
          ))}

          <motion.p
            variants={parrafo}
            initial="oculto"
            animate="visible"
            transition={{
              duration: 0.6,
              delay: 0.3 + CARTA.length * 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {CIERRE}
          </motion.p>
        </div>

        <p className="font-carta text-tinta mt-8 text-right text-2xl italic">
          {FIRMA}
        </p>

        <div className="border-humo/25 mt-10 border-t pt-7">
          <p className="text-humo text-center text-[13px]">
            {numeroDeCumplemes === 1
              ? "Llevamos juntos"
              : `Cumplemes ${numeroDeCumplemes}. Llevamos juntos`}
          </p>
          <div className="mt-3">
            <Contador tiempo={tiempo} />
          </div>
        </div>
      </motion.article>

      <motion.button
        type="button"
        onClick={onContinuar}
        initial={reducirMovimiento ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.4 + CARTA.length * 0.18,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="bg-rosa-honda text-papel mt-10 cursor-pointer rounded-full px-9 py-4 text-[15px] font-semibold shadow-[0_16px_30px_-14px_rgba(152,42,70,0.85)] transition-transform active:scale-[0.98]"
      >
        {puedeGirar ? "Girar la ruleta" : "Ver mi cita de este mes"}
      </motion.button>
    </section>
  );
}
