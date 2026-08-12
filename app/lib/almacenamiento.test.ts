import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ESTADO_VACIO,
  giroDelCiclo,
  guardar,
  leer,
  registrarGiro,
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
        { ciclo: "2026-08", citaId: "ruta-del-postre", fechaISO: "2026-08-12" },
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
        { ciclo: "2026-08", citaId: "arcades-retro", fechaISO: "2026-08-12" },
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

describe("registrarGiro", () => {
  const giro = {
    ciclo: "2026-08",
    citaId: "cena-sorpresa",
    fechaISO: "2026-08-12T20:00:00.000Z",
  };

  it("agrega el giro del ciclo", () => {
    expect(registrarGiro(ESTADO_VACIO, giro).giros).toEqual([giro]);
  });

  it("no pisa un ciclo que ya tenía giro", () => {
    const conGiro = registrarGiro(ESTADO_VACIO, giro);
    const intento = registrarGiro(conGiro, {
      ...giro,
      citaId: "arcades-retro",
    });

    expect(intento.giros).toHaveLength(1);
    expect(intento.giros[0].citaId).toBe("cena-sorpresa");
  });

  it("acepta ciclos distintos", () => {
    const conGiro = registrarGiro(ESTADO_VACIO, giro);
    const siguiente = registrarGiro(conGiro, {
      ciclo: "2026-09",
      citaId: "picnic-nocturno",
      fechaISO: "2026-09-12T20:00:00.000Z",
    });

    expect(siguiente.giros).toHaveLength(2);
  });

  it("no muta el estado que recibe", () => {
    const original: Estado = { version: 1, giros: [] };
    registrarGiro(original, giro);
    expect(original.giros).toHaveLength(0);
  });
});

describe("giroDelCiclo", () => {
  it("encuentra el giro del ciclo pedido", () => {
    const estado = registrarGiro(ESTADO_VACIO, {
      ciclo: "2026-08",
      citaId: "ruta-del-postre",
      fechaISO: "2026-08-12",
    });

    expect(giroDelCiclo(estado, "2026-08")?.citaId).toBe("ruta-del-postre");
    expect(giroDelCiclo(estado, "2026-09")).toBeUndefined();
  });
});
