/**
 * Todo lo editable de la app vive acá.
 *
 * Para agregar citas nuevas cada mes, empuja objetos al final de `CITAS`.
 * El resto de la app se adapta sola: la rueda se redibuja y ajusta cómo
 * muestra cada gajo según cuántas citas haya.
 */

export type ClaveIcono =
  | "caminata"
  | "postre"
  | "atardecer"
  | "arcade"
  | "cena";

export type Cita = {
  /** Se guarda en el historial. Nunca lo cambies una vez desplegado. */
  id: string;
  icono: ClaveIcono;
  titulo: string;
  descripcion: string;
};

export const ELLA = {
  nombre: "Clara",
  apodo: "Pastelito",
} as const;

export const FIRMA = "Tu jevo";

/** El día del mes en que se cumple el cumplemes. */
export const DIA_CUMPLEMES = 12;

/** Cuándo empezaron. Mes en base 1, como lo lee un humano. */
export const INICIO = { anio: 2026, mes: 7, dia: 12 } as const;

/**
 * Construye la fecha de inicio en hora local.
 * No uses `new Date("2026-07-12")`: eso se interpreta como UTC y corre la
 * fecha un día en husos horarios negativos.
 */
export function fechaDeInicio(): Date {
  return new Date(INICIO.anio, INICIO.mes - 1, INICIO.dia, 0, 0, 0, 0);
}

/** El mensaje de la carta. Cada string es un párrafo. */
export const CARTA: readonly string[] = [
  "Hoy se cumple un mes. Dicho así suena a poco, y en días lo es. Pero yo no lo siento como un mes.",
  "No te voy a escribir que todo fue perfecto, porque no lo fue. Tuvimos nuestros roces, cosas por acomodar, y seguramente vengan más. Y aun así, ni un solo día dudé de que quiero estar acá, contigo.",
  "Te volviste importante en mi vida mucho más rápido de lo que esperaba, y no me da miedo decirlo: te amo, Clara.",
];

export const CIERRE = "Feliz primer mes. Ahora gira la ruleta, que te debo una cita.";

export const CITAS: readonly Cita[] = [
  {
    id: "turistas-locales",
    icono: "caminata",
    titulo: "Turistas locales",
    descripcion:
      "Elegimos un barrio histórico que no frecuentamos y lo recorremos a pie, sin usar mapas, perdida historica",
  },
  {
    id: "ruta-del-postre",
    icono: "postre",
    titulo: "Ruta del postre",
    descripcion:
      "Nos saltamos la cena y vamos a tres lugares distintos, solo para probar su postre o helado estrella.",
  },
  {
    id: "picnic-nocturno",
    icono: "atardecer",
    titulo: "Pícnic nocturno",
    descripcion:
      "Canasta con quesos, bebidas y mandarinas, un parque iluminado o un mirador, y el atardecer.",
  },
  {
    id: "arcades-retro",
    icono: "arcade",
    titulo: "Arcades retro",
    descripcion:
      "Sala de videojuegos antiguos tipo Acatraz o Neverland, el que pierda le toca castigo",
  },
  {
    id: "cena-sorpresa",
    icono: "cena",
    titulo: "Cena sorpresa",
    descripcion:
      "Yo elijo el restaurante y mantengo el menú y la ubicación en secreto hasta llegar.",
  },
];

/** Fotos de ellos. Las de mesa se usan como fondo, nunca en primer plano. */
export const FOTOS = {
  retrato: "/fotos/clara.jpg",
  mesas: [
    "/fotos/mesa-pabellon.jpg",
    "/fotos/mesa-arepas.jpg",
    "/fotos/mesa-nachos.jpg",
    "/fotos/clara-pollo.jpg",
  ],
} as const;
