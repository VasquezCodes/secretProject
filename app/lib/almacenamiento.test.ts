import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ESTADO_VACIO,
  giroDelCiclo,
  guardar,
  guardarGiro,
  leer,
  puedeGirarEnCiclo,
  reiniciarMemoria,
  type Estado,
} from "./almacenamiento";

const CLAVE = "cumplemes:v1";

/** localStorage de mentira, con un interruptor para simular que falla. */
function almacenFalso(opciones: { rompeAlEscribir?: boolean } = {}) {
  const datos = new Map<string, string>();

  return {
    datos,
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      if (opciones.rompeAlEscribir) throw new Error("cuota llena");
      datos.set(clave, valor);
    },
    removeItem: (clave: string) => {
      datos.delete(clave);
    },
  };
}

function montarVentana(localStorage: unknown) {
  (globalThis as { window?: unknown }).window = { localStorage };
}

function desmontarVentana() {
  delete (globalThis as { window?: unknown }).window;
}

beforeEach(() => {
  reiniciarMemoria();
});

afterEach(() => {
  desmontarVentana();
});

describe("sin localStorage disponible", () => {
  it("leer devuelve el estado vacío en vez de lanzar", () => {
    desmontarVentana();
    expect(leer()).toEqual(ESTADO_VACIO);
  });

  it("guardar y leer siguen funcionando en memoria", () => {
    desmontarVentana();

    const estado: Estado = {
      version: 1,
      giros: [
        {
          ciclo: "2026-08",
          citaId: "ruta-del-postre",
          fechaISO: "2026-08-12",
          retiradaUsada: false,
        },
      ],
    };
    guardar(estado);

    expect(leer()).toEqual(estado);
  });

  it("cae a memoria cuando el navegador bloquea el acceso", () => {
    montarVentana({
      get getItem(): never {
        throw new Error("acceso denegado");
      },
      setItem: () => {
        throw new Error("acceso denegado");
      },
      removeItem: () => {},
    });

    expect(() => leer()).not.toThrow();
    expect(leer()).toEqual(ESTADO_VACIO);
  });
});

describe("con localStorage", () => {
  it("hace ida y vuelta del estado", () => {
    montarVentana(almacenFalso());

    const estado: Estado = {
      version: 1,
      giros: [
        {
          ciclo: "2026-08",
          citaId: "arcades-retro",
          fechaISO: "2026-08-12",
          retiradaUsada: false,
        },
      ],
    };
    guardar(estado);

    expect(leer()).toEqual(estado);
  });

  it("devuelve el estado vacío la primera vez", () => {
    montarVentana(almacenFalso());
    expect(leer()).toEqual(ESTADO_VACIO);
  });

  it("descarta JSON corrupto y arranca limpio", () => {
    const almacen = almacenFalso();
    almacen.datos.set(CLAVE, "{esto no es json");
    montarVentana(almacen);

    expect(leer()).toEqual(ESTADO_VACIO);
  });

  it("descarta un estado con forma inesperada y borra la clave", () => {
    const almacen = almacenFalso();
    almacen.datos.set(CLAVE, JSON.stringify({ version: 1, giros: "nope" }));
    montarVentana(almacen);

    expect(leer()).toEqual(ESTADO_VACIO);
    expect(almacen.datos.has(CLAVE)).toBe(false);
  });

  it("descarta un estado de otra versión", () => {
    const almacen = almacenFalso();
    almacen.datos.set(CLAVE, JSON.stringify({ version: 99, giros: [] }));
    montarVentana(almacen);

    expect(leer()).toEqual(ESTADO_VACIO);
  });

  it("descarta giros con campos que no son strings", () => {
    const almacen = almacenFalso();
    almacen.datos.set(
      CLAVE,
      JSON.stringify({ version: 1, giros: [{ ciclo: 8, citaId: null }] }),
    );
    montarVentana(almacen);

    expect(leer()).toEqual(ESTADO_VACIO);
  });

  it("no lanza si la escritura falla por cuota", () => {
    montarVentana(almacenFalso({ rompeAlEscribir: true }));
    expect(() => guardar(ESTADO_VACIO)).not.toThrow();
  });
});

describe("guardarGiro", () => {
  const giro = {
    ciclo: "2026-08",
    citaId: "cena-sorpresa",
    fechaISO: "2026-08-12T20:00:00.000Z",
    retiradaUsada: false,
  };

  it("agrega el giro del ciclo", () => {
    expect(guardarGiro(ESTADO_VACIO, giro).giros).toEqual([giro]);
  });

  it("pisa el giro del mismo ciclo: el cambio reemplaza al anterior", () => {
    const conGiro = guardarGiro(ESTADO_VACIO, giro);
    const cambiado = guardarGiro(conGiro, {
      ...giro,
      citaId: "arcades-retro",
      retiradaUsada: true,
    });

    expect(cambiado.giros).toHaveLength(1);
    expect(cambiado.giros[0].citaId).toBe("arcades-retro");
    expect(cambiado.giros[0].retiradaUsada).toBe(true);
  });

  it("no toca los giros de otros ciclos", () => {
    const conGiro = guardarGiro(ESTADO_VACIO, giro);
    const siguiente = guardarGiro(conGiro, {
      ciclo: "2026-09",
      citaId: "picnic-nocturno",
      fechaISO: "2026-09-12T20:00:00.000Z",
      retiradaUsada: false,
    });

    expect(siguiente.giros).toHaveLength(2);
    expect(giroDelCiclo(siguiente, "2026-08")?.citaId).toBe("cena-sorpresa");
  });

  it("no muta el estado que recibe", () => {
    const original: Estado = { version: 1, giros: [] };
    guardarGiro(original, giro);
    expect(original.giros).toHaveLength(0);
  });
});

describe("puedeGirarEnCiclo", () => {
  const primerGiro = {
    ciclo: "2026-08",
    citaId: "cena-sorpresa",
    fechaISO: "2026-08-12T20:00:00.000Z",
    retiradaUsada: false,
  };

  it("le toca girar si el ciclo está sin estrenar", () => {
    expect(puedeGirarEnCiclo(ESTADO_VACIO, "2026-08")).toBe(true);
  });

  it("le queda el cambio tras el primer giro", () => {
    const estado = guardarGiro(ESTADO_VACIO, primerGiro);
    expect(puedeGirarEnCiclo(estado, "2026-08")).toBe(true);
  });

  it("se acaba al gastar el cambio", () => {
    const estado = guardarGiro(ESTADO_VACIO, {
      ...primerGiro,
      retiradaUsada: true,
    });
    expect(puedeGirarEnCiclo(estado, "2026-08")).toBe(false);
  });

  it("son dos giros por ciclo como máximo", () => {
    let estado = guardarGiro(ESTADO_VACIO, primerGiro);
    expect(puedeGirarEnCiclo(estado, "2026-08")).toBe(true);

    estado = guardarGiro(estado, { ...primerGiro, retiradaUsada: true });
    expect(puedeGirarEnCiclo(estado, "2026-08")).toBe(false);
  });

  it("el ciclo siguiente empieza de cero", () => {
    const estado = guardarGiro(ESTADO_VACIO, {
      ...primerGiro,
      retiradaUsada: true,
    });
    expect(puedeGirarEnCiclo(estado, "2026-09")).toBe(true);
  });
});

describe("giroDelCiclo", () => {
  it("encuentra el giro del ciclo pedido", () => {
    const estado = guardarGiro(ESTADO_VACIO, {
      ciclo: "2026-08",
      citaId: "ruta-del-postre",
      fechaISO: "2026-08-12",
      retiradaUsada: false,
    });

    expect(giroDelCiclo(estado, "2026-08")?.citaId).toBe("ruta-del-postre");
    expect(giroDelCiclo(estado, "2026-09")).toBeUndefined();
  });
});

describe("giros guardados antes de que existiera el cambio", () => {
  it("se leen como si todavía les quedara el cambio, sin descartarlos", () => {
    const almacen = almacenFalso();
    almacen.datos.set(
      CLAVE,
      JSON.stringify({
        version: 1,
        giros: [
          {
            ciclo: "2026-08",
            citaId: "arcades-retro",
            fechaISO: "2026-08-12T20:00:00.000Z",
          },
        ],
      }),
    );
    montarVentana(almacen);

    const estado = leer();

    expect(estado.giros).toHaveLength(1);
    expect(estado.giros[0].citaId).toBe("arcades-retro");
    expect(estado.giros[0].retiradaUsada).toBe(false);
    expect(puedeGirarEnCiclo(estado, "2026-08")).toBe(true);
  });
});
