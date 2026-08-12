"use client";

import { useEffect, useState } from "react";

/**
 * El reloj de la app. Devuelve `null` hasta que el componente monta, para que
 * el servidor y el cliente no rendericen horas distintas.
 *
 * En desarrollo acepta `?fecha=2026-09-12` para simular meses futuros y poder
 * comprobar el desbloqueo sin esperar. En producción el parámetro se ignora.
 */
export function useAhora(): Date | null {
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    const desfase = calcularDesfase();

    const marcar = () => setAhora(new Date(Date.now() + desfase));
    marcar();

    const id = window.setInterval(marcar, 1000);
    return () => window.clearInterval(id);
  }, []);

  return ahora;
}

/**
 * Atajos de desarrollo para poder mirar cada pantalla sin tener que jugar la
 * secuencia entera: `?etapa=ruleta`, `?etapa=premio&cita=ruta-del-postre`.
 * En producción siempre devuelve null, así que ella nunca puede saltárselas.
 */
export function parametroDeDesarrollo(nombre: string): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get(nombre);
}

function calcularDesfase(): number {
  if (process.env.NODE_ENV === "production") return 0;

  const parametro = new URLSearchParams(window.location.search).get("fecha");
  if (!parametro) return 0;

  const simulada = interpretarFechaLocal(parametro);
  if (!simulada) return 0;

  return simulada.getTime() - Date.now();
}

/**
 * "2026-09-12" se interpreta en hora local, no en UTC. `new Date(cadena)` lo
 * leería como UTC y correría la fecha un día en husos negativos, que es
 * exactamente el error que este simulador tiene que ayudar a detectar.
 */
function interpretarFechaLocal(cadena: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cadena);

  if (partes) {
    return new Date(
      Number(partes[1]),
      Number(partes[2]) - 1,
      Number(partes[3]),
      12,
      0,
      0,
    );
  }

  const libre = new Date(cadena);
  return Number.isNaN(libre.getTime()) ? null : libre;
}
