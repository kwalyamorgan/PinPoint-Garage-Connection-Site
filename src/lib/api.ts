const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const jsonHeaders = {
  'Content-Type': 'application/json',
} as Record<string,string>;

export async function fetchGarages() {
  const res = await fetch(`${API_BASE}/garages`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load garages');
  return res.json();
}

export async function fetchMechanics() {
  const res = await fetch(`${API_BASE}/mechanics`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load mechanics');
  return res.json();
}

export async function fetchTransport() {
  const res = await fetch(`${API_BASE}/transport`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load transport');
  return res.json();
}

export async function register(email: string, password: string, role = 'user') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password, role }),
  });
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function me() {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) return { user: null };
  return res.json();
}

export async function logout() {
  return fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

// OTP-based registration
export async function requestOTPRegister(email: string) {
  const res = await fetch(`${API_BASE}/auth/request-otp-register`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function registerWithOTP(email: string, password: string, otp: string, role = 'user') {
  const res = await fetch(`${API_BASE}/auth/register-with-otp`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password, otp, role }),
  });
  return res.json();
}

// Forgot password
export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json();
}

// Google OAuth
export async function googleLogin(idToken: string, email: string, googleId: string, name?: string) {
  const res = await fetch(`${API_BASE}/auth/google-login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ idToken, email, googleId, name }),
  });
  return res.json();
}

export async function createGarage(data: { name: string; address?: string; phone?: string }) {
  const res = await fetch(`${API_BASE}/garages`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res;
}

export async function createMechanic(data: any) {
  const res = await fetch(`${API_BASE}/mechanics`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res;
}

export async function createTransport(data: any) {
  const res = await fetch(`${API_BASE}/transport`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res;
}

export default {
  fetchGarages,
  fetchMechanics,
  fetchTransport,
  register,
  login,
  me,
  logout,
  createGarage,
  createMechanic,
  createTransport,
};
