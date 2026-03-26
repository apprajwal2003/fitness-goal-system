const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Request failed');
  }
  return res.json();
}

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    request<{ user: { id: string; email: string; name: string }; token: string; profileId: string; onboardingCompleted: boolean }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: { id: string; email: string; name: string }; token: string; profileId?: string; onboardingCompleted: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () =>
    request<{ user: import('../types').User; profile: import('../types').UserProfile | null }>('/auth/me'),
};

export const usersApi = {
  getProfile: () => request<import('../types').UserProfile>('/users/profile'),
  updateProfile: (body: Partial<import('../types').UserProfile>) =>
    request<import('../types').UserProfile>('/users/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const scheduleApi = {
  getDay: (date: string) =>
    request<{ busySlots: import('../types').BusySlot[]; scheduledActivities: import('../types').ScheduledActivity[] }>(`/schedule/day?date=${date}`),
  getRange: (startDate: string, endDate: string) =>
    request<{ schedule: import('../types').DaySchedule[] }>(`/schedule/range?startDate=${startDate}&endDate=${endDate}`),
  getStats: (startDate: string, endDate: string) =>
    request<import('../types').ProgressStats>(`/schedule/stats?startDate=${startDate}&endDate=${endDate}`),
  getDashboard: () =>
    request<import('../types').DashboardData>('/schedule/dashboard'),
  updateBusy: (date: string, busySlots: import('../types').BusySlot[]) =>
    request<{ busySlots: import('../types').BusySlot[]; scheduledActivities: import('../types').ScheduledActivity[] }>('/schedule/busy', {
      method: 'PUT',
      body: JSON.stringify({ date, busySlots }),
    }),
  recalculate: (date: string) =>
    request<{ scheduledActivities: import('../types').ScheduledActivity[] }>('/schedule/recalculate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),
  markComplete: (date: string, activityIndex: number, completed: boolean) =>
    request<{ ok: boolean }>('/schedule/complete', {
      method: 'POST',
      body: JSON.stringify({ date, activityIndex, completed }),
    }),
};

export const squadsApi = {
  create: (name: string) =>
    request<{ id: string; name: string; memberIds: string[] }>('/squads', { method: 'POST', body: JSON.stringify({ name }) }),
  getMy: () =>
    request<{ squad: import('../types').Squad | null }>('/squads/me'),
  join: (squadId: string) =>
    request<{ id: string; name: string; memberIds: string[] }>(`/squads/${squadId}/join`, { method: 'POST' }),
  leaderboard: (date?: string) =>
    request<{ leaderboard: import('../types').LeaderboardEntry[]; date: string }>(
      date ? `/squads/leaderboard?date=${date}` : '/squads/leaderboard'
    ),
};
