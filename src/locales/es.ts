const es = {
  // Nav
  nav: {
    home: 'Inicio',
    season: 'Temporada',
    stats: 'Stats',
    availability: 'Disponib.',
    profile: 'Perfil',
  },
  // Dashboard
  dashboard: {
    emptyTitle: 'Empieza aquí',
    emptyBody: 'Crea tu equipo para llevar las estadísticas de la temporada',
    emptyAction: 'Crear mi equipo',
    nextMatch: 'Próximo partido',
    lastMatch: 'Último partido',
    prepareSquad: 'Preparar convocatoria',
    viewMatch: 'Ver partido',
    noMatches: 'Sin partidos registrados aún',
    noMatchesSub: 'Añade el primer partido de la temporada',
    last5: 'Últimos 5',
    nextTraining: 'Próximo entrenamiento',
    squad: 'Plantilla',
    seasonLabel: 'Temporada',
    players: (n: number) => `${n} jugadoras`,
    matches: (n: number) => `${n} partidos`,
    noPlayers: 'Sin jugadoras',
    result: {
      win: 'Victoria', draw: 'Empate', loss: 'Derrota',
    },
    streak: {
      wins: (n: number) => `${n}V seguidas`,
      draws: (n: number) => `${n}E seguidas`,
      losses: (n: number) => `${n}D seguidas`,
    },
  },
  // Common
  common: {
    noActiveSeason: 'Sin temporada activa',
    add: 'Añadir',
    new: 'Nuevo',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Volver',
  },
} as const

export default es
export type Translations = typeof es
