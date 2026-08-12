import { describe, expect, it } from "vitest";

import type { Cita } from "../contenido";
import { citaPorId, citasNoDescubiertas, sortear, yaSalio } from "./premios";

const CITAS: Cita[] = [
  { id: "a", icono: "caminata", titulo: "A", descripcion: "" },
  { id: "b", icono: "postre", titulo: "B", descripcion: "" },
  { id: "c", icono: "atardecer", titulo: "C", descripcion: "" },
  { id: "d", icono: "arcade", titulo: "D", descripcion: "" },
  { id: "e", icono: "cena", titulo: "E", descripcion: "" },
];

describe("sortear", () => {
  it("respeta la fuente de aleatoriedad inyectada", () => {
    expect(sortear(CITAS, () => 0).id).toBe("a");
    expect(sortear(CITAS, () => 0.5).id).toBe("c");
    expect(sortear(CITAS, () => 0.999).id).toBe("e");
  });

  it("no se sale del arreglo si la fuente devuelve exactamente 1", () => {
    expect(sortear(CITAS, () => 1).id).toBe("e");
  });

  it("puede devolver una cita ya descubierta: el azar es puro", () => {
    // Con una sola cita en el pool, siempre sale la misma.
    const una = [CITAS[0]];
    expect(sortear(una, () => 0.7).id).toBe("a");
  });

  it("falla claro si no hay citas", () => {
    expect(() => sortear([], () => 0)).toThrow(/No hay citas/);
  });
});

describe("yaSalio", () => {
  it("es falso con historial vacío", () => {
    expect(yaSalio([], "a")).toBe(false);
  });

  it("detecta una cita repetida", () => {
    expect(yaSalio([{ citaId: "b" }, { citaId: "d" }], "d")).toBe(true);
    expect(yaSalio([{ citaId: "b" }, { citaId: "d" }], "a")).toBe(false);
  });
});

describe("citasNoDescubiertas", () => {
  it("son todas cuando el historial está vacío", () => {
    expect(citasNoDescubiertas([], CITAS)).toBe(5);
  });

  it("descuenta las ya descubiertas", () => {
    expect(citasNoDescubiertas([{ citaId: "a" }, { citaId: "c" }], CITAS)).toBe(
      3,
    );
  });

  it("no cuenta dos veces una cita repetida en el historial", () => {
    expect(citasNoDescubiertas([{ citaId: "a" }, { citaId: "a" }], CITAS)).toBe(
      4,
    );
  });

  it("ignora ids del historial que ya no existen en el pool", () => {
    expect(citasNoDescubiertas([{ citaId: "borrada" }], CITAS)).toBe(5);
  });
});

describe("citaPorId", () => {
  it("encuentra la cita", () => {
    expect(citaPorId(CITAS, "c")?.titulo).toBe("C");
  });

  it("devuelve undefined si la cita se borró de contenido.ts", () => {
    expect(citaPorId(CITAS, "fantasma")).toBeUndefined();
  });
});
