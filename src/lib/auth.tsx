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

  async function login(email: string, password: string) {
    const r = await api.login(email, password);
    if (r && r.user) {
      // user is returned and cookie is set by server
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return true;
    }
    return false;
  }

  async function register(email: string, password: string, role = 'user') {
    const r = await api.register(email, password, role);
    if (r && r.user) {
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return true;
    }
    return false;
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

  async function loginWithGoogle(idToken: string, email: string, googleId: string, name?: string) {
    const r = await api.googleLogin(idToken, email, googleId, name);
    if (r && r.user) {
      const meRes = await api.me();
      setUser(meRes.user ?? null);
      return true;
    }
    return false;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function refresh() {
    const r = await api.me();
    setUser(r.user ?? null);
  }

  return { user, login, logout, register, refresh, registerWithOTP, requestOTPRegister, loginWithGoogle };
}
