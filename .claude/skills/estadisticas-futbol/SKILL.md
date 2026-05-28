---
name: estadisticas-futbol
description: Define qué estadísticas de fútbol registra y calcula la app Coachly, y cómo se derivan del modelo de datos. Usar SIEMPRE que se trabaje en cualquier parte de Coachly relacionada con estadísticas, métricas, rankings, registro de partidos, participación de jugadoras, goles, asistencias, tarjetas, minutos o las pantallas de resumen de temporada. Consultar antes de diseñar formularios de registro de partido o pantallas de estadísticas, para no inventar métricas que no se pueden capturar ni omitir las importantes.
---

# Estadísticas de fútbol en Coachly

Esta skill define el QUÉ y el CÓMO de las estadísticas de la app. El contexto
general del proyecto está en `CLAUDE.md` y el modelo de datos en
`docs/modelo-datos.md` (raíz del proyecto).

## Principio

La app es para entrenadores de categoría autonómica (sin analistas ni datos
automáticos). Solo se registran datos que una persona puede anotar fácilmente
tras el partido. NO inventar métricas que requieran captura en vivo o medios
técnicos (posesión, distancia recorrida, mapas de calor, xG).

## Datos que SÍ se registran (por jugadora y partido, en `appearances`)

- **starter**: titular o suplente.
- **minutes**: minutos jugados (aproximados, el entrenador los estima).
- **goals**: goles marcados.
- **assists**: asistencias.
- **yellow_cards**: amarillas (0, 1 o 2 en un partido).
- **red_cards**: rojas (0 o 1).

A nivel de partido (en `matches`): rival, fecha, local/visitante, competición
(opcional), goles a favor y goles en contra.

## Datos preparados pero NO usados todavía (campos *futuro*)

`shots` (tiros) y `saves` (paradas, para porteras). Existen en el modelo por si
algún día se sube a categorías con más medios, pero no se piden en el formulario
del MVP.

## Estadísticas que se calculan (el "espejo")

Todas se derivan agregando `appearances` cruzada con `matches` y `players`.
NO se guardan precalculadas: se consultan en vivo.

| Estadística            | Cómo se calcula                                        |
|------------------------|--------------------------------------------------------|
| Goleadoras             | SUM(goals) agrupado por player_id, orden descendente   |
| Asistencias            | SUM(assists) por player_id                             |
| Reparto de minutos     | SUM(minutes) por player_id (detecta a quién juega poco)|
| Partidos jugados       | COUNT(appearances) con minutes > 0, por player_id      |
| Tarjetas acumuladas    | SUM(yellow_cards) por player_id; avisar cerca del límite|
| Goles a favor/contra   | SUM(goals_for), SUM(goals_against) en matches          |
| Racha (V/E/D)          | Por cada match: G_for>G_against=victoria, ==empate, <derrota |

## Reglas de negocio útiles

- **Sanción por amarillas**: en muchas competiciones, acumular cierto número de
  amarillas (p. ej. 5) implica un partido de sanción. El límite debe ser
  configurable; mostrar un aviso cuando una jugadora se acerca.
- **Roja = sanción**: una roja normalmente implica perderse el siguiente partido.
- **Validaciones de entrada**: minutos entre 0 y la duración del partido;
  amarillas 0–2; rojas 0–1; goles y asistencias no negativos.
- **Coherencia**: la suma de goles de las jugadoras en un partido no tiene por
  qué igualar goals_for (puede haber goles en propia puerta del rival), así que
  no forzar esa igualdad.

## Al construir pantallas

- **Registro de partido**: rápido. Lista de jugadoras con campos compactos.
  Permitir marcar titulares de un toque y dejar el resto en 0 por defecto.
- **Pantallas de estadísticas**: priorizar lo accionable para un entrenador
  (quién marca, quién juega poco, quién está a punto de sancionarse) por encima
  de tablas exhaustivas.
