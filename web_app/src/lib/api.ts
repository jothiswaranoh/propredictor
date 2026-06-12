const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';
  return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
};
const BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, ...init } = options;
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'API request failed');
  }

  return data as T;
}

export const api = {
  // Auth API
  async login(email: string, password: string) {
    const data = await request<{ access_token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password }),
      requiresAuth: false,
    });
    localStorage.setItem('token', data.access_token);

    // Fetch profile immediately
    const userProfile = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(userProfile));
    return userProfile;
  },

  async signup(name: string, email: string, password: string) {
    return request<any>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: password }),
      requiresAuth: false,
    });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    return request<any>('/api/users/me');
  },

  updateProfile(name: string) {
    return request<any>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  updatePassword(newPassword: string) {
    return request<any>('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  // User Matches & Predictions
  getMatches() {
    return request<any[]>('/api/matches');
  },

  getActiveMatches() {
    return request<any[]>('/api/matches/active');
  },

  submitPrediction(matchId: string, winningTeamId: string | null) {
    return request<any>(`/api/predictions/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ winning_team_id: winningTeamId }),
    });
  },

  getPredictionHistory() {
    return request<any[]>('/api/predictions/history');
  },

  getLeaderboard() {
    return request<{ leaderboard: any[] }>('/api/leaderboard');
  },

  // Admin APIs
  // Teams
  adminGetTeams() {
    return request<any[]>('/api/admin/teams');
  },

  adminCreateTeam(name: string, shortName: string, logoUrl: string) {
    return request<any>('/api/admin/teams', {
      method: 'POST',
      body: JSON.stringify({ name, short_name: shortName, logo_url: logoUrl }),
    });
  },

  adminUpdateTeam(id: string, name?: string, shortName?: string, logoUrl?: string, active?: boolean) {
    return request<any>(`/api/admin/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, short_name: shortName, logo_url: logoUrl, active }),
    });
  },

  adminDeleteTeam(id: string) {
    return request<void>(`/api/admin/teams/${id}`, {
      method: 'DELETE',
    });
  },

  // Matches
  adminGetMatches() {
    return request<any[]>('/api/admin/matches');
  },

  adminCreateMatch(data: {
    team1_id: string;
    team2_id: string;
    match_date: string;
    prediction_open_time: string;
    prediction_close_time: string;
    status?: string;
  }) {
    return request<any>('/api/admin/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adminUpdateMatch(id: string, data: {
    team1_id?: string;
    team2_id?: string;
    match_date?: string;
    prediction_open_time?: string;
    prediction_close_time?: string;
    status?: string;
    winning_team_id?: string | null;
  }) {
    return request<any>(`/api/admin/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  adminDeleteMatch(id: string) {
    return request<void>(`/api/admin/matches/${id}`, {
      method: 'DELETE',
    });
  },

  // Users
  adminGetUsers() {
    return request<any[]>('/api/admin/users');
  },

  adminCreateUser(data: { name: string; email: string; password: string; role?: string; active?: boolean }) {
    return request<any>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  adminUpdateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string; active?: boolean }) {
    return request<any>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  adminDeleteUser(id: string) {
    return request<void>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Results
  adminDeclareMatchResult(matchId: string, winningTeamId: string | null) {
    return request<any>(`/api/admin/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify({ winning_team_id: winningTeamId, status: 'completed' }),
    });
  },

  // Leaderboard
  adminGenerateLeaderboard() {
    return request<{ leaderboard: any[] }>('/api/admin/leaderboard/generate', {
      method: 'POST',
    });
  },

  // Predictions
  adminGetPredictions() {
    return request<any[]>('/api/admin/predictions');
  },

  adminDeletePrediction(id: string) {
    return request<void>(`/api/admin/predictions/${id}`, {
      method: 'DELETE',
    });
  },
};
