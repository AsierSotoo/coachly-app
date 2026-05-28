# Coachly — cómo empezar

Esta carpeta es el punto de partida del proyecto. Contiene todo el contexto y
las skills para que Claude Code pueda construir la app entendiendo qué quieres.

## Qué hay aquí

```
coachly/
├── CLAUDE.md              ← Claude Code lo lee solo al arrancar. Contexto general.
├── README.md              ← este archivo (para ti).
├── .gitignore             ← evita subir claves y basura a git.
├── docs/
│   ├── modelo-datos.md    ← las tablas de la base de datos y sus relaciones.
│   └── plan-de-fases.md   ← el plan paso a paso para construir la app.
└── .claude/
    └── skills/
        ├── estadisticas-futbol/SKILL.md   ← qué se mide y cómo.
        └── coachly-stack/SKILL.md         ← tecnología y convenciones.
```

## Pasos para arrancar

1. **Instala Claude Code** si no lo tienes. Necesitas Node.js instalado primero.
   Busca la guía oficial actual de Anthropic para "Claude Code" (los comandos
   cambian, así que mejor la fuente oficial).

2. **Abre una terminal dentro de esta carpeta** (`coachly`).

3. **Arranca Claude Code** desde aquí. Al iniciarse leerá `CLAUDE.md` solo y
   tendrá todo el contexto.

4. **Primer mensaje sugerido** para darle:
   > "Lee CLAUDE.md, docs/ y las skills de .claude/skills/. Vamos a empezar por
   > la Fase 0 del plan de fases: inicializa el proyecto Next.js con TypeScript
   > y Tailwind, que arranque en local y haz el primer commit. Explícame cada
   > decisión por el camino, que vengo de Java/PHP."

## Sobre "que no me pregunte cada cosa"

Claude Code pregunta antes de ejecutar acciones (crear archivos, instalar cosas,
borrar) por seguridad. Puedes relajar eso, pero hazlo entendiendo el riesgo:
le estás dando permiso para ejecutar comandos en tu ordenador.

- Opción equilibrada (recomendada al principio): deja que pregunte, y verás qué
  hace en cada paso. Aprenderás más y es más seguro.
- Si te fía y quieres que vaya más solo: Claude Code tiene un modo de permisos
  más permisivo. Consulta su documentación oficial actual para la forma correcta
  de activarlo (no lo pongo aquí porque la opción concreta cambia entre
  versiones, y conviene que leas qué hace exactamente antes de activarla).

Mi recomendación: las primeras fases, déjalo preguntar. Cuando le cojas
confianza y entiendas el flujo, relaja los permisos.

## Crear la cuenta de Supabase

No hace falta todavía. En la Fase 1, Claude Code te dirá cuándo crearla y qué
claves copiar. Esas claves van en un archivo `.env.local` que NUNCA se sube a
git (ya está protegido en `.gitignore`).
