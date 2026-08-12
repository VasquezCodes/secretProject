# Cumplemes de Clara — Diseño

**Fecha:** 2026-08-12
**Estado:** Aprobado por el usuario

## Qué es

Una web app de un solo enlace, regalo mensual para Clara ("Pastelito"). Al abrirla ve un sobre,
lo toca, se despliega una carta con un mensaje y un contador en vivo del tiempo que llevan juntos,
y después gira una ruleta que le otorga una cita real que él se compromete a cumplir.

Se repite **cada 12 del mes** (empezaron el 12 de julio de 2026). Cada ciclo mensual habilita
exactamente un giro. Entre ciclos, ella ve su premio vigente, el historial de premios anteriores y
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
> Feliz primer mes. Ahora gira la ruleta, que te debo una cita.

El texto es fijo y vive en `contenido.ts`. No lleva placeholders. La firma al pie también sale de
`contenido.ts` (`FIRMA`), en Garamond itálica.

### Las 5 citas

Sin emoji en ningún lado: los iconos son de Lucide.

| id | Clave de icono | Lucide | Título |
|---|---|---|---|
| `turistas-locales` | `caminata` | `Footprints` | Turistas locales |
| `ruta-del-postre` | `postre` | `IceCreamCone` | Ruta del postre |
| `picnic-nocturno` | `atardecer` | `Sunset` | Pícnic nocturno |
| `arcades-retro` | `arcade` | `Gamepad2` | Arcades retro |
| `cena-sorpresa` | `cena` | `UtensilsCrossed` | Cena sorpresa |

Candidata inmediata para el próximo ciclo: **Cine bajo las estrellas** (autocine o proyección al aire
libre). Se dejó fuera del arranque por depender de que exista una función cerca.

**El pool crece: cada mes se agregan 2 citas nuevas** editando este mismo archivo (`contenido.ts`).
El resto de la app se adapta sola. Ver "Crecimiento del pool" y "Los gajos no dicen qué son".

## Arquitectura

```
app/
  contenido.ts          Todo el contenido editable: datos, mensaje, citas
  iconos.tsx            Clave de icono -> componente Lucide
  layout.tsx            Metadata, fuentes
  globals.css           Tema y tokens de color
  page.tsx              Orquestador de etapas
  components/
    Sobre.tsx           Sobre cerrado, se abre al tocar
    Carta.tsx           Mensaje + retrato + contador en vivo
    Contador.tsx        Días/horas/minutos/segundos (tiempo juntos y espera)
    Corazones.tsx       Corazones que suben detrás de la carta
    FondoNoche.tsx      Foto de mesa desenfocada como atmósfera
    Ruleta.tsx          La rueda, el giro y la re-tirada
    Premio.tsx          La tarjeta de la cita y la cuenta regresiva
    Historial.tsx       Citas de meses anteriores
  lib/
    cumplemes.ts        Lógica de fechas (funciones puras)
    premios.ts          Sorteo y consulta de historial (funciones puras)
    rueda.ts            Geometría de la rueda (funciones puras)
    almacenamiento.ts   localStorage a prueba de fallos + store externo
    sonido.ts           El clac de las clavijas, con Web Audio
    reloj.ts            useAhora() y los atajos de desarrollo
```

Las cuatro primeras de `lib/` son puras: no importan React ni tocan el DOM, y por eso son las que
tienen tests. Los componentes no calculan fechas, ni sortean, ni resuelven geometría: reciben
resultados ya computados.

La lógica pura (`cumplemes.ts`, `premios.ts`) no importa React ni toca el DOM. Los componentes no
calculan fechas ni sortean: reciben resultados ya computados.

### Máquina de estados

`page.tsx` mantiene una etapa: `"sobre" | "carta" | "ruleta" | "cupon"`.

- `sobre` → `carta`: ella toca el sobre.
- `carta` → `ruleta`: ella toca "Girar la ruleta". Solo se ofrece si el ciclo actual está desbloqueado.
- `ruleta` → `premio`: termina la animación y el premio queda confirmado.
- Si el ciclo actual **ya fue jugado**, al abrir la app va directo de `sobre` → `carta` → `premio`
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
   animación y la tarjeta jamás se desincronicen.
4. Al terminar la transición:
   - **Si la cita no había salido nunca** → es definitiva. Confeti, tarjeta, se guarda.
   - **Si ya había salido en un ciclo anterior** → se le ofrece **una re-tirada**, una sola vez.
     La re-tirada es otro sorteo de azar puro sobre las 5. Su resultado es **definitivo**, salga
     repetido o no.
5. Se guarda un único registro por ciclo: `{ ciclo, citaId, fechaISO }` con el resultado definitivo.

### Crecimiento del pool

El plan es **agregar 2 citas nuevas cada mes**. Como se consume 1 por ciclo, el pool crece neto: en
el ciclo *n* el total es `5 + 2(n-1)` y quedan `n + 3` citas sin descubrir. **El pool nunca se
agota**, así que no hace falta lógica de rebarajado.

La probabilidad de que el primer giro caiga en una repetida es `n / (5 + 2(n-1))`: 0% el ciclo 1,
~14% el 2, ~33% el 6, y tiende a ~50% a largo plazo. La re-tirada queda como un evento ocasional,
que es la intención.

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
                            Tarjeta + Historial     Ruleta habilitada
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
esta interfaz (sobre, ruleta, tarjeta de premio, corazones) son todas custom y shadcn no aporta
ninguna; usarlo significaría instalar Radix y su sistema de tokens para aprovechar, a lo sumo, un
botón. Además su estética neutra de producto empuja en la dirección opuesta a la que busca este
proyecto. Si en el futuro hiciera falta, se puede agregar sin rehacer nada.

Dependencias nuevas: `motion` (transiciones y elemento compartido), `canvas-confetti`,
`@phosphor-icons/react`. Las fuentes se cargan con `next/font`.

### Paleta

Derivada de las fotos reales de la pareja, no de un repertorio genérico de romanticismo. Las fotos
son todas mesas de restaurante de noche: madera oscura, luz cálida, y el rosa de las cerezas de la
camiseta de ella.

| Token | Hex | Uso |
|---|---|---|
| `--color-tinta` | `#2a1e1a` | Marrón casi negro. Texto sobre papel. |
| `--color-papel` | `#f5e7e0` | Papel con tinte rosado. Fondo de sobre y carta. |
| `--color-papel-alto` | `#fbf3ee` | Papel elevado: la carta, la solapa del sobre. |
| `--color-noche` | `#1b1210` | Fondo de las etapas de ruleta y premio. |
| `--color-rosa` | `#c4415f` | Acento decorativo: aro, clavijas, bombillas, sello. |
| `--color-rosa-honda` | `#982a46` | Fondo de botones, con texto papel encima. |
| `--color-rosa-clara` | `#e8778f` | Texto rosa sobre fondo oscuro. |
| `--color-humo` | `#8a6f66` | Texto secundario sobre papel. |

Los tres rosas no son tres acentos: son el mismo color calibrado para tres trabajos, y cada uno está
donde está para que el contraste pase WCAG AA. Concretamente, texto `papel` sobre `rosa` da 4.1:1 y
no alcanza para texto pequeño, así que los botones usan `rosa-honda` (6.4:1).

Descartes deliberados:

- **El amarillo dorado** que tenía la primera versión. A Clara no le gusta el amarillo.
- **La familia crema `#FFF8F0` + dorado apagado**: es el reflejo por defecto de todo diseño generado
  por IA y no dice nada de esta pareja en particular.

**Los tonos de los gajos (`--color-gajo-a/b/c`) van en `:root`, no en `@theme`.** Tailwind descarta
las variables de `@theme` que ninguna clase utility usa, y estas solo se leen desde `var()` dentro
del SVG. En `@theme` no llegaban al navegador y la rueda salía negra.

### Tipografía

- **Bricolage Grotesque** (display, botones, la rueda). Irregularidad deliberada; se lee hecho a mano
  sin caer en lo cursi.
- **EB Garamond** (la carta y la firma en itálica). El objeto es una carta, así que se compone como
  una carta, no como una interfaz.

Se descartó Fraunces, que era el primer instinto y es la display serif por defecto de todo diseño
generado por IA en este momento.

### Elemento distintivo: la rueda de feria

La rueda es lo único ruidoso de la app; todo lo demás queda callado alrededor. Lo que hace emocionar
a una ruleta real no es el giro, es el **clac-clac-clac** que se va espaciando mientras frena. Casi
ninguna ruleta web lo implementa, y por eso se sienten muertas.

- Clavijas en el aro, y una lengüeta que se flexiona de verdad al pasar cada clavija.
- Sonido de clac generado con la Web Audio API (osciladores, sin archivos de audio). Con control de
  silencio. Se inicializa en el toque de "Girar", que es el gesto de usuario que exigen los
  navegadores móviles para reproducir audio.
- Bombillas alrededor del aro que corren durante el giro y destellan al parar.
- Curva de frenado con cola larga, para que el último gajo se decida temblando.

**El premio sale de la propia rueda:** al frenar, el gajo ganador se enciende y revela su cita, y de
ahí se pasa a la tarjeta. No se inventa un objeto nuevo para el premio.

La ruleta lleva dos controles discretos en las esquinas: **Volver** a la izquierda, que regresa a la
carta, y el silenciador a la derecha. Volver se desactiva en cuanto la rueda arranca: el giro del mes
ya se está jugando y salirse a mitad dejaría el resultado a medias.

Si la cita salió repetida, la tarjeta se voltea sola ("Esa ya la tenías") y aparece el botón de
re-tirada. Ese golpe de decepción y segunda oportunidad es mejor minijuego que acertar a la primera.

### Fotos

Cinco fotos reales en `public/fotos/`. Se renombran a minúsculas con nombres descriptivos: Vercel
corre en Linux y las rutas con mayúsculas fallan ahí sin fallar en Windows. Todas se sirven con
`next/image`.

- Retrato de ella: pegado arriba de la carta, ligeramente girado, como con cinta.
- Fotos de mesa: fondo desenfocado y oscurecido en las etapas de sobre, ruleta y premio. Nunca
  compiten con el contenido.

- Mobile-first. Se verifica a 375px de ancho antes que en escritorio.
- Paleta cálida: durazno, crema, dorado suave. Fondo con corazones flotando.
- Tipografía con carácter para los títulos, legible para el cuerpo del mensaje.
- El mensaje de la carta aparece escribiéndose, con un ritmo que se pueda saltar tocando la pantalla.
- Confeti al confirmarse el premio.
- La tarjeta de premio nace del gajo ganador y lleva el icono, el título, la descripción, la fecha y
  el número de cumplemes. Está pensada para que ella le saque captura de pantalla.

- Se respeta `prefers-reduced-motion`: sin confeti, sin corazones, la rueda salta al resultado y el
  texto aparece completo.

### Los gajos no dicen qué son

Ningún gajo muestra su cita: todos llevan un **signo de interrogación** hasta que la rueda para. Solo
el ganador se revela, con su icono y su título, y se enciende en `rosa-honda` con borde `rosa-clara`.

Eso sostiene el suspenso, que es el punto del minijuego, y de paso resuelve un problema que quedaba
abierto: el pool crece 2 citas por mes (5 gajos el ciclo 1, 15 el ciclo 6, 27 el ciclo 12) y a 375px
de ancho los títulos dejan de entrar mucho antes de eso. Una incógnita siempre entra, por angosto que
sea el gajo. Solo hay que achicarla, y de eso se encarga `tamanoDeIncognita(total)`.

No hay nada que tocar al agregar citas.

### Iconos

Lucide (`lucide-react`), nunca emoji. Las citas guardan una clave semántica en `contenido.ts` y
`iconos.tsx` la traduce a componente, así que agregar una cita no obliga a tocar imports.

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

Checklist manual: abrir el sobre, leer la carta, girar, ver el premio, recargar la página y confirmar
que ya no deja girar, simular el mes siguiente y confirmar que vuelve a habilitarse.

## Fuera de alcance

Explícitamente **no** entra en esta versión:

- Fotos, galería, timeline de momentos, música de fondo.
- Backend, base de datos, sincronización entre dispositivos.
- Panel de administración. Las citas se agregan editando `contenido.ts` y redesplegando.
- Notificaciones o recordatorios del día 12.
