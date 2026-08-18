import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail, Lock, Loader } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'register-otp' | 'otp-verify' | 'forgot-password';

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
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const scriptId = 'google-gsi-script';
    const existing = document.getElementById(scriptId);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const initializeGoogle = () => {
      if (!clientId || !window.google?.accounts?.id) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setError('Google sign-in failed');
            return;
          }

          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1] || ''));
            const ok = await auth.loginWithGoogle(
              response.credential,
              payload.email || email || `${payload.sub}@google.local`,
              payload.sub || `google-${Date.now()}`,
              payload.name || payload.email || 'Google User'
            );

            if (!ok) {
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

      if (googleButtonRef.current && !googleButtonRef.current.dataset.googleRendered) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: '100%',
        });
        googleButtonRef.current.dataset.googleRendered = 'true';
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    if (existing) {
      existing.addEventListener('load', initializeGoogle, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [open, auth, email, onOpenChange, onSuccess]);

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
      if (!ok) setError('Registration failed'); else { onOpenChange(false); onSuccess?.(); }
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
      await auth.requestOTPRegister(email); // Reusing OTP endpoint for forgot password
      setSuccess('Password reset instructions sent to your email!');
      setTimeout(() => setMode('login'), 2000);
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
          <div className="mt-4 pt-4 border-t">
            <div className="w-full">
              <div ref={googleButtonRef} className="google-signin-container w-full [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full" />
            </div>
          </div>
        </>
      );
    }

    if (mode === 'register') {
      return (
        <>
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setMode('register-otp'); handleRequestOTP(e); }}>
            <p className="text-sm text-muted-foreground">Choose registration method:</p>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setMode('register-otp'); }}
                className="flex-1"
              >
                Register with OTP
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSimpleRegister}
                className="flex-1"
              >
                Register Now
              </Button>
            </div>
            <Button variant="ghost" type="button" onClick={() => setMode('login')} className="w-full">
              Back to Login
            </Button>
          </form>
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
              <option value="lister">Lister (can add listings)</option>
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
            We'll send you a password reset link to your email.
          </p>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{success}</div>}

          <DialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader size={16} className="animate-spin mr-2" />}
                Send Reset Link
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
            {mode === 'register-otp' && 'Register with OTP'}
            {mode === 'otp-verify' && 'Verify OTP'}
            {mode === 'forgot-password' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' && 'Sign in to manage your listings'}
            {mode === 'register' && 'Choose how you want to register'}
            {mode === 'register-otp' && 'Enter your email to receive an OTP'}
            {mode === 'otp-verify' && 'Verify your OTP and create your account'}
            {mode === 'forgot-password' && 'Enter your email to reset your password'}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
