/**
 * Sorteo de citas. Funciones puras.
 *
 * El azar es puro y uniforme sobre TODAS las citas: una cita ya descubierta
 * puede volver a salir. Lo que compensa la repetición es la re-tirada, que
 * vive en el componente de la ruleta, no acá.
 *
 * La fuente de aleatoriedad se inyecta para poder testear el sorteo.
 */

import type { Cita } from "../contenido";

/** Solo lo que el sorteo necesita saber del historial. */
type GiroPrevio = { citaId: string };

export type Aleatorio = () => number;

/** Elige una cita al azar, uniforme sobre todo el pool. */
export function sortear(
  citas: readonly Cita[],
  aleatorio: Aleatorio = Math.random,
): Cita {
  if (citas.length === 0) {
    throw new Error("No hay citas para sortear. Revisa CITAS en contenido.ts.");
  }

  const indice = Math.min(
    citas.length - 1,
    Math.floor(aleatorio() * citas.length),
  );

  return citas[indice];
}

/** Si esta cita ya salió en algún ciclo anterior. */
export function yaSalio(
  historial: readonly GiroPrevio[],
  citaId: string,
): boolean {
  return historial.some((giro) => giro.citaId === citaId);
}

/**
 * Cuántas citas no ha descubierto todavía.
 *
 * El pool crece 2 por mes y se consume 1, así que este número sube con el
 * tiempo en vez de bajar. Nunca llega a cero.
 */
export function citasNoDescubiertas(
  historial: readonly GiroPrevio[],
  citas: readonly Cita[],
): number {
  const descubiertas = new Set(historial.map((giro) => giro.citaId));
  return citas.filter((cita) => !descubiertas.has(cita.id)).length;
}

/** Busca una cita por id. Devuelve undefined si se borró de contenido.ts. */
export function citaPorId(
  citas: readonly Cita[],
  citaId: string,
): Cita | undefined {
  return citas.find((cita) => cita.id === citaId);
}
