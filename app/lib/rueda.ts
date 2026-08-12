/**
 * Geometría de la rueda. Puro cálculo, sin React ni DOM.
 *
 * Convención de ángulos: grados medidos desde las 12 en punto, en sentido
 * horario. `punto()` traduce eso a coordenadas SVG, donde 0 grados apunta a
 * la derecha, restando 90.
 */

export const CENTRO = 210;
export const RADIO = 165;
/** Las clavijas van montadas sobre el aro, justo en el borde de los gajos. */
export const RADIO_CLAVIJAS = RADIO + 5;
/** El aro de bombillas rodea la rueda por fuera, sin tocarla. */
export const RADIO_BOMBILLAS = 190;

export type Punto = { x: number; y: number };

export function punto(radio: number, gradosDesdeArriba: number): Punto {
  const rad = ((gradosDesdeArriba - 90) * Math.PI) / 180;
  return {
    x: CENTRO + radio * Math.cos(rad),
    y: CENTRO + radio * Math.sin(rad),
  };
}

export function anguloDeGajo(total: number): number {
  return 360 / total;
}

/** Path SVG de un gajo, como porción de tarta desde el centro. */
export function pathDeGajo(indice: number, total: number): string {
  const paso = anguloDeGajo(total);

  // Una sola cita: la rueda es un círculo completo, y un arco de 360 grados
  // no se puede dibujar con un solo comando A.
  if (total === 1) {
    const arriba = punto(RADIO, 0);
    const abajo = punto(RADIO, 180);
    return [
      `M ${arriba.x} ${arriba.y}`,
      `A ${RADIO} ${RADIO} 0 1 1 ${abajo.x} ${abajo.y}`,
      `A ${RADIO} ${RADIO} 0 1 1 ${arriba.x} ${arriba.y}`,
      "Z",
    ].join(" ");
  }

  const inicio = punto(RADIO, indice * paso);
  const fin = punto(RADIO, (indice + 1) * paso);
  const arcoLargo = paso > 180 ? 1 : 0;

  return [
    `M ${CENTRO} ${CENTRO}`,
    `L ${inicio.x} ${inicio.y}`,
    `A ${RADIO} ${RADIO} 0 ${arcoLargo} 1 ${fin.x} ${fin.y}`,
    "Z",
  ].join(" ");
}

/** El ángulo del centro de un gajo, desde las 12 en punto. */
export function centroDeGajo(indice: number, total: number): number {
  return (indice + 0.5) * anguloDeGajo(total);
}

const TONOS = ["a", "b", "c"] as const;
export type Tono = (typeof TONOS)[number];

/**
 * Cicla tres tonos por los gajos y corrige la costura: sin este ajuste, con
 * ciertos totales el último gajo queda del mismo color que el primero.
 */
export function tonoDeGajo(indice: number, total: number): Tono {
  let tono = indice % TONOS.length;

  if (indice === total - 1 && total > 1 && tono === 0) {
    tono = 1;
  }

  return TONOS[tono];
}

/**
 * Los gajos no dicen qué cita son: muestran un signo de interrogación hasta
 * que la rueda para. Eso sostiene el suspenso y, de paso, resuelve solo el
 * problema de que el pool crece 2 citas por mes: una incógnita siempre entra
 * en el gajo, por angosto que sea. Solo hay que achicarla.
 */
export function tamanoDeIncognita(total: number): number {
  if (total <= 6) return 42;
  if (total <= 10) return 32;
  if (total <= 16) return 24;
  return 17;
}

/**
 * Rotación final para que el gajo ganador quede bajo la lengüeta de las 12.
 *
 * El premio se sortea ANTES de animar y la rueda se lleva hasta él. Nunca se
 * deduce el premio de dónde quedó la rueda, así que la animación y la tarjeta
 * no se pueden desincronizar.
 */
export function rotacionGanadora(
  indice: number,
  total: number,
  rotacionActual: number,
  vueltas: number,
  desvio: number,
): number {
  const paso = anguloDeGajo(total);

  // Desvía dentro del gajo para que no caiga siempre clavado en el centro.
  const objetivoLocal = centroDeGajo(indice, total) + desvio * paso * 0.35;
  const alineado = (360 - (objetivoLocal % 360) + 360) % 360;

  const vueltasCompletas = Math.ceil(rotacionActual / 360) * 360;
  let destino = vueltasCompletas + vueltas * 360 + alineado;

  while (destino <= rotacionActual + 360) {
    destino += 360;
  }

  return destino;
}
