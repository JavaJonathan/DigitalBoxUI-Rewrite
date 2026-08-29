import { apiFetch } from './client';
import type { AdminUserListItem, GeneratedPasswordResponse } from '../types';

export function listUsers() {
  return apiFetch<AdminUserListItem[]>('/api/users');
}

export function createUser(username: string, displayName: string) {
  return apiFetch<GeneratedPasswordResponse>('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username, displayName }),
  });
}

export function resetUserPassword(id: string) {
  return apiFetch<GeneratedPasswordResponse>(`/api/users/${id}/reset-password`, {
    method: 'POST',
  });
}

export function setUserActive(id: string, active: boolean) {
  return apiFetch<AdminUserListItem>(`/api/users/${id}/${active ? 'activate' : 'deactivate'}`, {
    method: 'POST',
  });
}

export function renameUser(id: string, displayName: string) {
  return apiFetch<AdminUserListItem>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ displayName }),
  });
}
