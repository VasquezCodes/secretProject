/**
 * Fechas del cumplemes. Funciones puras: ninguna llama a `new Date()` por
 * dentro, siempre reciben `ahora`. Eso las hace testeables y permite simular
 * meses futuros en desarrollo.
 *
 * Todo se calcula en hora local del dispositivo, no en UTC.
 */

export type TiempoJuntos = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

function dosDigitos(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Identificador del ciclo vigente, con formato "AAAA-MM".
 *
 * El ciclo del mes M arranca el día `dia` de M y termina el día `dia - 1` de
 * M+1. Ejemplo con dia = 12: el 5 de septiembre pertenece al ciclo "2026-08";
 * el 12 de septiembre ya pertenece a "2026-09".
 */
export function idDeCiclo(ahora: Date, dia: number): string {
  let anio = ahora.getFullYear();
  let mes = ahora.getMonth(); // 0-11

  if (ahora.getDate() < dia) {
    mes -= 1;
    if (mes < 0) {
      mes = 11;
      anio -= 1;
    }
  }

  return `${anio}-${dosDigitos(mes + 1)}`;
}

/**
 * Cuántos cumplemes se han cumplido. Devuelve 0 antes del primero.
 *
 * Se cuenta por calendario, no por días transcurridos: del 12 de julio al 12
 * de agosto es 1, sin importar que agosto tenga 31 días.
 */
export function numeroDeCumplemes(inicio: Date, ahora: Date): number {
  const meses =
    (ahora.getFullYear() - inicio.getFullYear()) * 12 +
    (ahora.getMonth() - inicio.getMonth());

  // Si todavía no llegó el día del mes, el último cumplemes no cuenta.
  const ajuste = ahora.getDate() < inicio.getDate() ? 1 : 0;

  return Math.max(0, meses - ajuste);
}

/** El próximo día `dia` a las 00:00 en hora local. */
export function proximoCumplemes(ahora: Date, dia: number): Date {
  const anio = ahora.getFullYear();
  const mes = ahora.getMonth();

  if (ahora.getDate() < dia) {
    return new Date(anio, mes, dia, 0, 0, 0, 0);
  }

  return new Date(anio, mes + 1, dia, 0, 0, 0, 0);
}

/** Desglose del tiempo transcurrido desde que empezaron. */
export function tiempoJuntos(inicio: Date, ahora: Date): TiempoJuntos {
  const ms = Math.max(0, ahora.getTime() - inicio.getTime());
  const totalSegundos = Math.floor(ms / 1000);

  return {
    dias: Math.floor(totalSegundos / 86400),
    horas: Math.floor(totalSegundos / 3600) % 24,
    minutos: Math.floor(totalSegundos / 60) % 60,
    segundos: totalSegundos % 60,
  };
}

/** Cuenta regresiva hasta una fecha, para mostrar cuánto falta para girar. */
export function faltaPara(objetivo: Date, ahora: Date): TiempoJuntos {
  return tiempoJuntos(ahora, objetivo);
}
