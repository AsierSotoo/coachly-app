export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Team {
  id: string
  user_id: string
  name: string
  category: string | null
  created_at: string
}

export interface Player {
  id: string
  team_id: string
  name: string
  number: number | null
  position: string | null
  active: boolean
  created_at: string
}

export interface Season {
  id: string
  team_id: string
  name: string
  created_at: string
}

export interface Match {
  id: string
  season_id: string
  opponent: string
  played_at: string
  home: boolean
  competition: string | null
  goals_for: number
  goals_against: number
  created_at: string
}

export interface Appearance {
  id: string
  match_id: string
  player_id: string
  starter: boolean
  minutes: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  shots: number | null
  saves: number | null
}

// Tipo helper para las respuestas de Supabase — permite tipado genérico
export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at'>; Update: Partial<User> }
      teams: { Row: Team; Insert: Omit<Team, 'id' | 'created_at'>; Update: Partial<Team> }
      players: { Row: Player; Insert: Omit<Player, 'id' | 'created_at'>; Update: Partial<Player> }
      seasons: { Row: Season; Insert: Omit<Season, 'id' | 'created_at'>; Update: Partial<Season> }
      matches: { Row: Match; Insert: Omit<Match, 'id' | 'created_at'>; Update: Partial<Match> }
      appearances: { Row: Appearance; Insert: Omit<Appearance, 'id'>; Update: Partial<Appearance> }
    }
  }
}
