/**
 * Persistencia en localStorage.
 *
 * Regla de robustez: esto nunca lanza hacia la UI. Si el navegador bloquea
 * localStorage (modo incógnito, permisos) se cae a un almacén en memoria y la
 * app sigue funcionando, solo que sin persistir. Si el dato guardado está
 * corrupto, se descarta y se arranca limpio.
 *
 * En el peor caso ella puede girar de más. Eso es preferible a que vea una
 * pantalla de error el día de su cumplemes.
 */

const CLAVE = "cumplemes:v1";

export type Giro = {
  /** Id del ciclo, formato "AAAA-MM". Uno solo por ciclo. */
  ciclo: string;
  citaId: string;
  fechaISO: string;
};

export type Estado = {
  version: 1;
  giros: Giro[];
};

export const ESTADO_VACIO: Estado = { version: 1, giros: [] };

/** Respaldo para cuando localStorage no está disponible. */
let enMemoria: Estado = ESTADO_VACIO;

function almacenDisponible(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const prueba = "__cumplemes_prueba__";
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return window.localStorage;
  } catch {
    return null;
  }
}

function esEstadoValido(valor: unknown): valor is Estado {
  if (typeof valor !== "object" || valor === null) return false;

  const posible = valor as Partial<Estado>;
  if (posible.version !== 1) return false;
  if (!Array.isArray(posible.giros)) return false;

  return posible.giros.every(
    (giro) =>
      typeof giro === "object" &&
      giro !== null &&
      typeof giro.ciclo === "string" &&
      typeof giro.citaId === "string" &&
      typeof giro.fechaISO === "string",
  );
}

export function leer(): Estado {
  const almacen = almacenDisponible();
  if (!almacen) return enMemoria;

  try {
    const crudo = almacen.getItem(CLAVE);
    if (!crudo) return ESTADO_VACIO;

    const parseado: unknown = JSON.parse(crudo);
    if (!esEstadoValido(parseado)) {
      // Dato corrupto o de una versión que no entendemos: empezar limpio.
      almacen.removeItem(CLAVE);
      return ESTADO_VACIO;
    }

    return parseado;
  } catch {
    return ESTADO_VACIO;
  }
}

export function guardar(estado: Estado): void {
  enMemoria = estado;
  cache = estado;

  const almacen = almacenDisponible();

  if (almacen) {
    try {
      almacen.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      // Cuota llena o escritura bloqueada. El estado en memoria ya se actualizó.
    }
  }

  notificar();
}

/*
 * localStorage es un almacén externo a React, así que se expone como tal con
 * `useSyncExternalStore` en vez de copiarlo a estado con un efecto. Eso evita
 * el render en cascada al montar y, de paso, sincroniza entre pestañas.
 */

let cache: Estado | null = null;
const oyentes = new Set<() => void>();

function notificar(): void {
  for (const oyente of oyentes) oyente();
}

/** La instantánea del cliente. Tiene que devolver siempre la misma
 * referencia mientras nada cambie, o `useSyncExternalStore` no para de
 * re-renderizar. */
export function instantanea(): Estado {
  if (cache === null) {
    cache = leer();
  }
  return cache;
}

/** En el servidor todavía no hay historial que mostrar. */
export function instantaneaServidor(): Estado {
  return ESTADO_VACIO;
}

export function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);

  // Si ella tiene la página abierta en dos pestañas, que no se contradigan.
  const alCambiarOtraPestana = (evento: StorageEvent) => {
    if (evento.key !== CLAVE) return;
    cache = leer();
    notificar();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", alCambiarOtraPestana);
  }

  return () => {
    oyentes.delete(oyente);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", alCambiarOtraPestana);
    }
  };
}

/** Registra el giro del ciclo. Si el ciclo ya tenía giro, no lo pisa. */
export function registrarGiro(estado: Estado, giro: Giro): Estado {
  if (estado.giros.some((previo) => previo.ciclo === giro.ciclo)) {
    return estado;
  }

  return { ...estado, giros: [...estado.giros, giro] };
}

/** El giro de un ciclo concreto, si ya se jugó. */
export function giroDelCiclo(estado: Estado, ciclo: string): Giro | undefined {
  return estado.giros.find((giro) => giro.ciclo === ciclo);
}

/** Solo para tests: limpia el respaldo en memoria y la instantánea. */
export function reiniciarMemoria(): void {
  enMemoria = ESTADO_VACIO;
  cache = null;
  oyentes.clear();
}
