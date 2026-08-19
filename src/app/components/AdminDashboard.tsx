import { useEffect, useState } from 'react';
import { BarChart3, Check, CheckCircle, Mail, MessageCircle, Power, RefreshCw, Shield, Users, X } from 'lucide-react';
import api from '../../lib/api';

type AdminView = 'overview' | 'customers' | 'providers';

function whatsappUrl(phone?: string, text = '') {
  const number = String(phone || '').replace(/\D/g, '');
  return number ? `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
}

function displayName(item: any) {
  return [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email?.split('@')[0] || 'Unnamed';
}

export default function AdminDashboard({ auth }: { auth: any }) {
  const [view, setView] = useState<AdminView>('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminDashboard();
      setCustomers(data.customers || []);
      setProviders(data.providers || []);
      setStats(data.stats || {});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user?.role === 'admin') load();
  }, [auth.user]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await auth.login(email, password, true);
      if (!loggedInUser) setError('Invalid admin credentials');
      else if (loggedInUser.role !== 'admin') {
        await auth.logout();
        setError('This login is for administrators only.');
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const changeProviderStatus = async (provider: any, change: { approved?: boolean; enabled?: boolean }) => {
    try {
      await api.updateProviderStatus(provider.id, change);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (auth.user?.role !== 'admin') {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8">
        <div className="mx-auto max-w-md rounded border border-border bg-card p-7 shadow-xl">
          <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-white"><Shield size={20} /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">PinPoint</p><h1 className="text-2xl font-black">Admin access</h1></div></div>
          <p className="mb-6 text-sm text-muted-foreground">This is the private control room for customer and provider management.</p>
          <form className="grid gap-4" onSubmit={login}>
            <input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="Admin email" required className="rounded border border-border bg-secondary px-3 py-3 text-sm outline-none focus:border-primary" />
            <input value={password} onChange={event => setPassword(event.target.value)} type="password" placeholder="Password" required className="rounded border border-border bg-secondary px-3 py-3 text-sm outline-none focus:border-primary" />
            {error && <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
            <button disabled={loading} className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loading && <RefreshCw size={15} className="animate-spin" />} Sign in as admin</button>
          </form>
        </div>
      </main>
    );
  }

  const cards = [
    { label: 'Customers', value: customers.length, icon: <Users size={18} /> },
    { label: 'Providers', value: providers.length, icon: <Shield size={18} /> },
    { label: 'Bookings', value: stats.totalBookings || 0, icon: <BarChart3 size={18} /> },
    { label: 'Pending bookings', value: stats.pendingBookings || 0, icon: <RefreshCw size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 md:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">PinPoint / private</p><h1 className="text-2xl font-black">Admin dashboard</h1></div><div className="flex items-center gap-2"><button onClick={load} title="Refresh dashboard" className="rounded border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button><button onClick={auth.logout} className="rounded bg-secondary px-3 py-2 text-sm font-semibold">Log out</button></div></div></header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {error && <div className="mb-5 flex items-center justify-between rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(card => <div key={card.label} className="rounded border border-border bg-card p-4"><div className="mb-3 flex items-center gap-2 text-primary">{card.icon}<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</span></div><p className="text-3xl font-black">{card.value}</p></div>)}</div>
        <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-border"><button onClick={() => setView('overview')} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Overview</button><button onClick={() => setView('customers')} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === 'customers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Customers ({customers.length})</button><button onClick={() => setView('providers')} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === 'providers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Providers ({providers.length})</button></nav>
        {view === 'overview' && <section className="grid gap-5 lg:grid-cols-2"><div className="rounded border border-border bg-card p-5"><h2 className="mb-4 text-lg font-black">Booking activity</h2><div className="grid grid-cols-3 gap-3 text-center"><div className="rounded bg-secondary p-4"><p className="text-2xl font-black text-yellow-400">{stats.pendingBookings || 0}</p><p className="mt-1 text-xs text-muted-foreground">Pending</p></div><div className="rounded bg-secondary p-4"><p className="text-2xl font-black text-green-400">{stats.approvedBookings || 0}</p><p className="mt-1 text-xs text-muted-foreground">Approved</p></div><div className="rounded bg-secondary p-4"><p className="text-2xl font-black text-red-400">{stats.rejectedBookings || 0}</p><p className="mt-1 text-xs text-muted-foreground">Rejected</p></div></div></div><div className="rounded border border-border bg-card p-5"><h2 className="mb-2 text-lg font-black">Needs attention</h2><p className="text-sm text-muted-foreground">{providers.filter(provider => !provider.providerApproved).length} provider account(s) are waiting for approval.</p><button onClick={() => setView('providers')} className="mt-5 rounded bg-primary px-4 py-2 text-sm font-bold text-white">Review providers</button></div></section>}
        {view === 'customers' && <section className="overflow-hidden rounded border border-border bg-card"><div className="border-b border-border p-5"><h2 className="text-xl font-black">Customers</h2><p className="mt-1 text-sm text-muted-foreground">Contact customers and see their booking activity.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Bookings</th><th className="px-5 py-3">Joined</th></tr></thead><tbody>{customers.map(customer => <tr key={customer.id} className="border-t border-border"><td className="px-5 py-4"><p className="font-bold">{displayName(customer)}</p><p className="text-xs text-muted-foreground">{customer.email}</p></td><td className="px-5 py-4"><div className="flex gap-2">{customer.email && <a title="Email customer" href={`mailto:${customer.email}`} className="rounded border border-border p-2 text-primary hover:border-primary"><Mail size={15} /></a>}{customer.phone && <a title="WhatsApp customer" target="_blank" rel="noreferrer" href={whatsappUrl(customer.whatsapp || customer.phone)} className="rounded border border-border p-2 text-green-400 hover:border-green-400"><MessageCircle size={15} /></a>}</div><p className="mt-2 text-xs text-muted-foreground">{customer.phone || 'No phone listed'}</p></td><td className="px-5 py-4 font-bold">{customer.bookingCount || 0}</td><td className="px-5 py-4 text-muted-foreground">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}</td></tr>)}</tbody></table>{!customers.length && <p className="p-8 text-center text-sm text-muted-foreground">No customers yet.</p>}</div></section>}
        {view === 'providers' && <section className="overflow-hidden rounded border border-border bg-card"><div className="border-b border-border p-5"><h2 className="text-xl font-black">Providers</h2><p className="mt-1 text-sm text-muted-foreground">Approve new providers before they appear on the public homepage. Disable or enable their visibility at any time.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Provider</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Listings</th><th className="px-5 py-3">Bookings</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{providers.map(provider => <tr key={provider.id} className="border-t border-border"><td className="px-5 py-4"><p className="font-bold">{displayName(provider)}</p><p className="text-xs text-muted-foreground">{provider.email}</p><p className="mt-1 text-xs text-muted-foreground">{provider.location || 'Location not listed'}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1 text-[10px] font-bold uppercase"><span className={`rounded px-2 py-1 ${provider.providerApproved ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>{provider.providerApproved ? 'Approved' : 'Pending'}</span>{provider.providerApproved && <span className={`rounded px-2 py-1 ${provider.providerEnabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{provider.providerEnabled ? 'Enabled' : 'Disabled'}</span>}</div></td><td className="px-5 py-4 font-bold">{provider.listingCount || 0}</td><td className="px-5 py-4 font-bold">{provider.bookingCount || 0}</td><td className="px-5 py-4"><div className="flex gap-2">{provider.email && <a title="Email provider" href={`mailto:${provider.email}`} className="rounded border border-border p-2 text-primary hover:border-primary"><Mail size={15} /></a>}{(provider.whatsapp || provider.phone) && <a title="WhatsApp provider" target="_blank" rel="noreferrer" href={whatsappUrl(provider.whatsapp || provider.phone)} className="rounded border border-border p-2 text-green-400 hover:border-green-400"><MessageCircle size={15} /></a>}</div></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{!provider.providerApproved ? <button onClick={() => changeProviderStatus(provider, { approved: true, enabled: true })} className="flex items-center gap-1 rounded bg-green-600 px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Approve</button> : <button onClick={() => changeProviderStatus(provider, { enabled: !provider.providerEnabled })} className={`flex items-center gap-1 rounded px-3 py-2 text-xs font-bold text-white ${provider.providerEnabled ? 'bg-red-600' : 'bg-green-600'}`}><Power size={14} /> {provider.providerEnabled ? 'Disable' : 'Enable'}</button>}</div></td></tr>)}</tbody></table>{!providers.length && <p className="p-8 text-center text-sm text-muted-foreground">No providers yet.</p>}</div></section>}
      </main>
    </div>
  );
}