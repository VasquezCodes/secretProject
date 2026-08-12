"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, useSyncExternalStore } from "react";

import { Carta } from "./components/Carta";
import { Hub } from "./components/Hub";
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

type Etapa = "sobre" | "hub" | "carta" | "ruleta" | "premio";

const ETAPAS: Etapa[] = ["sobre", "hub", "carta", "ruleta", "premio"];

function etapaForzada(): Etapa | null {
  const pedida = parametroDeDesarrollo("etapa");
  return ETAPAS.includes(pedida as Etapa) ? (pedida as Etapa) : null;
}

export default function Pagina() {
  const ahora = useAhora();
  const estado = useSyncExternalStore(
    suscribir,
    instantanea,
    instantaneaServidor,
  );

  // `null` significa "todavía no eligió": se usa la entrada que corresponda
  // según lo que haya jugado. Cualquier navegación posterior fija una etapa.
  const [etapaElegida, setEtapaElegida] = useState<Etapa | null>(etapaForzada);
  const [citaForzada] = useState(() => parametroDeDesarrollo("cita"));

  const confirmar = useCallback(
    (cita: Cita) => {
      if (!ahora) return;

      guardar(
        registrarGiro(estado, {
          ciclo: idDeCiclo(ahora, DIA_CUMPLEMES),
          citaId: cita.id,
          fechaISO: ahora.toISOString(),
        }),
      );

      setEtapaElegida("premio");
    },
    [ahora, estado],
  );

  // Hasta que el cliente sabe qué hora es no se puede decidir nada. Se pinta
  // el fondo a secas, igual que en el servidor, para no parpadear una pantalla
  // que enseguida sería reemplazada por otra.
  if (!ahora) {
    return <main className="bg-noche min-h-dvh" />;
  }

  const inicio = fechaDeInicio();
  const ciclo = idDeCiclo(ahora, DIA_CUMPLEMES);
  const cumplemes = numeroDeCumplemes(inicio, ahora);

  const giroDeEsteCiclo = giroDelCiclo(estado, ciclo);
  const citaGanada = giroDeEsteCiclo
    ? citaPorId(CITAS, giroDeEsteCiclo.citaId)
    : citaForzada
      ? citaPorId(CITAS, citaForzada)
      : undefined;

  // Si la cita guardada ya no existe en contenido.ts, se le devuelve el giro
  // en vez de dejarla mirando una pantalla rota.
  const puedeGirar = !giroDeEsteCiclo || !citaGanada;
  const haGirado = estado.giros.length > 0;

  /*
   * El sobre pasó a significar algo: se abre cuando hay un mes nuevo dentro.
   * Si ya giró lo de este ciclo, no hay nada que abrir y entra directa al hub.
   */
  const etapa: Etapa = etapaElegida ?? (giroDeEsteCiclo ? "hub" : "sobre");

  const alVolver = () => setEtapaElegida(haGirado ? "hub" : "carta");
  const alJugar = () => setEtapaElegida(puedeGirar ? "ruleta" : "premio");

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
          {etapa === "sobre" && (
            <Sobre
              onAbrir={() => setEtapaElegida(haGirado ? "hub" : "carta")}
            />
          )}

          {etapa === "hub" && (
            <Hub
              citas={CITAS}
              giros={estado.giros}
              citaDeEsteCiclo={citaGanada ?? null}
              ciclo={ciclo}
              numeroDeCumplemes={cumplemes}
              onRuleta={alJugar}
              onCarta={() => setEtapaElegida("carta")}
            />
          )}

          {etapa === "carta" && (
            <Carta
              tiempo={tiempoJuntos(inicio, ahora)}
              numeroDeCumplemes={cumplemes}
              puedeGirar={puedeGirar}
              onContinuar={alJugar}
              onVolver={haGirado ? () => setEtapaElegida("hub") : undefined}
            />
          )}

          {etapa === "ruleta" && (
            <Ruleta
              citas={CITAS}
              historial={estado.giros.filter((giro) => giro.ciclo !== ciclo)}
              onConfirmado={confirmar}
              onVolver={alVolver}
            />
          )}

          {etapa === "premio" &&
            (citaGanada ? (
              <Premio
                cita={citaGanada}
                numeroDeCumplemes={cumplemes}
                historial={estado.giros.filter((giro) => giro.ciclo !== ciclo)}
                faltan={faltaPara(proximoCumplemes(ahora, DIA_CUMPLEMES), ahora)}
                onVolver={() => setEtapaElegida("hub")}
              />
            ) : (
              <Ruleta
                citas={CITAS}
                historial={estado.giros.filter((giro) => giro.ciclo !== ciclo)}
                onConfirmado={confirmar}
                onVolver={alVolver}
              />
            ))}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
