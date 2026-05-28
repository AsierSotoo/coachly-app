# Coachly — contexto del proyecto

> Este archivo lo lee Claude Code automáticamente al abrir la carpeta.
> Es la fuente de verdad sobre QUÉ estamos construyendo y CÓMO.
> "Coachly" es el nombre en clave; el branding final se decidirá más adelante
> y no debe condicionar la arquitectura.

## Qué es Coachly

Una aplicación para que entrenadores de fútbol (masculino y femenino, el género
es indiferente para las estadísticas) lleven las estadísticas de su equipo a lo
largo de la temporada.

El primer usuario real será un entrenador de categoría autonómica femenina en
Navarra, pero **debe registrarse y usar la app como un usuario más**: no existe
ningún camino especial para él. La app está pensada para escalar a muchos
entrenadores (potencialmente de pago en el futuro).

## Principio rector

Diseñar para la realidad del entrenador de categoría autonómica: rellena los
datos **después del partido**, en pocos minutos, desde el móvil o el ordenador.
No hay analistas ni datos automáticos. Si registrar un partido es un coñazo,
nadie usará la app. Simplicidad y rapidez por encima de exhaustividad.

## Los tres bloques de la app

1. **El armario** (se configura una vez, se toca poco): equipo, plantilla,
   temporadas.
2. **El after del partido** (lo que se abre cada semana): ficha de partido con
   rival, resultado, dónde se jugó, y por cada jugadora: titular/suplente,
   minutos, goles, asistencias, tarjetas.
3. **El espejo** (solo lectura, lo que engancha): rankings y estadísticas que el
   entrenador no calcularía solo — máxima goleadora, sanciones por acumulación
   de tarjetas, reparto de minutos, racha del equipo, goles a favor/en contra.

## Alcance del MVP (primera versión)

DENTRO:
- Registro/login de entrenadores (cada uno ve solo sus datos).
- Crear y gestionar un equipo y su plantilla.
- Crear temporadas.
- Registrar partidos con el detalle por jugadora (la tabla `appearances`).
- Pantallas de estadísticas agregadas (el "espejo").

FUERA (de momento, con conocimiento de causa, NO por pereza):
- Posesión, tiros, mapas de calor y similares: no hay forma de capturarlos en
  esta categoría. Los campos quedan preparados para añadirse como opcionales.
- Convocatorias / disponibilidad / lesiones: idea aparcada para más adelante.
- App nativa en tiendas: empezamos en web. Ver sección de escalado.

## Stack técnico

- **Next.js (App Router) + TypeScript** — framework de la app web.
- **Supabase** — PostgreSQL + autenticación + API. Plan gratuito.
- **Tailwind CSS** — estilos.
- **Vercel** — despliegue, gratis, conectado a GitHub.

Razones: gratis para arrancar, es el stack moderno más demandado (vale para
porfolio), resuelve login y base de datos casi de fábrica, y permite el camino
web → PWA instalable → React Native sin tirar el código.

## Modelo de datos

Ver `docs/modelo-datos.md` para el detalle. Resumen de entidades:

- `users` (entrenadores) → `teams` → `players`
- `teams` → `seasons` → `matches`
- `matches` + `players` → `appearances` (tabla intermedia, una fila por
  jugadora y partido: ES EL CORAZÓN del modelo, de ella sale todo).

Todo cuelga de `users`: cada entrenador solo ve lo suyo (multi-tenant). En
Supabase esto se implementa con Row Level Security (RLS).

## Estrategia de escalado (no implementar aún, pero diseñar sin cerrarse puertas)

1. Web responsive (esta fase).
2. PWA: la misma web instalable en el móvil con icono propio.
3. React Native si algún día se quiere app nativa en las tiendas.

No tomar decisiones que bloqueen estos pasos (p. ej. mantener la lógica de
negocio separada de la interfaz).

## Cómo trabajar en este proyecto

- El dueño del proyecto es estudiante de DAW: entiende código, bases de datos y
  SQL, pero viene más de Java/PHP que de React. Explica las decisiones de React
  y TypeScript cuando no sean obvias.
- Ir **paso a paso**. No construir la app entera de golpe: avanzar por fases
  verificables (primero que arranque el proyecto, luego el modelo de datos,
  luego cada pantalla).
- Consultar las skills en `.claude/skills/` antes de tomar decisiones sobre
  estadísticas de fútbol o sobre el stack.

## Estado actual

Proyecto recién iniciado. Carpeta de contexto y skills preparadas. Siguiente
paso: inicializar el proyecto Next.js. Ver `docs/plan-de-fases.md`.
