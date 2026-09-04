# Moyes Hub

Sistema personal en un solo sitio: tareas, hábitos, entrenamientos y finanzas.
React Native + Expo (managed), TypeScript, SQLite local. Sin backend, sin cuenta,
sin Play Store. Todo vive en el móvil.

Inspirada en *rimu*, pero con la parte que rimu no tiene: **los protocolos TDAH**.

---

## Estado actual

| Fase | Contenido | Estado |
|---|---|---|
| **1A** | Tareas + hábitos, Eisenhower, Kanban, Pomodoro, protocolos TDAH | **Terminada** |
| 1B | Entrenamientos, finanzas, notas con `[[enlaces]]` | Esquema de BD listo, sin UI |
| 2 | Google Calendar bidireccional (OAuth 2.0, `expo-auth-session`) | Bloqueada hasta probar 1A en el móvil |
| 3 | WhatsApp | Fuera de alcance — ver más abajo |

La Fase 2 **no se toca** hasta que confirmes que la 1A funciona en el OnePlus 11 5G real.

---

## Lo que hace la Fase 1A

**Hoy** — una única lista con tareas y hábitos mezclados. Un check por cosa.
Barra de progreso arriba y nada más: no hay decisiones que tomar al abrir la app.

**Foco** — Pomodoro. Puedes engancharlo a una tarea concreta. El reloj se calcula
contra la hora del sistema, no contando ticks: si Android congela el JS con la
pantalla apagada, al volver el tiempo restante sigue siendo el correcto.

**Tablero** — Kanban de 4 columnas (Pendiente / Hoy / En curso / Hecho).
Se mueve con flechas, no arrastrando: en móvil un arrastre falla más de lo que aporta.

**Matriz** — Eisenhower. Cuatro cuadrantes derivados de dos interruptores
(urgente, importante).

**Hábitos** — rachas de 14 días en rejilla. Puedes marcar días atrás.

**Bandeja** — lo capturado. Cada nota tiene dos salidas: se convierte en tarea o
se tira. No existe "dejarla ahí para siempre".

### Los tres protocolos TDAH

**1. INICIO.** Marcas una tarea como *bloqueada* y la app la parte: te ofrece
micro-pasos de 10 a 60 segundos calculados desde el título (`src/domain/microsteps.ts`).
Un diccionario de verbos en español, sin conexión y sin modelo de IA: funciona en
modo avión y responde al instante. Eliges uno y queda pegado a la tarea, visible
en la lista y en el Pomodoro.

**2. NOTA AL YO FUTURO.** Cuatro campos: qué / por qué / dónde / qué decir.
Solo *qué* es obligatorio. Accesible desde el rayo de la cabecera y, si lo activas
en Ajustes, desde una **notificación persistente** con un botón de texto: apuntas
sin desbloquear ni abrir la app.

**3. MENÚ DE DOPAMINA.** Botón "Qué hago ahora". Declaras energía 1-10 y devuelve
**exactamente tres** opciones, una por franja de duración (10-15 / 25 / 45+ min).
Criterio: energía → duración → antigüedad.
- Energía 8-10: el **sapo** (lo más largo y más podrido) va primero.
- Energía 1-3: nada de 45 minutos, solo arranque.
- Dentro de cada franja gana lo más viejo, con un empujón por cuadrante Eisenhower.
- Nunca devuelve lista vacía si hay algo pendiente: degrada de franja.

Tres opciones o ninguna. La elección infinita es parte del problema.

---

## Estructura

```
mobile/
  App.tsx                     arranque: abre la BD y monta el shell
  src/
    theme/                    paleta oscura + acento ámbar (un solo acento)
    db/
      schema.ts               DDL completo + migraciones por PRAGMA user_version
      database.ts             apertura única y migración
      types.ts
      repos/                  items, captures, pomodoro, energy, settings
    domain/                   lógica pura, testeable sin React ni SQLite
      dopamine.ts             Menú de Dopamina
      microsteps.ts           Protocolo INICIO
      eisenhower.ts           cuadrantes y pesos
      habits.ts               reglas de repetición
      dates.ts                fechas locales (nunca UTC)
    navigation/               contexto propio + drawer sobre Animated
    components/               ui.tsx, Sheet, ItemRow
    features/                 hojas: editor, dopamina, captura
    screens/                  Hoy, Foco, Tablero, Matriz, Hábitos, Bandeja, Ajustes
    notifications/            notificación persistente de captura
```

### Decisiones que conviene conocer

- **Tareas y hábitos comparten la tabla `items`.** La lista diaria es *una* consulta,
  no un merge en memoria de dos fuentes, y el Menú de Dopamina puntúa ambos con el
  mismo criterio.
- **Sin librería de navegación.** El drawer está hecho con `Animated` de React Native.
  Ahorra `react-native-reanimated` y `react-native-gesture-handler` — dos dependencias
  nativas menos que puedan romper el build de EAS por una animación de 220 ms.
- **Las tablas de entrenos, finanzas y notas ya existen** en la migración 1 aunque
  la Fase 1A no tenga pantallas para ellas. La Fase 1B solo añade UI: cero migraciones
  de datos ya guardados.
- **Fechas siempre locales** (`YYYY-MM-DD` desde `Date` local, nunca UTC): el día lo
  marca tu reloj, no Greenwich.

---

## Generar el APK e instalarlo en el OnePlus 11 5G

### Una vez, en el ordenador

```bash
cd mobile
npm install
npm install -g eas-cli
eas login                 # cuenta gratuita de Expo
eas init                  # crea el projectId y lo escribe en app.json
```

### Cada vez que quieras un APK nuevo

```bash
cd mobile
npm run typecheck         # que no salga nada
npm run build:apk         # = eas build --platform android --profile preview
```

La primera vez EAS pregunta por el *keystore*: responde **sí** a que lo genere y
lo guarde él. Es la firma de tu app — si la pierdes, una instalación futura no se
podrá actualizar encima y habrá que desinstalar primero.

El build tarda entre 10 y 20 minutos en la cola gratuita. Al acabar imprime una URL
y un QR.

### Instalar por sideload en el OnePlus

**Opción A — directa desde el móvil (la más rápida):**
1. Abre en el móvil la URL que dio EAS (o escanea el QR con la cámara).
2. Pulsa **Install** → descarga el `.apk`.
3. Android avisa: *"Por seguridad, tu teléfono no puede instalar apps desconocidas
   de esta fuente"*. Pulsa **Ajustes** → activa **Permitir de esta fuente** para
   Chrome (o el navegador que uses) → **Atrás**.
4. **Instalar** → **Instalar de todos modos** si aparece el aviso de Play Protect.

**Opción B — por cable, con ADB:**
```bash
# en el móvil: Ajustes > Información del teléfono > toca 7 veces "Número de compilación"
# luego: Ajustes > Sistema > Opciones de desarrollador > Depuración USB (ON)
adb devices                       # acepta la huella en el móvil
adb install -r ~/Descargas/moyes-hub.apk
```
`-r` reinstala encima conservando los datos, siempre que el APK esté firmado con el
mismo keystore.

**Opción C — build en tu propia máquina, sin cola:**
```bash
npm run build:apk:local           # necesita Android SDK + JDK 17 instalados
```

### Al abrir la app por primera vez

- Android 13+ pide permiso de notificaciones la primera vez que actives la
  notificación persistente en **Ajustes → Captura**. Dale a permitir o esa parte
  no funciona.
- En OxygenOS, para que la notificación persistente no la mate el sistema:
  *Ajustes → Batería → Uso de batería en apps → Moyes Hub → **Sin restricciones***.

### Actualizar la app más adelante

Sube `android.versionCode` en `app.json` (1 → 2 → 3…) antes de cada build nuevo,
y `version` cuando el cambio sea grande. Luego instala el APK encima: los datos
de SQLite se conservan.

---

## Desarrollo

```bash
npm start                 # servidor de Metro; se abre con Expo Go o el dev client
npm run typecheck         # TypeScript en modo strict
npm run bundle:check      # empaqueta como en producción, caza errores de import
```

Base de datos: `moyeshub.db`, en el almacenamiento privado de la app. Para
empezar de cero, desinstala e instala de nuevo.

---

## Fase 3 — WhatsApp (no implementada, y no lo estará en esta app)

Integrar WhatsApp **no se puede hacer solo desde el móvil**. Necesita:

1. Una cuenta de **WhatsApp Business Platform** (Cloud API) verificada por Meta,
   con un número dedicado que deja de servir para WhatsApp normal.
2. Un **servidor propio con URL pública y HTTPS** que reciba el webhook de Meta.
   Esta app es offline-first y no tiene backend: no hay dónde recibirlo.
3. Aprobación de **plantillas de mensaje** por parte de Meta para poder escribir
   fuera de la ventana de 24 horas.
4. Coste por conversación según la tarifa de Meta.

Es decir: infraestructura externa, coste recurrente y dependencia de la aprobación
de un tercero. Queda documentado aquí como trabajo futuro, deliberadamente fuera
del alcance de la app móvil.

Si algún día hace falta, el camino corto sería un backend mínimo (webhook →
cola → API) y que la app hable con ese backend, no con Meta.
