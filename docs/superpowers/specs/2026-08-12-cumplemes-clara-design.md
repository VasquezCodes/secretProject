# Cumplemes de Clara — Diseño

**Fecha:** 2026-08-12
**Estado:** Aprobado por el usuario

## Qué es

Una web app de un solo enlace, regalo mensual para Clara ("Pastelito"). Al abrirla ve un sobre,
lo toca, se despliega una carta con un mensaje y un contador en vivo del tiempo que llevan juntos,
y después gira una ruleta que le otorga una cita real que él se compromete a cumplir.

Se repite **cada 12 del mes** (empezaron el 12 de julio de 2026). Cada ciclo mensual habilita
exactamente un giro. Entre ciclos, ella ve su cupón vigente, el historial de cupones anteriores y
una cuenta regresiva al próximo 12.

**Primer ciclo: 12 de agosto de 2026 (hoy).** El deadline de la primera entrega es hoy.

## Restricciones

- Sin backend, sin base de datos, sin cuentas de usuario. Todo corre en el cliente.
- Mobile-first: ella lo abre en el celular.
- Se despliega en Vercel (plan gratuito) y se comparte por link.
- El usuario debe poder agregar citas nuevas en meses futuros editando **un solo archivo**.

## Stack

El proyecto ya existe: Next.js 16.3.0 (App Router), React 19.2.8, Tailwind CSS 4, TypeScript.
Una sola ruta: `/`.

> **Nota de implementación:** `AGENTS.md` advierte que esta versión de Next.js tiene cambios que
> rompen respecto de convenciones anteriores. Antes de escribir código hay que leer las guías
> relevantes en `node_modules/next/dist/docs/`.

## Contenido

### Datos

| Campo | Valor |
|---|---|
| Nombre | Clara |
| Apodo | Pastelito |
| Fecha de inicio | 2026-07-12 |
| Día del cumplemes | 12 |

### Mensaje de la carta

> Pastelito,
>
> Hoy se cumple un mes. Dicho así suena a poco, y en días lo es. Pero yo no lo siento como un mes.
>
> No te voy a escribir que todo fue perfecto, porque no lo fue. Tuvimos nuestros roces, cosas por
> acomodar, y seguramente vengan más. Y aun así, ni un solo día dudé de que quiero estar acá, contigo.
>
> Te volviste importante en mi vida mucho más rápido de lo que esperaba, y no me da miedo decirlo:
> te amo, Clara.
>
> Feliz primer mes. Ahora gira la ruleta, que te debo una cita. 💛

El texto es fijo y vive en `contenido.ts`. No lleva placeholders.

### Las 5 citas

| id | Emoji | Título | Descripción (va en el cupón) |
|---|---|---|---|
| `turistas-locales` | 🗺️ | Turistas locales | Elegimos un barrio histórico que no frecuentamos y lo recorremos a pie, sin usar mapas. |
| `ruta-del-postre` | 🍰 | Ruta del postre | Nos saltamos la cena. Tres lugares distintos, solo para probar su postre o helado estrella. |
| `picnic-nocturno` | 🧺 | Pícnic nocturno | Canasta con quesos y bebidas, un parque iluminado o un mirador, y el atardecer. |
| `arcades-retro` | 🕹️ | Arcades retro | Sala de videojuegos antiguos. Competimos por la puntuación más alta. |
| `cena-sorpresa` | 🍽️ | Cena sorpresa | Yo elijo el restaurante y mantengo el menú y la ubicación en secreto hasta llegar. |

Candidata para agregar más adelante: **Cine bajo las estrellas** (autocine o proyección al aire
libre). Se dejó fuera por depender de que exista una función cerca.

## Arquitectura

```
app/
  contenido.ts          Todo el contenido editable: datos, mensaje, citas
  layout.tsx            Metadata, fuentes
  globals.css           Tema y tokens de color
  page.tsx              Orquestador de etapas
  components/
    Sobre.tsx           Sobre cerrado, se abre al tocar
    Carta.tsx           Mensaje + contador en vivo
    ContadorJuntos.tsx  Días/horas/minutos/segundos desde la fecha de inicio
    Ruleta.tsx          La rueda, el giro y la re-tirada
    Cupon.tsx           El "vale por..." estilo ticket
    Historial.tsx       Cupones de meses anteriores
    CuentaRegresiva.tsx Tiempo hasta el próximo 12
    Corazones.tsx       Fondo animado
  lib/
    cumplemes.ts        Lógica de fechas (funciones puras)
    premios.ts          Sorteo y consulta de historial (funciones puras)
    almacenamiento.ts   Lectura/escritura de localStorage a prueba de fallos
```

La lógica pura (`cumplemes.ts`, `premios.ts`) no importa React ni toca el DOM. Los componentes no
calculan fechas ni sortean: reciben resultados ya computados.

### Máquina de estados

`page.tsx` mantiene una etapa: `"sobre" | "carta" | "ruleta" | "cupon"`.

- `sobre` → `carta`: ella toca el sobre.
- `carta` → `ruleta`: ella toca "Girar la ruleta". Solo se ofrece si el ciclo actual está desbloqueado.
- `ruleta` → `cupon`: termina la animación y el premio queda confirmado.
- Si el ciclo actual **ya fue jugado**, al abrir la app va directo de `sobre` → `carta` → `cupon`
  (con historial y cuenta regresiva), sin pasar por `ruleta`.

## Módulos

### `lib/cumplemes.ts`

Funciones puras. Todas reciben la fecha actual como parámetro (nunca llaman a `new Date()` por
dentro) para que sean testeables y para soportar el override de desarrollo.

- `idDeCiclo(ahora: Date): string` — devuelve `"AAAA-MM"` del ciclo vigente. El ciclo del mes M
  arranca el día 12 de M y termina el 11 de M+1. Ejemplo: el 5 de septiembre de 2026 pertenece al
  ciclo `"2026-08"`; el 12 de septiembre pertenece a `"2026-09"`.
- `mesesJuntos(inicio: Date, ahora: Date): number` — cuántos cumplemes se cumplieron.
- `proximoCumplemes(ahora: Date): Date` — el próximo día 12 a las 00:00 hora local.
- `tiempoJuntos(inicio: Date, ahora: Date): { dias, horas, minutos, segundos }`.

Casos borde a cubrir: el 12 exacto a las 00:00 (pertenece al ciclo nuevo), el cruce de año
(diciembre → enero), y meses de 28/30/31 días. **No se usa el día 29–31 como día de cumplemes**, así
que no hace falta lógica de recorte; el día 12 existe en todos los meses.

Todos los cálculos usan la hora local del dispositivo, no UTC.

### `lib/premios.ts`

- `sortear(citas, aleatorio): Cita` — azar puro y uniforme sobre **todas** las citas. Recibe la
  fuente de aleatoriedad por parámetro para poder testear con un valor fijo.
- `yaSalio(historial, citaId): boolean`
- `citasNoDescubiertas(historial, citas): number` — para el contador "te quedan N por descubrir".

### `lib/almacenamiento.ts`

Una sola clave: `cumplemes:v1`.

```ts
type Estado = {
  version: 1;
  giros: Array<{ ciclo: string; citaId: string; fechaISO: string }>;
};
```

Reglas de robustez:

- Si `localStorage` no está disponible (modo incógnito, permisos), cae a un almacén **en memoria**.
  La app funciona igual; solo no persiste entre sesiones.
- Si el JSON guardado está corrupto o no coincide con el esquema, se descarta y se arranca limpio.
- Nunca se lanza una excepción hacia la UI.

En el peor caso ella puede girar de más. Eso es preferible a que vea una pantalla de error.

## Mecánica de la ruleta

1. Ella pulsa "Girar".
2. Se sortea el premio **antes** de animar (azar puro sobre las 5).
3. La rueda se anima **hacia** el resultado ya elegido: se calcula el ángulo destino a partir del
   índice del gajo, se le suman 6–8 vueltas completas, y se aplica una transición de ~5s con
   desaceleración. Nunca se deduce el premio de dónde quedó la rueda — eso garantiza que la
   animación y el cupón jamás se desincronicen.
4. Al terminar la transición:
   - **Si la cita no había salido nunca** → es definitiva. Confeti, cupón, se guarda.
   - **Si ya había salido en un ciclo anterior** → se le ofrece **una re-tirada**, una sola vez.
     La re-tirada es otro sorteo de azar puro sobre las 5. Su resultado es **definitivo**, salga
     repetido o no.
5. Se guarda un único registro por ciclo: `{ ciclo, citaId, fechaISO }` con el resultado definitivo.

**Consecuencia conocida y aceptada:** a partir del ciclo 6, cuando ya salieron las 5 citas, todo
resultado es repetido y por lo tanto siempre se habilita la re-tirada. La mecánica sigue siendo
consistente. Se diluye a medida que el usuario agregue citas nuevas, que es el plan.

## Flujo de datos

```
localStorage ──> almacenamiento.leer() ──> Estado
                                            │
                        cumplemes.idDeCiclo(ahora) ──┐
                                            │        │
                                            ▼        ▼
                                   ¿hay giro para este ciclo?
                                     │                    │
                                    sí                    no
                                     │                    │
                                     ▼                    ▼
                             Cupón + Historial      Ruleta habilitada
                             + Cuenta regresiva            │
                                                  premios.sortear()
                                                           │
                                                  ¿repetida? ──sí──> re-tirada (1 vez)
                                                           │
                                                           ▼
                                                almacenamiento.guardar()
```

## Diseño visual

**Decisión: Tailwind puro, sin shadcn/ui.** Se evaluó shadcn y se descartó. Las piezas centrales de
esta interfaz (sobre, ruleta, cupón-ticket, corazones) son todas custom y shadcn no aporta ninguna;
usarlo significaría instalar Radix y su sistema de tokens para aprovechar, a lo sumo, un botón.
Además su estética neutra de producto empuja en la dirección opuesta a la que busca este proyecto.
Si en el futuro hiciera falta, se puede agregar sin rehacer nada.

Única dependencia nueva prevista: `canvas-confetti`. Las fuentes se cargan con `next/font`.

- Mobile-first. Se verifica a 375px de ancho antes que en escritorio.
- Paleta cálida: durazno, crema, dorado suave. Fondo con corazones flotando.
- Tipografía con carácter para los títulos, legible para el cuerpo del mensaje.
- El mensaje de la carta aparece escribiéndose, con un ritmo que se pueda saltar tocando la pantalla.
- Confeti al confirmarse el premio.
- El cupón tiene forma de ticket, con el emoji, el título, la descripción, la fecha y el número de
  cumplemes. Está pensado para que ella le saque captura de pantalla.
- Se respeta `prefers-reduced-motion`: sin confeti, sin corazones, la rueda salta al resultado y el
  texto aparece completo.

## Verificación

**Tests unitarios** (donde se esconden los bugs de verdad):

- `lib/cumplemes.ts` — el 12 exacto, el día 11 vs el 12, cruce de año, meses de distinto largo,
  cálculo de meses juntos.
- `lib/premios.ts` — el sorteo respeta la fuente de aleatoriedad inyectada; `yaSalio` y
  `citasNoDescubiertas` con historial vacío, parcial y completo.
- `lib/almacenamiento.ts` — JSON corrupto se descarta; `localStorage` ausente cae a memoria sin
  lanzar.

Hace falta instalar un runner (Vitest) — el proyecto no tiene ninguno.

**Verificación manual** de la UI, con un override de fecha en desarrollo: `?fecha=2026-09-12` inyecta
un `ahora` distinto para simular meses futuros sin esperar. El override solo se lee cuando
`process.env.NODE_ENV !== "production"`.

Checklist manual: abrir el sobre, leer la carta, girar, ver el cupón, recargar la página y confirmar
que ya no deja girar, simular el mes siguiente y confirmar que vuelve a habilitarse.

## Fuera de alcance

Explícitamente **no** entra en esta versión:

- Fotos, galería, timeline de momentos, música de fondo.
- Backend, base de datos, sincronización entre dispositivos.
- Panel de administración. Las citas se agregan editando `contenido.ts` y redesplegando.
- Notificaciones o recordatorios del día 12.
