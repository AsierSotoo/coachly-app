const en = {
  nav: {
    home: 'Home',
    season: 'Season',
    stats: 'Stats',
    availability: 'Availability',
    profile: 'Profile',
  },
  dashboard: {
    emptyTitle: 'Start here',
    emptyBody: 'Create your team to track season statistics',
    emptyAction: 'Create my team',
    nextMatch: 'Next match',
    lastMatch: 'Last match',
    prepareSquad: 'Prepare squad',
    viewMatch: 'View match',
    noMatches: 'No matches recorded yet',
    noMatchesSub: 'Add the first match of the season',
    last5: 'Last 5',
    nextTraining: 'Next training',
    squad: 'Squad',
    seasonLabel: 'Season',
    players: (n: number) => `${n} players`,
    matches: (n: number) => `${n} matches`,
    noPlayers: 'No players',
    result: {
      win: 'Win', draw: 'Draw', loss: 'Loss',
    },
    streak: {
      wins: (n: number) => `${n}W in a row`,
      draws: (n: number) => `${n}D in a row`,
      losses: (n: number) => `${n}L in a row`,
    },
  },
  common: {
    noActiveSeason: 'No active season',
    add: 'Add',
    new: 'New',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
  },
} as const

export default en
export type Translations = typeof en
