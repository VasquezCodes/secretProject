"use client";

import { motion, useReducedMotion } from "motion/react";

import type { Cita } from "../contenido";
import { IconoCita } from "../iconos";
import {
  CENTRO,
  RADIO,
  centroDeGajo,
  pathDeGajo,
  tamanoDeIncognita,
  tonoDeGajo,
} from "../lib/rueda";

/**
 * La rueda en pequeño, para el hub. Usa la misma geometría que la de verdad
 * (`lib/rueda.ts`), así que si cambia el número de citas las dos se mueven
 * juntas sin tener que acordarse de nada.
 *
 * Gira despacio solo cuando hay un giro esperando. Eso no es decoración: es
 * la señal de que le toca. Si ya giró, se queda quieta con su gajo encendido.
 */
export function RuedaMini({
  citas,
  indiceGanador,
  esperando,
}: {
  citas: readonly Cita[];
  indiceGanador: number | null;
  esperando: boolean;
}) {
  const reducirMovimiento = useReducedMotion();
  const total = citas.length;

  // Deja el gajo ganador arriba, bajo la lengüeta, como quedó al parar.
  const reposo =
    indiceGanador === null ? 0 : 360 - (centroDeGajo(indiceGanador, total) % 360);

  return (
    <div className="relative aspect-square w-full">
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: reposo }}
        animate={esperando && !reducirMovimiento ? { rotate: reposo + 360 } : { rotate: reposo }}
        transition={
          esperando && !reducirMovimiento
            ? { duration: 26, repeat: Infinity, ease: "linear" }
            : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <svg viewBox="0 0 420 420" className="h-full w-full">
          <circle
            cx={CENTRO}
            cy={CENTRO}
            r={RADIO + 12}
            fill="var(--color-rosa-honda)"
          />

          {citas.map((cita, i) => {
            const revelada = indiceGanador === i;
            const angulo = centroDeGajo(i, total);
            // Al ganador nunca: la rueda lo deja aparcado arriba, derecho.
            const invertir = !revelada && angulo > 90 && angulo < 270;

            return (
              <g key={cita.id}>
                <path
                  d={pathDeGajo(i, total)}
                  fill={
                    revelada
                      ? "var(--color-rosa-honda)"
                      : `var(--color-gajo-${tonoDeGajo(i, total)})`
                  }
                  stroke={
                    revelada ? "var(--color-rosa-clara)" : "var(--color-rosa-honda)"
                  }
                  strokeWidth={revelada ? 5 : 2}
                />

                <g
                  transform={`rotate(${angulo} ${CENTRO} ${CENTRO}) translate(${CENTRO} ${CENTRO - RADIO * 0.6}) ${invertir ? "rotate(180)" : ""}`}
                  style={{ color: "var(--color-papel)" }}
                >
                  {revelada ? (
                    // Ya sabe cuál le tocó: no tiene sentido seguir tapándola.
                    <g transform="translate(-14 -14)">
                      <IconoCita
                        clave={cita.icono}
                        width={28}
                        height={28}
                        strokeWidth={1.9}
                        stroke="currentColor"
                        fill="none"
                      />
                    </g>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="currentColor"
                      fillOpacity={0.75}
                      fontSize={tamanoDeIncognita(total)}
                      fontWeight={700}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ?
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          <circle
            cx={CENTRO}
            cy={CENTRO}
            r={26}
            fill="var(--color-rosa)"
            stroke="var(--color-rosa-honda)"
            strokeWidth={4}
          />
        </svg>
      </motion.div>

      {/* La lengüeta no gira con la rueda, igual que en la de verdad. */}
      <svg
        viewBox="0 0 420 420"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <path
          d="M 210 6 L 197 34 Q 210 50 223 34 Z"
          fill="var(--color-papel)"
          stroke="var(--color-rosa-honda)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
