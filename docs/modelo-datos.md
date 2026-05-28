# Modelo de datos — Coachly

Base de datos PostgreSQL (en Supabase). Este es el modelo del MVP. Los campos
marcados como *(futuro)* se dejan preparados pero no se usan todavía.

## Diagrama de relaciones

```
users (entrenadores)
  └─< teams (equipos)
        ├─< players (plantilla)
        └─< seasons (temporadas)
              └─< matches (partidos)
                    └─< appearances (participación de cada jugadora en cada partido)
                          └── enlaza con players
```

`<` significa "uno a muchos". `appearances` es la tabla intermedia entre
`players` y `matches` (relación muchos-a-muchos): una jugadora juega muchos
partidos, y en un partido participan muchas jugadoras.

## Tablas

### users
Entrenadores. La autenticación la gestiona Supabase Auth; esta tabla guarda el
perfil ligado a ese usuario.

| campo       | tipo      | notas                                  |
|-------------|-----------|----------------------------------------|
| id          | uuid (PK) | mismo id que el usuario de Supabase    |
| email       | text      |                                        |
| name        | text      | nombre del entrenador                  |
| created_at  | timestamp | por defecto, ahora                     |

### teams
Equipos. Un entrenador puede tener varios (p. ej. distintas categorías).

| campo       | tipo      | notas                                  |
|-------------|-----------|----------------------------------------|
| id          | uuid (PK) |                                        |
| user_id     | uuid (FK) | → users.id                             |
| name        | text      | nombre del equipo                      |
| category    | text      | p. ej. "Autonómica femenina"           |
| created_at  | timestamp |                                        |

### players
Plantilla de un equipo.

| campo       | tipo      | notas                                  |
|-------------|-----------|----------------------------------------|
| id          | uuid (PK) |                                        |
| team_id     | uuid (FK) | → teams.id                             |
| name        | text      | nombre de la jugadora                  |
| number      | int       | dorsal                                 |
| position    | text      | portera, defensa, centrocampista, etc. |
| active      | bool      | para bajas sin borrar histórico        |
| created_at  | timestamp |                                        |

### seasons
Temporadas de un equipo. Permite comparar año tras año.

| campo       | tipo      | notas                                  |
|-------------|-----------|----------------------------------------|
| id          | uuid (PK) |                                        |
| team_id     | uuid (FK) | → teams.id                             |
| name        | text      | p. ej. "2025/26"                       |
| created_at  | timestamp |                                        |

### matches
Partidos de una temporada.

| campo          | tipo      | notas                               |
|----------------|-----------|-------------------------------------|
| id             | uuid (PK) |                                     |
| season_id      | uuid (FK) | → seasons.id                        |
| opponent       | text      | nombre del rival                    |
| played_at      | date      | fecha del partido                   |
| home           | bool      | true = local, false = visitante     |
| competition    | text      | liga, copa, amistoso... (opcional)  |
| goals_for      | int       | goles del equipo                    |
| goals_against  | int       | goles del rival                     |
| created_at     | timestamp |                                     |

### appearances — EL CORAZÓN DEL MODELO
Una fila por cada jugadora que participa (o está convocada) en cada partido.
De aquí salen TODAS las estadísticas.

| campo          | tipo      | notas                               |
|----------------|-----------|-------------------------------------|
| id             | uuid (PK) |                                     |
| match_id       | uuid (FK) | → matches.id                        |
| player_id      | uuid (FK) | → players.id                        |
| starter        | bool      | titular (true) o suplente (false)   |
| minutes        | int       | minutos jugados (aprox.)            |
| goals          | int       | goles marcados                      |
| assists        | int       | asistencias                         |
| yellow_cards   | int       | tarjetas amarillas (0, 1 o 2)       |
| red_cards      | int       | tarjetas rojas (0 o 1)              |
| shots          | int       | *(futuro)* tiros                    |
| saves          | int       | *(futuro)* paradas (porteras)       |

## Estadísticas que se derivan (el "espejo")

Todas salen de consultar `appearances` cruzada con `matches` y `players`:

- **Goleadoras de la temporada**: sumar `goals` por `player_id`.
- **Asistencias**: sumar `assists` por `player_id`.
- **Reparto de minutos**: sumar `minutes` por `player_id` (¿juego con todas?).
- **Sanción por acumulación**: contar `yellow_cards`; avisar al llegar al límite.
- **Partidos jugados** por jugadora: contar `appearances` con `minutes > 0`.
- **Racha del equipo**: ordenar `matches` por fecha, comparar goles a favor/en
  contra para sacar victorias/empates/derrotas.
- **Goles a favor/en contra** de la temporada: sumar en `matches`.

## Seguridad (multi-tenant)

Cada entrenador solo debe ver y editar sus propios datos. En Supabase se hace
con **Row Level Security (RLS)**: políticas que filtran cada tabla por el
`user_id` del usuario autenticado, subiendo por las relaciones
(appearances → match → season → team → user). Detallar las políticas RLS al
crear las tablas.
