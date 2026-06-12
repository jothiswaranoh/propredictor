export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  country: string;
  founded: number;
  stadium: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  venue: string;
  competition: string;
  status: 'upcoming' | 'live' | 'completed' | 'postponed';
  homeScore?: number;
  awayScore?: number;
  rawDate: string;
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predictedWinner: 'home' | 'away' | 'draw';
  createdAt: string;
  points?: number;
  isCorrect?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  points: number;
  predictions: number;
  accuracy: number;
}
