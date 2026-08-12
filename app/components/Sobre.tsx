"use client";

import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { ELLA, FOTOS } from "../contenido";
import { FondoNoche } from "./FondoNoche";

/**
 * Primera pantalla: un sobre cerrado sobre la mesa. Ella lo toca y se abre.
 *
 * No lee fechas ni almacenamiento, así que se puede renderizar en el servidor
 * sin riesgo de desajuste de hidratación.
 */
export function Sobre({ onAbrir }: { onAbrir: () => void }) {
  const [abriendo, setAbriendo] = useState(false);
  const reducirMovimiento = useReducedMotion();

  function abrir() {
    if (abriendo) return;
    setAbriendo(true);

    if (reducirMovimiento) {
      onAbrir();
      return;
    }

    window.setTimeout(onAbrir, 900);
  }

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <FondoNoche foto={FOTOS.mesas[0]} prioridad />

      <motion.div
        initial={reducirMovimiento ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <p className="font-carta text-rosa-clara/85 text-lg italic">Para ti,</p>
        <h1 className="text-papel mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
          {ELLA.apodo}
        </h1>

        <button
          type="button"
          onClick={abrir}
          aria-label="Abrir el sobre"
          className="group mt-12 cursor-pointer [perspective:1100px]"
        >
          <div className="relative h-[172px] w-[268px] transition-transform duration-500 group-active:scale-[0.98] sm:h-[196px] sm:w-[306px]">
            {/* Cuerpo del sobre */}
            <div className="bg-papel shadow-[0_28px_60px_-20px_rgba(0,0,0,0.75)] absolute inset-0 rounded-[10px]" />

            {/* La carta asomando, una vez abierta la solapa */}
            <motion.div
              initial={false}
              animate={
                abriendo && !reducirMovimiento
                  ? { y: -46, opacity: 1 }
                  : { y: 0, opacity: 0 }
              }
              transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-papel-alto absolute inset-x-4 top-3 h-[78%] rounded-[8px] shadow-lg"
            />

            {/* Solapa: gira hacia atrás sobre su borde superior */}
            <motion.div
              initial={false}
              animate={{ rotateX: abriendo && !reducirMovimiento ? -172 : 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                transformOrigin: "top center",
                transformStyle: "preserve-3d",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                // La sombra sigue el recorte, así que dibuja la V del sobre.
                filter: "drop-shadow(0 3px 5px rgba(42,30,26,0.30))",
              }}
              className="bg-papel-alto absolute inset-x-0 top-0 h-[62%] rounded-t-[10px]"
            />

            {/* Sello */}
            <motion.div
              initial={false}
              animate={{
                opacity: abriendo ? 0 : 1,
                scale: abriendo ? 0.6 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="bg-rosa absolute left-1/2 top-[52%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-md"
            >
              <Heart size={19} strokeWidth={2.2} className="text-papel" fill="currentColor" />
            </motion.div>
          </div>
        </button>

        <motion.p
          animate={{ opacity: abriendo ? 0 : [0.45, 0.9, 0.45] }}
          transition={
            abriendo
              ? { duration: 0.3 }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
          }
          className="text-papel/70 mt-10 text-sm"
        >
          Tócalo para abrirlo
        </motion.p>
      </motion.div>
    </section>
  );
}
