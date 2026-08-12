"use client";

import confetti from "canvas-confetti";
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Cita } from "../contenido";
import { IconoCita } from "../iconos";
import { sortear, yaSalio } from "../lib/premios";
import {
  CENTRO,
  RADIO,
  RADIO_BOMBILLAS,
  RADIO_CLAVIJAS,
  anguloDeGajo,
  centroDeGajo,
  pathDeGajo,
  punto,
  rotacionGanadora,
  tamanoDeIncognita,
  tonoDeGajo,
} from "../lib/rueda";
import { crearSonidos, type Sonidos } from "../lib/sonido";
import { FondoNoche } from "./FondoNoche";

const DURACION_GIRO = 6.2;
const BOMBILLAS = 28;

type Fase = "lista" | "girando" | "repetida" | "confirmada";

/** Parte el título en dos líneas para que entre en el gajo. */
function dividirTitulo(titulo: string): string[] {
  const palabras = titulo.split(" ");
  if (palabras.length === 1) return palabras;

  const mitad = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, mitad).join(" "), palabras.slice(mitad).join(" ")];
}

export function Ruleta({
  citas,
  historial,
  onConfirmado,
  onVolver,
}: {
  citas: readonly Cita[];
  historial: readonly { citaId: string }[];
  onConfirmado: (cita: Cita) => void;
  onVolver: () => void;
}) {
  const reducirMovimiento = useReducedMotion();

  const [fase, setFase] = useState<Fase>("lista");
  const [resultado, setResultado] = useState<Cita | null>(null);
  const [indiceGanador, setIndiceGanador] = useState<number | null>(null);
  const [retiradaUsada, setRetiradaUsada] = useState(false);
  const [silenciado, setSilenciado] = useState(false);

  const rotacion = useMotionValue(0);
  const lengueta = useMotionValue(0);

  const sonidosRef = useRef<Sonidos | null>(null);
  const ultimaClavija = useRef(0);
  const silenciadoRef = useRef(silenciado);

  // El manejador de clavijas corre fuera del ciclo de render, así que lee el
  // estado por referencia en vez de por closure.
  useEffect(() => {
    silenciadoRef.current = silenciado;

    // Silenciar a media vuelta también corta la musiquita, no solo los clacs.
    if (silenciado) {
      sonidosRef.current?.detenerGiro();
    }
  }, [silenciado]);

  const total = citas.length;
  const paso = anguloDeGajo(total);

  useEffect(() => {
    return () => {
      sonidosRef.current?.cerrar();
      sonidosRef.current = null;
    };
  }, []);

  // Cada vez que una clavija pasa bajo la lengüeta: golpe y sonido.
  useMotionValueEvent(rotacion, "change", (valor) => {
    const clavija = Math.floor(valor / paso);
    if (clavija === ultimaClavija.current) return;

    ultimaClavija.current = clavija;

    if (!silenciadoRef.current) {
      sonidosRef.current?.clac();
    }

    lengueta.set(-22);
    animate(lengueta, 0, {
      type: "spring",
      stiffness: 700,
      damping: 18,
      mass: 0.4,
    });
  });

  const confirmar = useCallback(
    (cita: Cita) => {
      setFase("confirmada");

      if (!silenciadoRef.current) {
        sonidosRef.current?.fanfarria();
      }

      confetti({
        particleCount: 110,
        spread: 78,
        startVelocity: 38,
        origin: { y: 0.42 },
        colors: ["#c4415f", "#e8778f", "#f5e7e0", "#982a46"],
        disableForReducedMotion: true,
      });

      window.setTimeout(() => onConfirmado(cita), 1250);
    },
    [onConfirmado],
  );

  const aterrizar = useCallback(
    (cita: Cita) => {
      sonidosRef.current?.detenerGiro();
      setResultado(cita);

      const repetida = yaSalio(historial, cita.id);

      if (repetida && !retiradaUsada) {
        setFase("repetida");
        return;
      }

      confirmar(cita);
    },
    [confirmar, historial, retiradaUsada],
  );

  const girar = useCallback(async () => {
    if (fase === "girando") return;

    // El contexto de audio necesita nacer dentro de un gesto del usuario.
    if (!sonidosRef.current && !silenciadoRef.current) {
      sonidosRef.current = crearSonidos();
    }

    if (!silenciadoRef.current) {
      sonidosRef.current?.iniciarGiro();
    }

    setFase("girando");
    setResultado(null);
    setIndiceGanador(null);

    const cita = sortear(citas);
    const indice = citas.indexOf(cita);

    const vueltas = 5 + Math.floor(Math.random() * 3);
    const desvio = Math.random() * 2 - 1;
    const destino = rotacionGanadora(
      indice,
      total,
      rotacion.get(),
      vueltas,
      desvio,
    );

    setIndiceGanador(indice);

    if (reducirMovimiento) {
      rotacion.set(destino);
      ultimaClavija.current = Math.floor(destino / paso);
      aterrizar(cita);
      return;
    }

    await animate(rotacion, destino, {
      duration: DURACION_GIRO,
      ease: [0.16, 1, 0.3, 1],
    });

    aterrizar(cita);
  }, [aterrizar, citas, fase, paso, reducirMovimiento, rotacion, total]);

  function volverATirar() {
    setRetiradaUsada(true);
    setFase("lista");
    setResultado(null);
    setIndiceGanador(null);
    void girar();
  }

  const girando = fase === "girando";

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12">
      <FondoNoche foto="/fotos/mesa-nachos.jpg" prioridad />

      {/* Una vez que la rueda arranca no hay vuelta atrás: el giro del mes ya
          se está jugando y salirse ahora dejaría el resultado a medias. */}
      <button
        type="button"
        onClick={onVolver}
        disabled={fase !== "lista"}
        className="text-papel/60 hover:text-papel absolute left-4 top-5 z-10 flex cursor-pointer items-center gap-1 rounded-full py-2 pl-2 pr-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-0"
      >
        <ArrowLeft size={18} />
        Volver
      </button>

      <button
        type="button"
        onClick={() => setSilenciado((previo) => !previo)}
        aria-label={silenciado ? "Activar sonido" : "Silenciar"}
        className="text-papel/60 hover:text-papel absolute right-5 top-5 z-10 cursor-pointer rounded-full p-2 transition-colors"
      >
        {silenciado ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <div className="relative flex flex-col items-center">
        <h2 className="text-papel text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {fase === "repetida" ? "Esa ya la tenías" : "Tu cita de este mes"}
        </h2>
        <p className="text-papel/65 mt-2 h-5 text-center text-sm">
          {fase === "repetida"
            ? "Te queda una tirada más. Lo que salga, va."
            : girando
              ? "A ver dónde para"
              : "Ninguna se deja ver hasta que para"}
        </p>

        <div className="relative mt-8 aspect-square w-[min(86vw,25rem)]">
          {/* Aro de bombillas. No gira: es el marco, no la rueda. */}
          <svg viewBox="0 0 420 420" className="absolute inset-0 h-full w-full">
            <circle
              cx={CENTRO}
              cy={CENTRO}
              r={RADIO_BOMBILLAS}
              fill="none"
              stroke="var(--color-rosa-honda)"
              strokeWidth={13}
              opacity={0.45}
            />
            {Array.from({ length: BOMBILLAS }, (_, i) => {
              const posicion = punto(RADIO_BOMBILLAS, (i * 360) / BOMBILLAS);
              return (
                <circle
                  key={i}
                  cx={posicion.x}
                  cy={posicion.y}
                  r={3.4}
                  fill="var(--color-rosa)"
                  style={{
                    opacity: girando ? undefined : 0.5,
                    animation: girando
                      ? `bombilla-corre 0.7s linear ${(i / BOMBILLAS) * 0.7}s infinite`
                      : undefined,
                  }}
                />
              );
            })}
          </svg>

          {/* La rueda */}
          <motion.div style={{ rotate: rotacion }} className="absolute inset-0">
            <svg viewBox="0 0 420 420" className="h-full w-full">
              <circle
                cx={CENTRO}
                cy={CENTRO}
                r={RADIO + 9}
                fill="var(--color-rosa-honda)"
              />

              {citas.map((cita, i) => {
                const angulo = centroDeGajo(i, total);
                const invertir = angulo > 90 && angulo < 270;
                // Ninguna cita se deja ver hasta que la rueda para en ella.
                const revelada = indiceGanador === i && fase !== "girando";
                const lineas = dividirTitulo(cita.titulo);

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
                        revelada
                          ? "var(--color-rosa-clara)"
                          : "var(--color-rosa-honda)"
                      }
                      strokeWidth={revelada ? 3 : 1.5}
                    />

                    <g
                      transform={`rotate(${angulo} ${CENTRO} ${CENTRO}) translate(${CENTRO} ${CENTRO - RADIO * 0.62}) ${invertir ? "rotate(180)" : ""}`}
                      style={{ color: "var(--color-papel)" }}
                    >
                      {revelada ? (
                        <>
                          <g transform="translate(-11 -30)">
                            <IconoCita
                              clave={cita.icono}
                              width={22}
                              height={22}
                              strokeWidth={1.75}
                              stroke="currentColor"
                              fill="none"
                            />
                          </g>

                          {lineas.map((linea, l) => (
                            <text
                              key={l}
                              x={0}
                              y={l * 13}
                              textAnchor="middle"
                              fill="currentColor"
                              fontSize={11.5}
                              fontWeight={600}
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {linea}
                            </text>
                          ))}
                        </>
                      ) : (
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="currentColor"
                          fillOpacity={0.92}
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

              {/* Clavijas: lo que golpea la lengüeta */}
              {Array.from({ length: total }, (_, i) => {
                const posicion = punto(RADIO_CLAVIJAS, i * paso);
                return (
                  <circle
                    key={i}
                    cx={posicion.x}
                    cy={posicion.y}
                    r={4.6}
                    fill="var(--color-papel)"
                    stroke="var(--color-rosa-honda)"
                    strokeWidth={1.4}
                  />
                );
              })}

              <circle
                cx={CENTRO}
                cy={CENTRO}
                r={22}
                fill="var(--color-rosa)"
                stroke="var(--color-rosa-honda)"
                strokeWidth={3}
              />
            </svg>
          </motion.div>

          {/* Lengüeta. Vive fuera de la rueda para no girar con ella. */}
          <motion.div
            style={{ rotate: lengueta, transformOrigin: "50% 12%" }}
            className="pointer-events-none absolute inset-0"
          >
            <svg viewBox="0 0 420 420" className="h-full w-full">
              <path
                d="M 210 22 L 199 46 Q 210 60 221 46 Z"
                fill="var(--color-papel)"
                stroke="var(--color-rosa-honda)"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <circle
                cx={210}
                cy={24}
                r={6.5}
                fill="var(--color-rosa)"
                stroke="var(--color-rosa-honda)"
                strokeWidth={2}
              />
            </svg>
          </motion.div>
        </div>

        <div className="mt-9 flex min-h-26 flex-col items-center">
          {fase === "repetida" && resultado ? (
            <>
              <p className="text-papel/85 max-w-xs text-center text-[15px]">
                Salió <span className="text-rosa-clara font-semibold">{resultado.titulo}</span>,
                y esa ya te había tocado.
              </p>
              <button
                type="button"
                onClick={volverATirar}
                className="bg-rosa-honda text-papel mt-5 flex cursor-pointer items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold shadow-[0_16px_30px_-14px_rgba(152,42,70,0.85)] transition-transform active:scale-[0.98]"
              >
                <RotateCcw size={17} strokeWidth={2.4} />
                Tirar otra vez
              </button>
            </>
          ) : fase === "confirmada" && resultado ? (
            <p className="text-rosa-clara text-center text-xl font-semibold">
              {resultado.titulo}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void girar()}
              disabled={girando}
              className="bg-rosa-honda text-papel cursor-pointer rounded-full px-10 py-4 text-[15px] font-semibold shadow-[0_16px_30px_-14px_rgba(152,42,70,0.85)] transition-transform active:scale-[0.98] disabled:cursor-default disabled:opacity-55"
            >
              {girando ? "Girando" : "Girar"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
