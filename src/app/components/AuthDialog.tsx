import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, Lock, Loader } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'register-otp' | 'otp-verify' | 'forgot-password' | 'reset-password-code' | 'google-role';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options?: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export default function AuthDialog({ auth, open, onOpenChange, onSuccess }: { auth: any; open: boolean; onOpenChange: (v: boolean) => void; onSuccess?: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'user' | 'lister'>('lister');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [googlePendingUser, setGooglePendingUser] = useState<{ email: string; googleId: string; name?: string } | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(true);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  useEffect(() => {
    if (googleButtonRef.current) {
      googleButtonRef.current.dataset.googleRendered = 'false';
    }
  }, [mode]);

  useEffect(() => {
    if (!open || mode !== 'register') return;

    // @ts-ignore Vite adds env to ImportMeta at build time.
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setGoogleLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const render = () => {
      const container = googleButtonRef.current;
      if (!container) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(render, 100);
        } else {
          setGoogleLoading(false);
        }
        return;
      }

      if (!window.google?.accounts?.id) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(render, 100);
        } else {
          setGoogleLoading(false);
        }
        return;
      }

      if (container.dataset.googleRendered === 'true') {
        setGoogleLoading(false);
        return;
      }

      try {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
        });
        container.dataset.googleRendered = 'true';
        setGoogleLoading(false);
      } catch (err) {
        console.error('Failed to render Google button:', err);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(render, 100);
        } else {
          setGoogleLoading(false);
        }
      }
    };

    const setupGoogle = () => {
      if (!window.google?.accounts?.id) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(setupGoogle, 100);
        }
        return;
      }

      if (!googleInitializedRef.current) {
        googleInitializedRef.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              setError('Google sign-in failed');
              return;
            }

            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1] || ''));
              const nextEmail = payload.email || `${payload.sub}@google.local`;
              const result = await auth.loginWithGoogle(
                response.credential,
                nextEmail,
                payload.sub || `google-${Date.now()}`,
                payload.name || payload.email || 'Google User'
              );

              if (result && result.requiresRegistration) {
                setGooglePendingUser({
                  email: result.email || nextEmail,
                  googleId: result.googleId || payload.sub || `google-${Date.now()}`,
                  name: result.name || payload.name || nextEmail,
                });
                setRole('user');
                setMode('google-role');
                setError(null);
                return;
              }

              if (!result || !result.ok) {
                setError('Google sign-in failed');
                return;
              }

              onOpenChange(false);
              onSuccess?.();
            } catch (err) {
              setError('Google sign-in is unavailable right now');
            } finally {
              setLoading(false);
            }
          },
        });
      }

      render();
    };

    const loadScript = () => {
      if (window.google?.accounts?.id) {
        setupGoogle();
        return;
      }

      const scriptId = 'google-gsi-script';
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.addEventListener('load', setupGoogle, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => setupGoogle();
      script.onerror = () => {
        setGoogleLoading(false);
        setError('Google sign-in failed to load');
      };
      document.body.appendChild(script);
    };

    setGoogleLoading(true);
    loadScript();
  }, [open, mode, auth, onOpenChange, onSuccess]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      const ok = await auth.login(email, password);
      if (!ok) setError('Login failed'); else { onOpenChange(false); onSuccess?.(); }
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleRequestOTP(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      const result = await auth.requestOTPRegister(email);
      if (result.success) {
        setSuccess('OTP sent! Check your email.');
        setMode('otp-verify');
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleOTPVerify(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);
    if (!otp || !password || !confirmPassword) { setError('OTP and passwords are required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const ok = await auth.registerWithOTP(email, password, otp, role);
      if (!ok) setError('Registration failed'); else { onOpenChange(false); onSuccess?.(); }
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleSimpleRegister(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      const ok = await auth.register(email, password, role);
      if (!ok) {
        setError('Registration failed');
        return;
      }
      setSuccess('Account created. Please sign in now.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleGoogleRoleRegistration() {
    if (!googlePendingUser) {
      setError('Google account details are missing');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await auth.googleRegister(googlePendingUser.email, googlePendingUser.googleId, googlePendingUser.name, role);
      if (!ok) {
        setError('Account creation failed');
        return;
      }
      setGooglePendingUser(null);
      setMode('login');
      setSuccess('Account created. Please sign in now.');
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleForgotPassword(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      }).then(r => r.json());
      
      setSuccess('Reset code sent! Check your email.');
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setMode('reset-password-code');
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  async function handleResetPasswordWithCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!otp || !password || !confirmPassword) { setError('Reset code and passwords are required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: otp, newPassword: password }),
      }).then(r => r.json());
      
      if (!result.success) {
        setError(result.error || 'Password reset failed');
        return;
      }
      
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        setMode('login');
        setEmail('');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError('Server error');
    } finally { setLoading(false); }
  }

  const renderContent = () => {
    if (mode === 'login') {
      return (
        <>
          <form className="grid gap-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Mail size={16} /> Email
              </label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Lock size={16} /> Password
              </label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>

            {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

            <DialogFooter>
              <div className="flex flex-col gap-2 w-full">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader size={16} className="animate-spin mr-2" />}
                  Sign In
                </Button>
                <Button variant="outline" type="button" onClick={() => setMode('register')} className="w-full">
                  Create Account
                </Button>
                <Button variant="ghost" type="button" onClick={() => setMode('forgot-password')} className="w-full text-sm">
                  Forgot Password?
                </Button>
              </div>
            </DialogFooter>
          </form>
        </>
      );
    }

    if (mode === 'google-role') {
      return (
        <div className="grid gap-4">
          <div className="rounded border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
            Google account not found. Choose how you want to sign up.
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'lister')} className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm mt-2">
              <option value="user">Normal User</option>
              <option value="lister">Provider</option>
            </select>
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="button" className="w-full" disabled={loading} onClick={handleGoogleRoleRegistration}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Create Account
              </Button>
              <Button variant="ghost" type="button" onClick={() => { setMode('login'); setGooglePendingUser(null); setError(null); }} className="w-full">
                Back to Login
              </Button>
            </div>
          </DialogFooter>
        </div>
      );
    }

    if (mode === 'register') {
      return (
        <>
          <form className="grid gap-4" onSubmit={handleSimpleRegister}>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Mail size={16} /> Email
              </label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Lock size={16} /> Password
              </label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                <Lock size={16} /> Confirm Password
              </label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'lister')} className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm mt-2">
                <option value="user">Normal User</option>
                <option value="lister">Provider</option>
              </select>
            </div>

            {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
            {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

            <DialogFooter>
              <div className="flex flex-col gap-2 w-full">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader size={16} className="animate-spin mr-2" />}
                  Create Account
                </Button>
                <Button variant="ghost" type="button" onClick={() => setMode('login')} className="w-full">
                  Back to Login
                </Button>
              </div>
            </DialogFooter>
          </form>

          <div className="mt-4 pt-4 border-t">
            <div className="w-full min-h-[44px]">
              {googleLoading ? (
                <div className="flex h-11 w-full items-center justify-center rounded-full border border-border bg-muted/30 text-sm text-muted-foreground">
                  Loading Google…
                </div>
              ) : (
                <div ref={googleButtonRef} className="google-signin-container w-full [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full" />
              )}
            </div>
          </div>
        </>
      );
    }

    if (mode === 'register-otp') {
      return (
        <form className="grid gap-4" onSubmit={handleRequestOTP}>
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Mail size={16} /> Email
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Send OTP
              </Button>
              <Button variant="ghost" type="button" onClick={() => setMode('register')} className="w-full">
                Back
              </Button>
            </div>
          </DialogFooter>
        </form>
      );
    }

    if (mode === 'otp-verify') {
      return (
        <form className="grid gap-4" onSubmit={handleOTPVerify}>
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              One-Time Password
            </label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="123456" maxLength={6} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Lock size={16} /> Password
            </label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Lock size={16} /> Confirm Password
            </label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm">
              <option value="user">User</option>
              <option value="lister">Provider (can add listings)</option>
            </select>
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Create Account
              </Button>
              <Button variant="ghost" type="button" onClick={() => { setMode('register-otp'); setError(null); }} className="w-full">
                Back
              </Button>
            </div>
          </DialogFooter>
        </form>
      );
    }

    if (mode === 'forgot-password') {
      return (
        <form className="grid gap-4" onSubmit={handleForgotPassword}>
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Mail size={16} /> Email
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="your@email.com" />
          </div>

          <p className="text-xs text-muted-foreground">
            We'll send you a password reset code to your email.
          </p>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Send Reset Code
              </Button>
              <Button variant="ghost" type="button" onClick={() => setMode('login')} className="w-full">
                Back to Login
              </Button>
            </div>
          </DialogFooter>
        </form>
      );
    }

    if (mode === 'reset-password-code') {
      return (
        <form className="grid gap-4" onSubmit={handleResetPasswordWithCode}>
          <div className="rounded border border-border bg-secondary/60 p-3 text-sm text-muted-foreground">
            Enter the reset code from your email and set a new password.
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Reset Code</label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="123456" maxLength={6} />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Lock size={16} /> New Password
            </label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Lock size={16} /> Confirm Password
            </label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Reset Password
              </Button>
              <Button variant="ghost" type="button" onClick={() => setMode('login')} className="w-full">
                Back to Login
              </Button>
            </div>
          </DialogFooter>
        </form>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'google-role' && 'Choose Your Role'}
            {mode === 'register-otp' && 'Register with OTP'}
            {mode === 'otp-verify' && 'Verify OTP'}
            {mode === 'forgot-password' && 'Reset Password'}
            {mode === 'reset-password-code' && 'Reset Your Password'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && 'Sign in to manage your listings'}
            {mode === 'register' && 'Create your account with email or Google'}
            {mode === 'google-role' && 'This Google account is not registered yet. Pick a role to continue.'}
            {mode === 'register-otp' && 'Enter your email to receive an OTP'}
            {mode === 'otp-verify' && 'Verify your OTP and create your account'}
            {mode === 'forgot-password' && 'Enter your email to reset your password'}
            {mode === 'reset-password-code' && 'Enter the reset code and your new password'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
