import { useState, useEffect } from 'react';
import * as api from './api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.me();
        if (!mounted) return;
        setUser(r.user ?? null);
      } catch (err) {
        setUser(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function login(email: string, password: string, adminOnly = false) {
    const r = await api.login(email, password, adminOnly);
    if (r && r.user) {
      // user is returned and cookie is set by server
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return meRes.user ?? false;
    }
    return false;
  }

  async function register(email: string, password: string, role = 'user') {
    const r = await api.register(email, password, role);
    if (r && r.ok && r.success) return { ok: true as const };
    if (r && r.user) {
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return { ok: true as const };
    }
    return { ok: false as const, error: r?.error || 'Registration failed', status: r?.status };
  }

  async function registerWithOTP(email: string, password: string, otp: string, role = 'user') {
    const r = await api.registerWithOTP(email, password, otp, role);
    if (r && r.user) {
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return true;
    }
    return false;
  }

  async function requestOTPRegister(email: string) {
    return await api.requestOTPRegister(email);
  }

  async function loginWithGoogle(idToken: string, email: string, googleId: string, name?: string, role?: 'user' | 'lister') {
    const r = await api.googleLogin(idToken, email, googleId, name, role);
    if (r && r.user) {
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return { ok: true, requiresRegistration: false };
    }
    if (r && r.requiresRegistration) {
      return { ok: false, requiresRegistration: true, email: r.email, googleId: r.googleId, name: r.name };
    }
    return { ok: false, requiresRegistration: false };
  }

  async function googleRegister(email: string, googleId: string, name?: string, role: 'user' | 'lister' = 'user') {
    const r = await api.googleRegister(email, googleId, name, role);
    return !!(r && r.success);
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function refresh() {
    const r = await api.me();
    setUser(r.user ?? null);
  }

  return { user, login, logout, register, refresh, registerWithOTP, requestOTPRegister, loginWithGoogle, googleRegister };
}
