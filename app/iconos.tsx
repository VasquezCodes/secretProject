import {
  Footprints,
  Gamepad2,
  IceCreamCone,
  Sunset,
  UtensilsCrossed,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

import type { ClaveIcono } from "./contenido";

/**
 * Las claves de `contenido.ts` se traducen acá a componentes.
 * Así agregar una cita nueva no obliga a tocar imports.
 */
const ICONOS: Record<ClaveIcono, LucideIcon> = {
  caminata: Footprints,
  postre: IceCreamCone,
  atardecer: Sunset,
  arcade: Gamepad2,
  cena: UtensilsCrossed,
};

/**
 * Dibuja el icono de una cita. Se resuelve dentro de un componente estable en
 * vez de devolver el componente al llamador, que reiniciaría su estado en
 * cada render.
 */
export function IconoCita({
  clave,
  ...props
}: { clave: ClaveIcono } & LucideProps) {
  const Componente = ICONOS[clave] ?? Footprints;
  return <Componente {...props} />;
}
