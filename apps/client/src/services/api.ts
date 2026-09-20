import { TrainState, Station, User } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('trackpulse_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function apiRegister(
  email: string,
  password: string,
  name: string,
  role?: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function apiGetMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
}

// Trains
export async function apiGetTrains(): Promise<TrainState[]> {
  const res = await fetch(`${API_BASE}/trains`);
  if (!res.ok) throw new Error('Failed to fetch trains');
  return res.json();
}

export async function apiGetTrain(trainNo: string): Promise<TrainState> {
  const res = await fetch(`${API_BASE}/trains/${trainNo}`);
  if (!res.ok) throw new Error(`Failed to fetch train ${trainNo}`);
  return res.json();
}

export async function apiPostTelemetry(trainNo: string, telemetry: any): Promise<any> {
  const res = await fetch(`${API_BASE}/trains/${trainNo}/telemetry`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(telemetry),
  });
  return res.json();
}

export async function apiSimulateOvertake(): Promise<{ success: boolean; step: number; message: string; trains: TrainState[] }> {
  const res = await fetch(`${API_BASE}/trains/simulate/overtake`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

export async function apiResetSimulation(): Promise<{ success: boolean; trains: TrainState[] }> {
  const res = await fetch(`${API_BASE}/trains/simulate/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return res.json();
}

// Stations
export async function apiGetStations(search?: string, zone?: string): Promise<Station[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (zone) params.set('zone', zone);
  const res = await fetch(`${API_BASE}/stations?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch stations');
  return res.json();
}

// Zones & Tracks
export async function apiGetZones(): Promise<any> {
  const res = await fetch(`${API_BASE}/zones`);
  return res.json();
}

export async function apiGetTracks(): Promise<any> {
  const res = await fetch(`${API_BASE}/tracks`);
  return res.json();
}
