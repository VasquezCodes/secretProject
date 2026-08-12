/**
 * Todo el sonido de la ruleta, generado con osciladores en vez de archivos:
 * pesa cero, no hay nada que descargar, y cada golpe sale con un tono
 * ligeramente distinto, que es justo lo que impide que suene a bucle grabado.
 *
 * El contexto de audio se crea al tocar "Girar". Los navegadores móviles
 * exigen un gesto del usuario para permitir sonido, y ese es el gesto.
 */

export type Sonidos = {
  /** El golpe de la lengüeta contra una clavija. */
  clac: () => void;
  /** La musiquita que acompaña el giro. */
  iniciarGiro: () => void;
  detenerGiro: () => void;
  /** El remate cuando se confirma la cita, junto con el confeti. */
  fanfarria: () => void;
  cerrar: () => void;
};

type VentanaConAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

/** Do mayor pentatónica. Cualquier combinación suena bien, no hay notas feas. */
const MOTIVO = [523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33];
const REMATE = [523.25, 659.25, 783.99, 1046.5];

const MS_POR_NOTA = 150;

export function crearSonidos(): Sonidos | null {
  if (typeof window === "undefined") return null;

  const ventana = window as VentanaConAudio;
  const Constructor = window.AudioContext ?? ventana.webkitAudioContext;
  if (!Constructor) return null;

  let contexto: AudioContext;
  try {
    contexto = new Constructor();
  } catch {
    return null;
  }

  let temporizador: number | null = null;
  let paso = 0;

  function despierto(): boolean {
    if (contexto.state === "suspended") {
      void contexto.resume();
    }
    return contexto.state === "running";
  }

  /** Una nota con envolvente propia. `tipo` cambia el carácter del timbre. */
  function nota(
    frecuencia: number,
    duracion: number,
    volumen: number,
    tipo: OscillatorType = "triangle",
  ) {
    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = tipo;
    oscilador.frequency.setValueAtTime(frecuencia, ahora);

    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(volumen, ahora + 0.012);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);

    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);

    oscilador.start(ahora);
    oscilador.stop(ahora + duracion + 0.02);
  }

  function clac() {
    if (!despierto()) return;

    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = "triangle";
    oscilador.frequency.setValueAtTime(880 + Math.random() * 260, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(300, ahora + 0.035);

    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.11, ahora + 0.004);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.07);

    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);

    oscilador.start(ahora);
    oscilador.stop(ahora + 0.08);
  }

  function iniciarGiro() {
    if (temporizador !== null) return;
    if (!despierto()) return;

    paso = 0;

    // Suena por debajo de los clacs a propósito: la musiquita acompaña, el
    // que lleva la tensión es el golpeteo de las clavijas.
    temporizador = window.setInterval(() => {
      nota(MOTIVO[paso % MOTIVO.length], 0.26, 0.045, "sine");
      paso += 1;
    }, MS_POR_NOTA);
  }

  function detenerGiro() {
    if (temporizador === null) return;
    window.clearInterval(temporizador);
    temporizador = null;
  }

  function fanfarria() {
    if (!despierto()) return;

    detenerGiro();

    REMATE.forEach((frecuencia, i) => {
      window.setTimeout(() => {
        if (!despierto()) return;
        nota(frecuencia, 0.5, 0.15);
      }, i * 95);
    });

    // El acorde que queda sonando debajo del confeti.
    window.setTimeout(() => {
      if (!despierto()) return;
      nota(1046.5, 1.1, 0.1, "sine");
      nota(1318.51, 1.1, 0.075, "sine");
    }, REMATE.length * 95);
  }

  function cerrar() {
    detenerGiro();
    void contexto.close().catch(() => {});
  }

  return { clac, iniciarGiro, detenerGiro, fanfarria, cerrar };
}
