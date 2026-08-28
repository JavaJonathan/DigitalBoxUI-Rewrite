import { apiFetch } from './client';
import type { LoginResponse, MeResponse } from '../types';

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getMe() {
  return apiFetch<MeResponse>('/api/auth/me');
}
