"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, useSyncExternalStore } from "react";

import { Carta } from "./components/Carta";
import { Premio } from "./components/Premio";
import { Ruleta } from "./components/Ruleta";
import { Sobre } from "./components/Sobre";
import { CITAS, DIA_CUMPLEMES, fechaDeInicio, type Cita } from "./contenido";
import {
  giroDelCiclo,
  guardar,
  instantanea,
  instantaneaServidor,
  registrarGiro,
  suscribir,
} from "./lib/almacenamiento";
import {
  faltaPara,
  idDeCiclo,
  numeroDeCumplemes,
  proximoCumplemes,
  tiempoJuntos,
} from "./lib/cumplemes";
import { citaPorId } from "./lib/premios";
import { parametroDeDesarrollo, useAhora } from "./lib/reloj";

type Etapa = "sobre" | "carta" | "ruleta" | "premio";

const ETAPAS: Etapa[] = ["sobre", "carta", "ruleta", "premio"];

function etapaInicial(): Etapa {
  const forzada = parametroDeDesarrollo("etapa");
  return ETAPAS.includes(forzada as Etapa) ? (forzada as Etapa) : "sobre";
}

export default function Pagina() {
  const ahora = useAhora();
  const estado = useSyncExternalStore(
    suscribir,
    instantanea,
    instantaneaServidor,
  );

  // Seguro leerlo en la inicialización: hasta que llega el reloj se dibuja el
  // sobre igual que en el servidor, así que la hidratación cuadra.
  const [etapa, setEtapa] = useState<Etapa>(etapaInicial);

  // Solo en desarrollo: `?cita=<id>` deja mirar la pantalla de premio sin
  // tener que jugar un giro entero.
  const [citaForzada] = useState(() => parametroDeDesarrollo("cita"));

  const listo = ahora !== null;

  const confirmar = useCallback(
    (cita: Cita) => {
      if (!ahora) return;

      const ciclo = idDeCiclo(ahora, DIA_CUMPLEMES);

      guardar(
        registrarGiro(estado, {
          ciclo,
          citaId: cita.id,
          fechaISO: ahora.toISOString(),
        }),
      );

      setEtapa("premio");
    },
    [ahora, estado],
  );

  // El sobre no depende del reloj, así que puede renderizarse antes de que
  // el cliente sepa qué hora es.
  if (!listo || etapa === "sobre") {
    return (
      <main>
        <Sobre onAbrir={() => setEtapa("carta")} />
      </main>
    );
  }

  const inicio = fechaDeInicio();
  const ciclo = idDeCiclo(ahora, DIA_CUMPLEMES);
  const giroDeEsteCiclo = giroDelCiclo(estado, ciclo);
  const citaGanada = giroDeEsteCiclo
    ? citaPorId(CITAS, giroDeEsteCiclo.citaId)
    : citaForzada
      ? citaPorId(CITAS, citaForzada)
      : undefined;

  // Si la cita guardada ya no existe en contenido.ts, se le devuelve el giro
  // en vez de dejarla mirando una pantalla rota.
  const puedeGirar = !giroDeEsteCiclo || !citaGanada;

  const historialPrevio = estado.giros.filter((giro) => giro.ciclo !== ciclo);

  return (
    <main>
      <AnimatePresence mode="wait">
        <motion.div
          key={etapa}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {etapa === "carta" && (
            <Carta
              tiempo={tiempoJuntos(inicio, ahora)}
              numeroDeCumplemes={numeroDeCumplemes(inicio, ahora)}
              puedeGirar={puedeGirar}
              onContinuar={() => setEtapa(puedeGirar ? "ruleta" : "premio")}
            />
          )}

          {etapa === "ruleta" && (
            <Ruleta
              citas={CITAS}
              historial={historialPrevio}
              onConfirmado={confirmar}
              onVolver={() => setEtapa("carta")}
            />
          )}

          {etapa === "premio" &&
            (citaGanada ? (
              <Premio
                cita={citaGanada}
                numeroDeCumplemes={numeroDeCumplemes(inicio, ahora)}
                historial={historialPrevio}
                faltan={faltaPara(
                  proximoCumplemes(ahora, DIA_CUMPLEMES),
                  ahora,
                )}
                onVolver={() => setEtapa("carta")}
              />
            ) : (
              <Ruleta
                citas={CITAS}
                historial={historialPrevio}
                onConfirmado={confirmar}
                onVolver={() => setEtapa("carta")}
              />
            ))}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
