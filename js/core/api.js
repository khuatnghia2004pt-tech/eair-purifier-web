import {auth} from './firebase.js';
import {BACKEND_URL} from './firebase-config.js';

export async function apiGet(path) {
  const base = String(BACKEND_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('Chưa cấu hình BACKEND_URL trong js/core/firebase-config.js');
  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(base + path, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Backend trả về HTTP ${response.status}`);
  return data;
}

export const apiConfigured = () => Boolean(String(BACKEND_URL || '').trim());
