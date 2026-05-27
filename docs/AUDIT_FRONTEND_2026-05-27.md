# Audit Frontend 2026-05-27

## 0. Resumen ejecutivo

La base visual del producto sigue bien orientada al modo **Private Tournament Mode**: tokens, jerarquía deportiva, bottom chrome y piezas como `RankingCard`, `CountdownCard` o `GroupPredictionEditor` ya van en la dirección correcta del brandbook. El problema ahora no es de dirección estética, sino de **consistencia de ejecución**.

Los tres temas más graves son: una regresión masiva de codificación en la copia visible, una UI demasiado escrita para “fase de grupos en marcha” y no para todo el ciclo del torneo, y una capa de accesibilidad/focus que todavía depende demasiado del navegador en varios flujos críticos. Antes de empujar features grandes nuevas, conviene estabilizar esos tres frentes.

### Top-3 findings (post auditoría cruzada 2026-05-27)

- **F-001**: 🚫 **DESCARTADO** — falso positivo. La verificación cruzada (`Grep [ÃÂ]` + lectura directa de archivos citados) confirma UTF-8 limpio. Ver §12.
- **F-002 (P1, rebajado desde P0)**: varias pantallas asumen implícitamente que el torneo ya está en fase de grupos. No urgente hoy (el torneo aún no empieza) pero **bloqueante antes de junio 2026**.
- **F-004 (P1)**: la experiencia de teclado/focus visible es inconsistente en navegación, filtros, formularios y acciones de predicciones.

> **Total post-triage**: 0 P0 / 11 P1 / 5 P2 / 1 descartado.

---

## 1. Chrome global

El chrome global tiene buena base: superficie oscura, blur inferior, card chrome consistente y safe mobile spacing razonable. Los problemas aquí están más en semántica, i18n y detalle operativo que en la dirección visual.

### F-003 — Locale global y metadata siguen en inglés

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `app/layout.tsx:15-29`
- **Brandbook**: §12, §19
- **Impacto**: el `lang="en"` y la metadata en inglés desalinean accesibilidad, SEO y percepción de producto en una app ya traducida al castellano.
- **Propuesta**: cambiar `lang` a `es`, traducir `title` y `description`, y revisar metadata social para que no vuelva a introducir inglés en el shell global.

### F-007 — Bottom navigation sin semántica activa sólida ni ajuste real a safe area

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/layout/BottomNav.tsx:60-88`; `components/ui/AppToaster.tsx:23-27`
- **Brandbook**: §15
- **Impacto**: el estado activo es principalmente visual; falta `aria-current="page"` en los enlaces activos y el offset del toaster está hardcodeado (`96px`) en vez de responder a `env(safe-area-inset-bottom)`.
- **Propuesta**: añadir `aria-current="page"` al item activo, reforzar `focus-visible` en cada tab y sustituir offsets fijos por una estrategia CSS-safe-area compartida entre `BottomNav` y toasts.

### F-013 — Hay client-side evitable en el chrome protegido

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/layout/HeaderMinimal.tsx:1-20`; `app/(protected)/layout.tsx:49-67`
- **Brandbook**: §15
- **Impacto**: `HeaderMinimal` se convierte en client component solo para ocultarse en `/profile` vía `usePathname()`. Eso añade JS al shell protegido completo sin necesidad funcional real.
- **Propuesta**: resolver la variante de header desde el layout/segmento del servidor o con layouts por subruta, manteniendo el header minimal como server component.

---

## 2. Inicio

`/home` conserva una jerarquía visual clara y una buena secuencia de bloques. La pantalla falla sobre todo en coherencia temporal y confianza del dato.

### F-002 — La home está escrita para un único momento del torneo

- **Prioridad**: P0
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/dashboard/page.tsx:292-302`; `app/(protected)/dashboard/page.tsx:315-366`; `app/(protected)/dashboard/page.tsx:128-155`
- **Brandbook**: §11.1, §12
- **Impacto**: textos como “Los grupos ya están en juego” o “El tablero del trofeo ya está marcando el ritmo” dejan de tener sentido en pre-torneo, durante knockouts o post-final.
- **Propuesta**: derivar la microcopy principal de estado real (`matches`, `game_locks`, `points`, `ranking`) y definir al menos cuatro variantes editoriales: pre-torneo, fase de grupos, eliminatorias y cierre final.

### F-012 — La actividad reciente sigue siendo placeholder aunque ya entran datos reales

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/dashboard/page.tsx:51-62`; `app/(protected)/dashboard/page.tsx:358-389`
- **Brandbook**: §11.1, §12
- **Impacto**: la tarjeta transmite “demo copy” incluso con sync y scoring funcionando; eso erosiona la sensación de producto vivo.
- **Propuesta**: o bien conectar esta sección a eventos reales del torneo/usuarios, o convertirla explícitamente en empty state elegante hasta que exista feed real.

---

## 3. Predicciones

La superficie de grupos está bien resuelta en arquitectura visual: editor por grupo, barra sticky, estados y CTA. Los riesgos están en accesibilidad, copy y onboarding.

### F-008 — El Group Navigator ha perdido parte del chrome §15 y su semántica activa es débil

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/worldcup/GroupNavigator.tsx:117-152`
- **Brandbook**: §5, §11.5, §15
- **Impacto**: el sticky navigator funciona, pero visualmente se acerca más a una banda utilitaria que a una pieza chrome del producto; además usa `aria-current="true"` en botones, que no es la semántica más clara para un control de selección/posición.
- **Propuesta**: devolverle una superficie más “chrome” (elevated/dark blur o card-lite), mantener acento solo en border/ring, y revisar la semántica hacia `aria-pressed` o patrón de tabs/segmented control según la intención final.

### F-009 — El tour de Predicciones puede “quemarse” sin enseñar nada útil

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/onboarding/OnboardingTour.tsx:95-123`; `lib/onboarding/tours.ts:44-59`; `app/(protected)/predictions/page.tsx:137-164`
- **Brandbook**: §12
- **Impacto**: si un step no encuentra target, `OnboardingTour` avanza; si ya no encuentra más, marca el tour como `done`. En la pestaña Knockout, los targets `group-navigator` y `save-button` no existen, así que el primer onboarding de Predicciones puede autocompletarse sin educar realmente.
- **Propuesta**: separar tours por subtab o resolver steps condicionales por contexto, y no marcar `done` cuando el tour se quedó sin targets válidos durante una sesión incompleta.

---

## 4. Partidos

`/matches` mantiene bien el tono móvil y la legibilidad de tarjetas. Aquí el mayor problema no es de layout, sino de credibilidad del copy y detalle de interacción.

### F-012 — La premium card de partido sigue vendiendo “fases posteriores” ya superadas

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `components/worldcup/MatchCard.tsx:165-175`
- **Brandbook**: §11.3, §12
- **Impacto**: el footer premium todavía dice que las capas de pronóstico y puntos “llegarán en fases posteriores”, pero la app ya tiene predicciones, ranking y puntos. La tarjeta parece desactualizada respecto al producto real.
- **Propuesta**: reemplazar ese copy por contexto útil de partido (bloqueo de fase, contexto de grupo, relevancia del cruce, ventana de predicción o impacto potencial en clasificación).

---

## 5. Clasificación

La clasificación sigue siendo el bloque visual más potente del frontend. El problema no es la intención hero, sino la accesibilidad semántica y la adaptación al ciclo completo del torneo.

### F-011 — La clasificación es visualmente fuerte, pero semánticamente plana

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/worldcup/RankingTable.tsx:72-131`; `components/worldcup/RankingTable.tsx:206-259`
- **Brandbook**: §11.7
- **Impacto**: el contenido se entiende visualmente, pero lectores de pantalla no reciben una estructura tipo ranking/lista/tabla con relaciones claras entre posición, jugador, puntos y gap.
- **Propuesta**: mantener el look card-first, pero introducir semántica de lista ordenada o tabla accesible para las filas y el podio, con labels más explícitos para posición, puntos y distancia.

### F-002 — La narrativa de Ranking también está anclada a fase de grupos

- **Prioridad**: P0
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/ranking/page.tsx:68-71`; `app/(protected)/ranking/page.tsx:97-100`; `components/worldcup/RankingCard.tsx:114-157`
- **Brandbook**: §11.7, §12
- **Impacto**: la home puede sobrevivir con copy temporal, pero en `Ranking` esto pesa más porque es la pantalla hero. Cuando el torneo pase a eliminatorias o termine, varios textos seguirán hablando del grupo-stage como si fuera el estado central del producto.
- **Propuesta**: definir estados editoriales por fase para `RankingPage`, `RankingCard`, stamps vacíos y gap copy.

---

## 6. Perfil

`/profile` ha ganado mucha funcionalidad y ahora sí parece una página importante. Aun así, es la pantalla con más deuda combinada de accesibilidad, copy y focus treatment.

### F-004 — Los controles críticos de perfil no tienen un sistema de focus visible consistente

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/profile/page.tsx:124-129`; `app/(protected)/profile/page.tsx:225-249`; `app/(protected)/profile/page.tsx:313-349`; `components/profile/AvatarUploadForm.tsx:70-109`
- **Brandbook**: §15
- **Impacto**: varios botones y campos usan `outline-none` o dependen solo del cambio de borde/hover. En móvil táctil pasa desapercibido, pero en teclado se pierde claridad de foco.
- **Propuesta**: normalizar `focus-visible` con outline/ring de sistema en botones, segmented controls, grid de avatares, inputs y CTAs secundarios.

### F-014 — La selección de escudo de equipo es visualmente clara, pero poco expresiva para tecnología asistiva

- **Prioridad**: P2
- **Esfuerzo**: S
- **Evidencia**: `app/(protected)/profile/page.tsx:223-249`
- **Brandbook**: §11.5, §12
- **Impacto**: el estado seleccionado vive casi por completo en el aro cian. Falta semántica explícita como `aria-pressed`, `aria-current` o descripción de selección actual.
- **Propuesta**: convertir el grid en un patrón de toggle group o radio group semántico, manteniendo el look actual.

---

## 7. Estados transversales (empty/loading/error/locked/saved/toasts)

El sistema de estados va en la dirección correcta: ya no hay “No data” plano y existe un tono editorial común. La deuda está en repetición, accesibilidad y coherencia de ejecución.

### F-005 — Los banners inline de error/success/saved no se anuncian de forma accesible

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `app/(auth)/login/page.tsx:49-52`; `app/(protected)/profile/page.tsx:139-154`; `components/worldcup/GroupPredictionEditor.tsx:223-241`
- **Brandbook**: §12
- **Impacto**: hay feedback visible, pero no `role="alert"` ni regiones `aria-live`. Un usuario con lector de pantalla puede no enterarse del error o del guardado sin explorar manualmente la página.
- **Propuesta**: promover mensajes inline críticos a `role="alert"`/`aria-live="polite"` según severidad y unificar patrón para success/error/saved.

### F-016 — Los estados vacíos y de carga repiten demasiado la misma voz

- **Prioridad**: P2
- **Esfuerzo**: S
- **Evidencia**: `components/ui/StateCard.tsx:39-41`; `app/(protected)/calendar/page.tsx:177-181`; `components/worldcup/RankingTable.tsx:263-266`; `app/(protected)/loading.tsx:1-4`
- **Brandbook**: §12
- **Impacto**: la voz es mejor que la de una app genérica, pero demasiados estados reutilizan “Tu torneo empieza aquí” o una variación muy cercana aunque el usuario ya lleve tiempo jugando.
- **Propuesta**: introducir una segunda capa editorial por contexto y momento del torneo para vacíos, errores y skeleton titles.

### F-017 — La autenticación mezcla toast moderno con banner legacy

- **Prioridad**: P2
- **Esfuerzo**: S
- **Evidencia**: `components/auth/AuthToastSurface.tsx:30-54`; `app/(auth)/login/page.tsx:49-52`
- **Brandbook**: §12, §15
- **Impacto**: el flujo de login ya se apoya en toasts, pero la página sigue mostrando un banner inline cuando llega `?error=`. El resultado es un sistema doble de feedback.
- **Propuesta**: decidir una sola jerarquía: toast para eventos de auth y banner solo para errores de pantalla o de guardia de ruta.

---

## 8. Accesibilidad

### Hallazgos clave

- El contraste general sobre superficies oscuras es bueno en `text-secondary`, `accent-primary`, `warning`, `success` y `live`.
- El contraste **no** es suficiente en `text-disabled` sobre `surface-card`.
- No hay indicios de focus trap en coach marks: `Popover.Root modal={false}` es una buena decisión.
- La navegación por teclado existe, pero la calidad del focus visible es irregular según pantalla.

### F-004 — Focus visible inconsistente en controles principales

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/layout/BottomNav.tsx:72-88`; `app/(protected)/calendar/page.tsx:72-80`; `components/worldcup/GroupPredictionEditor.tsx:144-155`; `components/onboarding/CoachMark.tsx:66-82`
- **Brandbook**: §15
- **Impacto**: algunos controles clave mantienen affordance táctil, pero no visualizan bien el foco al navegar con teclado.
- **Propuesta**: añadir un patrón común `focus-visible:outline/ring` a enlaces de navegación, filtros, save buttons, CTAs secundarios y coach-mark buttons.

### F-005 — El feedback de estado no se anuncia

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `app/(protected)/profile/page.tsx:139-154`; `components/worldcup/GroupPredictionEditor.tsx:223-241`; `app/(auth)/login/page.tsx:49-52`
- **Brandbook**: §12
- **Impacto**: save/error/validation messages pueden pasar desapercibidos para usuarios con lector de pantalla.
- **Propuesta**: usar `role="alert"` o `aria-live` según severidad y centralizar el patrón.

### F-006 — `text-disabled` no cumple AA en superficies oscuras

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `app/globals.css:14`; uso en `components/worldcup/GroupNavigator.tsx:134`; uso en `components/worldcup/GroupPredictionEditor.tsx:148`
- **Brandbook**: §18
- **Impacto**: el contraste aproximado de `#64748b` sobre `#111827` es **3.73:1**, insuficiente para texto normal AA.
- **Propuesta**: elevar el token `text-disabled` o restringir su uso a texto grande/no esencial y mover estados disabled clave a un color con ratio AA.

### F-011 — Ranking necesita una semántica más navegable

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/worldcup/RankingTable.tsx:206-259`
- **Brandbook**: §11.7
- **Impacto**: hoy es comprensible a ojo, pero no comunica tan bien la estructura de ranking a tecnologías asistivas.
- **Propuesta**: usar `ol/li`, `table`, o al menos roles/labels equivalentes conservando el look visual.

### F-014 — La grid de avatares debería exponer selección semántica

- **Prioridad**: P2
- **Esfuerzo**: S
- **Evidencia**: `app/(protected)/profile/page.tsx:223-249`
- **Brandbook**: §12
- **Impacto**: la selección actual depende del aro cian y no de un patrón explícito para lectores de pantalla.
- **Propuesta**: exponer estado seleccionado con semántica de toggle/radio group.

---

## 9. Performance móvil

### Observaciones

- El proyecto usa muchos server components en páginas, lo cual es bueno.
- Las imágenes relevantes suelen tener `width/height` definidos, lo que mitiga CLS.
- La capa client no es descontrolada, pero sí se está acumulando alrededor de helpers pequeños y de infra compartida.
- Footprint aproximado instalado:
  - `sonner`: ~161.9 KB en `node_modules` instalado
  - `@radix-ui/react-popover`: ~89.2 KB en `node_modules` instalado
  - esto **no** es bundle real transferido, pero sí indica que el coste no es cero

### F-013 — Hay baseline client innecesario en pantallas con listas de partidos y ranking

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/worldcup/LocalKickoff.tsx:1-43`; `components/worldcup/TeamBadge.tsx:1-33`; `components/layout/HeaderMinimal.tsx:1-20`; `components/ui/AppToaster.tsx:1-27`
- **Brandbook**: §15
- **Impacto**: `/matches`, `/ranking` y partes de `/predictions` hidratan helpers pequeños repetidos por tarjeta/fila. No es un colapso, pero sí una erosión de performance móvil evitable.
- **Propuesta**: reducir client wrappers que no aportan interacción compleja, mover decisiones simples al servidor y lazy-mount de infra cuando sea viable.

### Notas de auditoría

- **LCP**: los riesgos principales están en listas con muchas banderas/escudos (`TeamBadge`) y en ranking con avatares múltiples.
- **CLS**: no veo una alarma roja ahora mismo; las imágenes suelen reservar tamaño. El sticky navigator no parece introducir salto estructural grande al estar en flujo.
- **Balance Server/Client**: razonable, pero con margen claro en `HeaderMinimal`, `TeamBadge`, `LocalKickoff` y la capa de tours/toasts siempre montada.

---

## 10. Estados del torneo en el tiempo

### Matriz de coherencia temporal

| Estado | Coherencia actual | Problema dominante |
|---|---|---|
| Pre-torneo | Media-baja | Home y Ranking hablan como si la carrera ya estuviera caliente. |
| Durante grupos | Alta | Es el estado para el que más copy se ha optimizado. |
| Durante eliminatorias | Media | Predicciones y bracket aguantan mejor que Home y Ranking. |
| Post-final | Baja | Falta cierre editorial tipo hall of fame; sobreviven CTAs y copies de fase viva. |

### F-002 — La experiencia no mantiene coherencia a lo largo del torneo completo

- **Prioridad**: P0
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/dashboard/page.tsx:292-309`; `app/(protected)/dashboard/page.tsx:315-352`; `app/(protected)/ranking/page.tsx:68-71`; `components/worldcup/MatchCard.tsx:172-175`
- **Brandbook**: §11, §12
- **Impacto**: el usuario puede sentir que el producto “sigue en modo previa/grupos” incluso cuando la data ya está en knockout o fin de torneo.
- **Propuesta**: introducir una capa de presentation state del torneo reutilizable por páginas, que gobierne headings, CTAs, empty states y hero copy.

### F-012 — Los placeholders vivos chocan más cuanto más avanza el torneo

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `app/(protected)/dashboard/page.tsx:51-62`; `app/(protected)/dashboard/page.tsx:358-389`
- **Brandbook**: §12
- **Impacto**: en post-final o incluso en grupos avanzados, un feed placeholder y copies “empieza a calentarse” dejan de sonar naturales.
- **Propuesta**: conectar la narrativa de actividad y top summaries al estado real del torneo o apagarlas elegantemente cuando no haya fuente.

---

## 11. Onboarding tours

### Evaluación rápida por tour

| Tour | ¿Target visible en primera carga? | Observación |
|---|---|---|
| `home` | Sí | útil, aunque el step de bottom nav es algo obvio |
| `predictions` | No siempre | en Knockout faltan targets de grupos |
| `matches` | Sí | correcto y bastante útil |
| `ranking` | Sí | copy con leak en inglés |
| `profile` | Sí | útil, pero algo funcional/obvio |

### F-009 — El motor del tour da por completada una experiencia incompleta

- **Prioridad**: P1
- **Esfuerzo**: M
- **Evidencia**: `components/onboarding/OnboardingTour.tsx:95-123`
- **Brandbook**: §12
- **Impacto**: al no encontrar targets siguientes, el tour se marca como `done`. Eso impide reenseñar la experiencia cuando sí haya targets visibles.
- **Propuesta**: distinguir “tour completado” de “tour interrumpido por target ausente”.

### F-010 — Algunos steps se quedan en lo obvio o rompen el tono/localización

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `lib/onboarding/tours.ts:17-29`; `lib/onboarding/tours.ts:73-87`
- **Brandbook**: §12
- **Impacto**: hay steps útiles, pero otros explican chrome básico en vez de la primera tarea real del usuario. Además, `ranking` mantiene “Gold, silver, bronze.” en inglés.
- **Propuesta**: reescribir tours para que cada uno explique la primera decisión real del usuario, no solo el layout.

### F-015 — El coach mark puede tapar contenido crítico en móvil compacto

- **Prioridad**: P2
- **Esfuerzo**: M
- **Evidencia**: `components/onboarding/CoachMark.tsx:47-55`; `components/onboarding/CoachMark.tsx:85`
- **Brandbook**: §15
- **Impacto**: el panel de `320px` centrado y con solo flip `top/bottom` puede cubrir zonas activas en 360px, especialmente sobre cards altas o grids densas.
- **Propuesta**: añadir reglas de colisión/alineación más finas y revisar visualmente en `/ranking`, `/profile` y `/predictions` móvil.

---

## 12. i18n consistency

### F-001 — La app tiene una regresión general de codificación en la copia

- **Estado**: 🚫 **DESCARTADO — falso positivo verificado por auditoría cruzada (2026-05-27)**
- **Verificación**: `Grep` con regex `[ÃÂ]` sobre `app/`, `components/` y `lib/` devolvió **cero matches**. Lectura directa de los archivos citados como evidencia (`dashboard/page.tsx:54-60`, `AuthToastSurface.tsx:32-53`) muestra UTF-8 limpio: `"Sesión iniciada"`, `"contraseña incorrectos"`, `"clasificación"`, etc.
- **Hipótesis de la causa**: el agente que generó el audit leyó los archivos a través de un terminal / IDE configurado con encoding Latin-1, lo que decodifica las secuencias UTF-8 de dos bytes (`ó`, `ñ`, `·`) como `Ã³`, `Ã±`, `Â·`. La fuente está bien; la lectura era el problema.
- **Acción**: ninguna. Este finding se mantiene en el documento como registro de auditoría cruzada y queda excluido de la tabla maestra priorizada.

Hallazgo original (preservado para referencia):

- **Prioridad**: ~~P0~~
- **Esfuerzo**: ~~M~~
- **Evidencia**: `app/(protected)/dashboard/page.tsx:54-60`; `app/(protected)/calendar/page.tsx:105`; `components/worldcup/GroupPredictionEditor.tsx:132-155`; `components/layout/BottomNav.tsx:46`; `components/auth/AuthToastSurface.tsx:32-53`; `lib/onboarding/tours.ts:17-87`
- **Brandbook**: §12, §19
- **Impacto**: la identidad del producto cae de inmediato cuando la UI muestra `sesiÃ³n`, `clasificaciÃ³n`, `prÃ³ximo`, `aquÃ­`, `Â·`, etc. Esto ya no es polish: rompe percepción de calidad.
- **Propuesta**: normalizar todos los archivos UI a UTF-8, barrer cadenas corruptas con búsqueda automatizada y añadir un check CI simple contra patrones `Ã` / `Â` en `app`, `components` y `lib` de UI.

### F-003 — La capa raíz sigue presentando el producto en inglés

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `app/layout.tsx:16-18`; `app/layout.tsx:27-29`
- **Brandbook**: §12
- **Impacto**: aunque la app visible esté en castellano, el shell documental sigue en inglés.
- **Propuesta**: alinear `lang`, metadata y cualquier resto global con `es-ES`.

### F-010 — Aún se escapan restos de inglés y copy no totalmente peninsular

- **Prioridad**: P1
- **Esfuerzo**: S
- **Evidencia**: `lib/onboarding/tours.ts:75`; `app/layout.tsx:16-18`
- **Brandbook**: §12
- **Impacto**: no es un problema masivo, pero sí un indicio de traducción a medio cerrar.
- **Propuesta**: cerrar un barrido final de copy con checklist de i18n consistency y revisión editorial humana.

---

## 13. Tabla maestra priorizada

| ID | Prioridad | Esfuerzo | Sección | Hallazgo | Evidencia principal | Brandbook | Propuesta concreta |
|---|---|---:|---|---|---|---|---|
| ~~F-001~~ | 🚫 | — | 12 | ~~Regresión de codificación en la copia visible~~ — **DESCARTADO falso positivo** | — | — | Sin acción. Ver detalle en §12. |
| F-002 | P1 | M | 10 | La UI está escrita para un único momento del torneo (rebajado de P0 a P1 por auditoría cruzada — el torneo aún no ha empezado, hoy el copy es coherente; sí es urgente antes de junio 2026) | `dashboard/page.tsx:292-309`; `ranking/page.tsx:68-71` | §11, §12 | Derivar hero/CTA/empty copy del estado real del torneo. |
| F-003 | P1 | S | 1 / 12 | `lang` y metadata globales siguen en inglés | `app/layout.tsx:15-29` | §12, §19 | Traducir metadata y cambiar `lang` a `es`. |
| F-004 | P1 | M | 6 / 8 | Focus visible inconsistente en navegación, formularios y CTAs | `BottomNav.tsx:72-88`; `profile/page.tsx:313-349`; `CoachMark.tsx:66-82` | §15 | Crear patrón global de `focus-visible` y aplicarlo a controles críticos. |
| F-005 | P1 | S | 7 / 8 | Banners inline no se anuncian accesiblemente | `login/page.tsx:49-52`; `profile/page.tsx:139-154`; `GroupPredictionEditor.tsx:223-241` | §12 | Añadir `role="alert"` / `aria-live` según severidad. |
| F-006 | P1 | S | 8 | `text-disabled` no cumple AA sobre superficies oscuras | `globals.css:14`; `GroupNavigator.tsx:134`; `GroupPredictionEditor.tsx:148` | §18 | Ajustar token o limitar su uso en texto crítico. |
| F-007 | P1 | M | 1 | Bottom nav sin semántica activa sólida ni safe area real | `BottomNav.tsx:60-88`; `AppToaster.tsx:23-27` | §15 | Añadir `aria-current`, reforzar focus y usar safe-area CSS compartida. |
| F-008 | P1 | M | 3 | Group navigator funcional pero poco “chrome” y semántica mejorable | `GroupNavigator.tsx:117-152` | §5, §11.5, §15 | Recuperar tratamiento chrome y revisar patrón semántico de selección. |
| F-009 | P1 | M | 3 / 11 | Onboarding puede marcarse done sin completar experiencia | `OnboardingTour.tsx:95-123` | §12 | Separar “done” de “target ausente / tour incompleto”. |
| F-010 | P1 | S | 11 / 12 | Tours con targets obvios, leak en inglés y tono irregular | `tours.ts:17-29`; `tours.ts:73-87` | §12 | Reescribir tours hacia primeras tareas reales y cerrar barrido de copy. |
| F-011 | P1 | M | 5 / 8 | Ranking muy visual, poco semántico para assistive tech | `RankingTable.tsx:72-131`; `RankingTable.tsx:206-259` | §11.7 | Añadir semántica de lista/tabla manteniendo diseño actual. |
| F-012 | P1 | M | 2 / 4 / 10 | Placeholder/outdated copy resta credibilidad al dato vivo | `MatchCard.tsx:165-175`; `dashboard/page.tsx:51-62`; `dashboard/page.tsx:358-389` | §11.1, §11.3, §12 | Sustituir roadmap copy y feed placeholder por contexto real o apagado elegante. |
| F-013 | P1 | M | 1 / 9 | Baseline client evitable en chrome, fechas y badges de equipo | `HeaderMinimal.tsx:1-20`; `LocalKickoff.tsx:1-43`; `TeamBadge.tsx:1-33` | §15 | Reducir wrappers client y mover decisiones simples al servidor. |
| F-014 | P2 | S | 6 / 8 | La selección de avatar por escudo necesita semántica explícita de selección | `profile/page.tsx:223-249` | §12 | Exponer selección con patrón de toggle/radio group y label adecuado. |
| F-015 | P2 | M | 11 | Coach mark puede tapar contenido crítico en 360px | `CoachMark.tsx:47-55`; `CoachMark.tsx:85` | §15 | Ajustar colisión/alineación y revisar móvil real por pantalla. |
| F-016 | P2 | S | 7 | Estados vacíos/carga/error repiten demasiado la misma voz | `StateCard.tsx:39-41`; `calendar/page.tsx:177-181`; `RankingTable.tsx:263-266` | §12 | Crear variantes editoriales por contexto y momento del torneo. |
| F-017 | P2 | S | 7 | Auth mezcla toast nuevo con banner legacy | `AuthToastSurface.tsx:30-54`; `login/page.tsx:49-52` | §12, §15 | Unificar jerarquía de feedback en auth. |
