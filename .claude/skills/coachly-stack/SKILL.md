---
name: coachly-stack
description: Define el stack técnico, las convenciones de código y las reglas de seguridad de la app Coachly. Usar SIEMPRE al escribir o modificar código del proyecto: al inicializar el proyecto, crear componentes de Next.js, escribir consultas o tablas en Supabase, configurar autenticación, gestionar variables de entorno, o tomar decisiones de arquitectura. Consultar antes de instalar dependencias o estructurar carpetas para mantener la coherencia y no romper el camino de escalado a PWA y móvil.
---

# Stack y convenciones de Coachly

El contexto del proyecto está en `CLAUDE.md` (raíz). Esta skill fija decisiones
técnicas para mantener coherencia.

## Stack

- **Next.js** con App Router y **TypeScript**.
- **Supabase**: base de datos PostgreSQL, autenticación y API.
- **Tailwind CSS** para estilos.
- **Vercel** para despliegue.

Usar siempre la versión estable más reciente de cada herramienta en el momento
de instalar. Verificar la documentación oficial actual antes de asumir comandos
o APIs concretas (cambian con frecuencia).

## Convenciones de código

- TypeScript en todo: tipar el modelo de datos (interfaces para Team, Player,
  Season, Match, Appearance que reflejen `docs/modelo-datos.md`).
- Separar la lógica de acceso a datos (consultas a Supabase) de los componentes
  de interfaz, en su propia capa (p. ej. `lib/` o `services/`). Esto protege el
  camino de escalado: la interfaz podrá cambiar (web → PWA → React Native) sin
  reescribir la lógica.
- Componentes pequeños y con un solo propósito.
- Nombres en inglés en el código (tablas, variables, funciones); textos de cara
  al usuario en español.
- Comentar solo lo que no sea evidente; el código se explica solo cuando se
  puede.

## Seguridad — IMPORTANTE

- **Nunca** subir claves, tokens ni contraseñas a git. Las claves de Supabase
  van en `.env.local`, que debe estar en `.gitignore`.
- Activar **Row Level Security (RLS)** en todas las tablas de Supabase desde el
  principio. Sin RLS, cualquier usuario podría leer datos de otros entrenadores.
  Las políticas filtran por el usuario autenticado subiendo por las relaciones.
- La clave de servicio (service_role) de Supabase NUNCA se usa en el navegador;
  solo en servidor si hiciera falta. En cliente, solo la clave pública (anon).
- Validar las entradas tanto en cliente (experiencia) como confiando en RLS y
  restricciones de la base de datos (seguridad real).

## Forma de trabajar

- Avanzar por las fases de `docs/plan-de-fases.md`, una a una, verificando.
- Explicar las decisiones de React/TypeScript que no sean obvias: el dueño viene
  de Java/PHP y está aprendiendo este stack.
- Antes de instalar una dependencia nueva, comprobar si Next.js o Supabase ya
  resuelven eso de fábrica, para no inflar el proyecto.
- Hacer commits pequeños y con mensajes claros en cada paso que funcione.
