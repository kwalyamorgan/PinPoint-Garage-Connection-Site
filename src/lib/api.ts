export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

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

export async function getCustomerDashboard() {
  const res = await fetch(`${API_BASE}/customer/dashboard`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load customer dashboard');
  return res.json();
}

export async function createCustomerBooking(data: { providerId: string; providerType: string; description?: string; customerPhone?: string; customerWhatsapp?: string }) {
  const res = await fetch(`${API_BASE}/customer/bookings`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create booking');
  return res.json();
}

export async function createMechanicRequest(data: {
  serviceType: 'breakdown' | 'towing' | 'onsite-repair';
  description: string;
  location: string;
  make: string;
  model: string;
  year?: string;
  licensePlate?: string;
  phone: string;
  whatsapp?: string;
  latitude: string;
  longitude: string;
}) {
  const res = await fetch(`${API_BASE}/customer/mechanic-requests`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to submit mechanic request');
  return res.json();
}

export async function createTransportRequest(data: {
  movingDate: string;
  pickupLocation: string;
  destination: string;
  items: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/customer/transport-requests`, {
    method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to submit transport request');
  return res.json();
}

export async function createCustomerWhatsappBooking(data: { providerId: string; providerType: string; description?: string }) {
  const res = await fetch(`${API_BASE}/customer/bookings/whatsapp`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to record WhatsApp booking');
  return res.json() as Promise<{ whatsappUrl: string }>;
}

export async function updateCustomerBooking(id: string, data: { description?: string; customerPhone?: string; customerWhatsapp?: string }) {
  const res = await fetch(`${API_BASE}/customer/bookings/${id}`, { method: 'PATCH', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update booking');
  return res.json();
}

export async function submitCustomerReview(id: string, rating: number, comment: string) {
  const res = await fetch(`${API_BASE}/customer/bookings/${id}/review`, { method: 'POST', headers: jsonHeaders, credentials: 'include', body: JSON.stringify({ rating, comment }) });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to save review');
  return res.json();
}

export async function updateCustomerProfile(data: { firstName: string; lastName: string; phone: string; whatsapp: string; location: string }) {
  const res = await fetch(`${API_BASE}/customer/profile`, { method: 'PUT', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function deleteCustomerAccount() {
  const res = await fetch(`${API_BASE}/customer/account`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

export async function getCloudinaryUploadSignature() {
  const res = await fetch(`${API_BASE}/images/cloudinary-signature`, { credentials: 'include' });
  if (!res.ok) throw new Error('Unable to prepare image upload');
  return res.json() as Promise<{
    cloudName: string;
    apiKey: string;
    folder: string;
    timestamp: number;
    signature: string;
  }>;
}

export async function register(email: string, password: string, role = 'user') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password, role }),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, ...body };
}

export async function login(email: string, password: string, adminOnly = false) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password, adminOnly }),
  });
  const body = await res.json();
  return { ok: res.ok, status: res.status, ...body };
}

export async function me() {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) return { user: null };
  return res.json();
}

export async function logout() {
  return fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export async function getAdminDashboard() {
  const res = await fetch(`${API_BASE}/admin/dashboard`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to load admin dashboard');
  return res.json();
}

export async function getAdminMechanics() {
  const res = await fetch(`${API_BASE}/admin/mechanics`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to load mechanics');
  return res.json();
}

export async function getAdminTransport() {
  const res = await fetch(`${API_BASE}/admin/transport`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to load transport providers');
  return res.json();
}

export async function updateMechanicRequest(id: string, data: { scheduledAt?: string; status?: string; notes?: string }) {
  const res = await fetch(`${API_BASE}/admin/mechanic-requests/${id}`, {
    method: 'PATCH', headers: jsonHeaders, credentials: 'include', body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to update mechanic request');
  return res.json();
}

export async function updateProviderStatus(id: string, data: { approved?: boolean; enabled?: boolean }) {
  const res = await fetch(`${API_BASE}/admin/providers/${id}/status`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Unable to update provider status');
  return res.json();
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
export async function googleLogin(idToken: string, email: string, googleId: string, name?: string, role?: 'user' | 'lister') {
  const res = await fetch(`${API_BASE}/auth/google-login`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ idToken, email, googleId, name, role }),
  });
  return res.json();
}

export async function googleRegister(email: string, googleId: string, name?: string, role: 'user' | 'lister' = 'user') {
  const res = await fetch(`${API_BASE}/auth/google-register`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, googleId, name, role }),
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
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create garage');
  return res.json();
}

export async function createMechanic(data: any) {
  const res = await fetch(`${API_BASE}/mechanics`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create mechanic');
  return res.json();
}

export async function createTransport(data: any) {
  const res = await fetch(`${API_BASE}/transport`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create transport');
  return res.json();
}

export async function updateGarage(id: string, data: any) {
  const res = await fetch(`${API_BASE}/garages/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update garage');
  return res.json();
}

export async function updateMechanic(id: string, data: any) {
  const res = await fetch(`${API_BASE}/mechanics/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update mechanic');
  return res.json();
}

export async function updateTransport(id: string, data: any) {
  const res = await fetch(`${API_BASE}/transport/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update transport');
  return res.json();
}

export async function deleteGarage(id: string) {
  const res = await fetch(`${API_BASE}/garages/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete garage');
  return res;
}

export async function deleteMechanic(id: string) {
  const res = await fetch(`${API_BASE}/mechanics/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete mechanic');
  return res;
}

export async function deleteTransport(id: string) {
  const res = await fetch(`${API_BASE}/transport/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete transport');
  return res;
}

// ───── Provider Dashboard APIs ─────

export async function getProviderDashboard() {
  const res = await fetch(`${API_BASE}/provider/dashboard`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load provider dashboard');
  return res.json();
}

export async function getProviderListings() {
  const res = await fetch(`${API_BASE}/provider/listings`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load provider listings');
  return res.json();
}

export async function getProviderBookings(status?: string) {
  const url = status 
    ? `${API_BASE}/provider/bookings?status=${encodeURIComponent(status)}`
    : `${API_BASE}/provider/bookings`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load bookings');
  return res.json();
}

export async function getBookingDetails(bookingId: string) {
  const res = await fetch(`${API_BASE}/provider/bookings/${bookingId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load booking details');
  return res.json();
}

export async function updateBookingStatus(bookingId: string, status: string, notes?: string) {
  const res = await fetch(`${API_BASE}/provider/bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update booking');
  return res.json();
}

export async function getProviderProfile() {
  const res = await fetch(`${API_BASE}/provider/profile`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export async function updateProviderProfile(data: { firstName?: string; lastName?: string; phone?: string; whatsapp?: string; location?: string }) {
  const res = await fetch(`${API_BASE}/provider/profile`, {
    method: 'PUT',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function deleteProviderAccount() {
  const res = await fetch(`${API_BASE}/provider/account`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

export async function getProviderStats() {
  const res = await fetch(`${API_BASE}/provider/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export default {
  fetchGarages,
  fetchMechanics,
  fetchTransport,
  getCloudinaryUploadSignature,
  register,
  login,
  me,
  logout,
  getAdminDashboard,
  getAdminMechanics,
  createMechanicRequest,
  updateProviderStatus,
  createGarage,
  createMechanic,
  createTransport,
  updateGarage,
  updateMechanic,
  updateTransport,
  deleteGarage,
  deleteMechanic,
  deleteTransport,
  getProviderDashboard,
  getProviderListings,
  getProviderBookings,
  getBookingDetails,
  updateBookingStatus,
  getProviderProfile,
  updateProviderProfile,
  deleteProviderAccount,
  getProviderStats,
};
