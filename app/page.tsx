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
  guardarGiro,
  instantanea,
  instantaneaServidor,
  puedeGirarEnCiclo,
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

  /** Al parar la rueda. Guardar acá evita que recargar regale otro giro. */
  const anotarGiro = useCallback(
    (cita: Cita, gastaElCambio: boolean) => {
      if (!ahora) return;

      guardar(
        guardarGiro(estado, {
          ciclo: idDeCiclo(ahora, DIA_CUMPLEMES),
          citaId: cita.id,
          fechaISO: ahora.toISOString(),
          retiradaUsada: gastaElCambio,
        }),
      );
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

  /*
   * Le queda giro si no ha girado este ciclo, o si giró pero todavía no gastó
   * el cambio. Son dos giros por ciclo como máximo.
   *
   * Y si la cita guardada ya no existe en contenido.ts, se le devuelve el giro
   * en vez de dejarla mirando una pantalla rota.
   */
  const puedeGirar = puedeGirarEnCiclo(estado, ciclo) || !citaGanada;

  // El segundo giro del ciclo es el cambio, y es definitivo.
  const esElCambio = giroDeEsteCiclo !== undefined;

  const haGirado = estado.giros.length > 0;

  /*
   * El sobre pasó a significar algo: se abre cuando hay un mes nuevo dentro.
   * Si ya giró lo de este ciclo, no hay nada que abrir y entra directa al hub.
   */
  const etapa: Etapa = etapaElegida ?? (giroDeEsteCiclo ? "hub" : "sobre");

  const alVolver = () => setEtapaElegida(haGirado ? "hub" : "carta");

  // Si ya tiene cita, primero se la enseña. Gastar el cambio se decide desde
  // la pantalla del premio, nunca de un toque suelto.
  const alJugar = () => setEtapaElegida(citaGanada ? "premio" : "ruleta");

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
              cambioPendiente={Boolean(citaGanada) && puedeGirar}
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
              ultimoGiro={esElCambio}
              onGiro={anotarGiro}
              onListo={() => setEtapaElegida("premio")}
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
                onCambiar={
                  puedeGirar ? () => setEtapaElegida("ruleta") : undefined
                }
              />
            ) : (
              <Ruleta
                citas={CITAS}
                historial={estado.giros.filter((giro) => giro.ciclo !== ciclo)}
                ultimoGiro={esElCambio}
                onGiro={anotarGiro}
                onListo={() => setEtapaElegida("premio")}
                onVolver={alVolver}
              />
            ))}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
