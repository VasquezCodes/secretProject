import { describe, expect, it } from "vitest";

import {
  anguloDeGajo,
  centroDeGajo,
  pathDeGajo,
  rotacionGanadora,
  tamanoDeIncognita,
  tonoDeGajo,
} from "./rueda";

describe("rotacionGanadora", () => {
  it("deja el centro del gajo justo bajo la lengüeta de las 12", () => {
    const total = 5;

    for (let i = 0; i < total; i += 1) {
      const destino = rotacionGanadora(i, total, 0, 6, 0);
      const posicionFinal = (centroDeGajo(i, total) + destino) % 360;

      // 0 y 360 son la misma posición: las 12 en punto.
      const distanciaAlTope = Math.min(posicionFinal, 360 - posicionFinal);
      expect(distanciaAlTope).toBeCloseTo(0, 6);
    }
  });

  it("siempre avanza, nunca retrocede ni se queda quieta", () => {
    const actual = 4321;
    const destino = rotacionGanadora(2, 7, actual, 5, 0.4);
    expect(destino).toBeGreaterThan(actual);
  });

  it("da al menos las vueltas pedidas", () => {
    const destino = rotacionGanadora(0, 5, 0, 6, 0);
    expect(destino).toBeGreaterThanOrEqual(6 * 360);
  });

  it("el desvío mantiene el resultado dentro del gajo ganador", () => {
    const total = 5;
    const paso = anguloDeGajo(total);

    for (const desvio of [-1, -0.5, 0, 0.5, 1]) {
      const destino = rotacionGanadora(3, total, 0, 6, desvio);
      const posicionFinal = (centroDeGajo(3, total) + destino) % 360;
      const desdeElTope = Math.min(posicionFinal, 360 - posicionFinal);

      // El punto que queda arriba sigue perteneciendo al gajo 3.
      expect(desdeElTope).toBeLessThan(paso / 2);
    }
  });
});

describe("tonoDeGajo", () => {
  it("nunca repite tono entre el último gajo y el primero", () => {
    for (let total = 2; total <= 30; total += 1) {
      const primero = tonoDeGajo(0, total);
      const ultimo = tonoDeGajo(total - 1, total);
      expect(ultimo).not.toBe(primero);
    }
  });

  it("nunca repite tono entre gajos vecinos", () => {
    for (let total = 2; total <= 30; total += 1) {
      for (let i = 1; i < total; i += 1) {
        expect(tonoDeGajo(i, total)).not.toBe(tonoDeGajo(i - 1, total));
      }
    }
  });
});

describe("tamanoDeIncognita", () => {
  it("achica la incógnita a medida que crece el pool", () => {
    const tamanos = [5, 9, 13, 21].map(tamanoDeIncognita);
    const ordenados = [...tamanos].sort((a, b) => b - a);
    expect(tamanos).toEqual(ordenados);
  });

  it("nunca deja la incógnita demasiado chica para verse", () => {
    for (let total = 1; total <= 40; total += 1) {
      expect(tamanoDeIncognita(total)).toBeGreaterThanOrEqual(17);
    }
  });
});

describe("pathDeGajo", () => {
  it("dibuja una porción desde el centro", () => {
    expect(pathDeGajo(0, 5)).toMatch(/^M 210 210 L/);
  });

  it("dibuja un círculo completo cuando hay una sola cita", () => {
    const path = pathDeGajo(0, 1);
    expect(path).not.toContain("L");
    expect(path.match(/A /g)).toHaveLength(2);
  });
});
