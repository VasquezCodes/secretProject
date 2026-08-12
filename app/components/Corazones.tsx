import { Heart } from "lucide-react";

/**
 * Corazones que suben despacio detrás de la carta. Deliberadamente pocos:
 * lo llamativo de esta app es la rueda, y todo lo demás se queda callado.
 *
 * Los valores están escritos a mano en vez de sorteados. Con `Math.random()`
 * el servidor y el cliente dibujarían posiciones distintas y la hidratación
 * no cuadraría, y de todos modos seis corazones no necesitan azar: necesitan
 * verse bien repartidos, que es más fácil de conseguir eligiéndolos.
 */
/**
 * Los retrasos son NEGATIVOS a propósito: arrancan la animación ya empezada,
 * así hay corazones repartidos por la pantalla desde el primer instante en vez
 * de una pantalla vacía durante los primeros diez segundos.
 */
const CORAZONES = [
  { izquierda: 7, retraso: -2, duracion: 19, tamano: 20, deriva: "2.5vw" },
  { izquierda: 21, retraso: -14, duracion: 24, tamano: 28, deriva: "-3vw" },
  { izquierda: 35, retraso: -7, duracion: 17, tamano: 17, deriva: "3.5vw" },
  { izquierda: 49, retraso: -19, duracion: 22, tamano: 32, deriva: "-2vw" },
  { izquierda: 63, retraso: -4, duracion: 20, tamano: 22, deriva: "1.5vw" },
  { izquierda: 77, retraso: -11, duracion: 26, tamano: 18, deriva: "-3.5vw" },
  { izquierda: 89, retraso: -16, duracion: 21, tamano: 25, deriva: "2vw" },
  { izquierda: 14, retraso: -23, duracion: 28, tamano: 15, deriva: "-1.5vw" },
];

export function Corazones() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {CORAZONES.map((corazon, i) => (
        <Heart
          key={i}
          size={corazon.tamano}
          strokeWidth={1.5}
          fill="currentColor"
          className="text-rosa/45 absolute bottom-0"
          style={{
            left: `${corazon.izquierda}%`,
            ["--deriva" as string]: corazon.deriva,
            animation: `corazon-sube ${corazon.duracion}s linear ${corazon.retraso}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
