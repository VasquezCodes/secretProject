import { describe, expect, it } from "vitest";

import {
  faltaPara,
  idDeCiclo,
  numeroDeCumplemes,
  proximoCumplemes,
  tiempoJuntos,
} from "./cumplemes";

const DIA = 12;
const INICIO = new Date(2026, 6, 12); // 12 de julio de 2026

describe("idDeCiclo", () => {
  it("el día exacto del cumplemes ya pertenece al ciclo nuevo", () => {
    expect(idDeCiclo(new Date(2026, 7, 12, 0, 0, 0), DIA)).toBe("2026-08");
  });

  it("el día anterior todavía pertenece al ciclo viejo", () => {
    expect(idDeCiclo(new Date(2026, 7, 11, 23, 59, 59), DIA)).toBe("2026-07");
  });

  it("mantiene el ciclo hasta el día anterior del mes siguiente", () => {
    expect(idDeCiclo(new Date(2026, 8, 5), DIA)).toBe("2026-08");
    expect(idDeCiclo(new Date(2026, 8, 11), DIA)).toBe("2026-08");
    expect(idDeCiclo(new Date(2026, 8, 12), DIA)).toBe("2026-09");
  });

  it("cruza el cambio de año hacia atrás", () => {
    expect(idDeCiclo(new Date(2027, 0, 5), DIA)).toBe("2026-12");
  });

  it("cruza el cambio de año hacia adelante", () => {
    expect(idDeCiclo(new Date(2026, 11, 12), DIA)).toBe("2026-12");
    expect(idDeCiclo(new Date(2027, 0, 12), DIA)).toBe("2027-01");
  });

  it("funciona igual en meses de 28, 30 y 31 días", () => {
    expect(idDeCiclo(new Date(2027, 1, 28), DIA)).toBe("2027-02");
    expect(idDeCiclo(new Date(2026, 8, 30), DIA)).toBe("2026-09");
    expect(idDeCiclo(new Date(2026, 9, 31), DIA)).toBe("2026-10");
  });
});

describe("numeroDeCumplemes", () => {
  it("es cero el día que empiezan", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2026, 6, 12))).toBe(0);
  });

  it("es cero el día antes del primer cumplemes", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2026, 7, 11))).toBe(0);
  });

  it("es uno el día del primer cumplemes", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2026, 7, 12))).toBe(1);
  });

  it("no adelanta el conteo antes de que llegue el día", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2026, 8, 11))).toBe(1);
    expect(numeroDeCumplemes(INICIO, new Date(2026, 8, 12))).toBe(2);
  });

  it("cuenta por calendario, no por días transcurridos", () => {
    // Agosto tiene 31 días y febrero 28. Ambos valen un cumplemes.
    expect(numeroDeCumplemes(INICIO, new Date(2027, 1, 12))).toBe(7);
  });

  it("cruza años", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2027, 6, 12))).toBe(12);
  });

  it("nunca es negativo si la fecha es anterior al inicio", () => {
    expect(numeroDeCumplemes(INICIO, new Date(2026, 5, 1))).toBe(0);
  });
});

describe("proximoCumplemes", () => {
  it("apunta al día de este mes si todavía no llegó", () => {
    expect(proximoCumplemes(new Date(2026, 7, 5), DIA)).toEqual(
      new Date(2026, 7, 12, 0, 0, 0, 0),
    );
  });

  it("apunta al mes siguiente si ya pasó o es hoy", () => {
    expect(proximoCumplemes(new Date(2026, 7, 12, 10, 0), DIA)).toEqual(
      new Date(2026, 8, 12, 0, 0, 0, 0),
    );
  });

  it("cruza el cambio de año", () => {
    expect(proximoCumplemes(new Date(2026, 11, 15), DIA)).toEqual(
      new Date(2027, 0, 12, 0, 0, 0, 0),
    );
  });
});

describe("tiempoJuntos", () => {
  it("desglosa días, horas, minutos y segundos", () => {
    const ahora = new Date(2026, 6, 14, 3, 25, 40);
    expect(tiempoJuntos(INICIO, ahora)).toEqual({
      dias: 2,
      horas: 3,
      minutos: 25,
      segundos: 40,
    });
  });

  it("es cero en el instante de inicio", () => {
    expect(tiempoJuntos(INICIO, INICIO)).toEqual({
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    });
  });

  it("no devuelve negativos si la fecha es anterior", () => {
    expect(tiempoJuntos(INICIO, new Date(2026, 5, 1))).toEqual({
      dias: 0,
      horas: 0,
      minutos: 0,
      segundos: 0,
    });
  });
});

describe("faltaPara", () => {
  it("mide lo que queda hasta el objetivo", () => {
    const ahora = new Date(2026, 8, 10, 22, 0, 0);
    const objetivo = new Date(2026, 8, 12, 0, 0, 0);
    expect(faltaPara(objetivo, ahora)).toEqual({
      dias: 1,
      horas: 2,
      minutos: 0,
      segundos: 0,
    });
  });
});
