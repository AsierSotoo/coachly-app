# Plan de fases — Coachly

Construir por fases verificables. No pasar a la siguiente hasta que la anterior
funcione. Cada fase debería terminar con algo que se pueda ver o probar.

## Fase 0 — Arranque del proyecto
- Inicializar proyecto Next.js (App Router) con TypeScript y Tailwind.
- Que arranque en local y se vea una página de bienvenida.
- Inicializar git y primer commit.
- **Verificación**: `npm run dev` muestra la app en el navegador.

## Fase 1 — Conexión con Supabase
- Crear el proyecto en Supabase (el dueño lo hace desde la web cuando se pida).
- Guardar las claves en variables de entorno (`.env.local`, NUNCA en git).
- Crear las tablas del modelo (`docs/modelo-datos.md`) con SQL.
- Activar Row Level Security con políticas por usuario.
- **Verificación**: las tablas existen y la app conecta sin errores.

## Fase 2 — Autenticación
- Registro e inicio de sesión de entrenadores (email/contraseña; opcional Google).
- Rutas protegidas: sin sesión, redirige al login.
- **Verificación**: el dueño puede registrarse y entrar como un usuario normal.

## Fase 3 — El armario
- Crear/editar/listar equipo y plantilla (jugadoras con dorsal y posición).
- Crear temporadas.
- **Verificación**: se puede montar el equipo del primer entrenador.

## Fase 4 — El after del partido
- Crear un partido (rival, fecha, local/visitante, resultado).
- Dentro del partido, registrar la participación por jugadora (la ficha rápida).
- **Verificación**: registrar un partido completo en pocos minutos.

## Fase 5 — El espejo
- Pantallas de estadísticas: goleadoras, asistencias, minutos, tarjetas, racha.
- **Verificación**: tras meter varios partidos, los rankings cuadran.

## Fase 6 — Pulido y despliegue
- Diseño limpio y usable en móvil.
- Convertir en PWA (instalable en el móvil).
- Desplegar en Vercel.
- **Verificación**: el entrenador la usa desde su móvil en un partido real.

## Más adelante (no ahora)
- Branding definitivo (nombre, logo, identidad visual).
- Convocatorias / disponibilidad / lesiones.
- Multi-equipo avanzado y comparación entre temporadas.
- App nativa con React Native si se justifica.
- Modelo de pago si hay tracción.
