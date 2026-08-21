import { useEffect, useState } from 'react';
import * as api from '../../lib/api';
import { ArrowLeft, Bike, Car, CheckCircle, Clock, Mail, MapPin, MessageCircle, Phone, Save, Shield, Star, Trash2, Truck, Wrench, X, XCircle } from 'lucide-react';

type UserTab = 'bookings' | 'services' | 'profile' | 'support';
type ServiceType = 'garage' | 'mechanic' | 'transport' | 'car-hire' | 'bike-hire';

interface ProviderSelection {
  id?: string;
  ownerId?: string;
  name?: string;
  model?: string;
  type?: string;
  serviceType?: string;
  location?: string;
  area?: string;
  phone?: string;
  description?: string;
  isAvailable?: boolean;
  img?: string;
  specialty?: string;
  price?: string | number;
  availability?: string;
  vehicleType?: string;
  capacity?: string;
  seats?: string | number;
  transmission?: string;
  pickup?: string;
  hourly?: string | number;
  daily?: string | number;
}

interface ServiceCatalog {
  garages: ProviderSelection[];
  mechanics: ProviderSelection[];
  transport: ProviderSelection[];
  carHire: ProviderSelection[];
  bikeHire: ProviderSelection[];
}

interface Booking {
  id: string;
  providerId: string;
  providerType: string;
  providerName: string;
  serviceType: string;
  description?: string;
  status: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  providerPhone?: string;
  providerWhatsapp?: string;
  providerLocation?: string;
  dateRequested?: string;
  dateApproved?: string;
  reviewId?: string | null;
  reviewRating?: number | null;
  reviewComment?: string;
  bookingChannel?: 'site' | 'whatsapp';
}

interface Profile {
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  location: string;
}

const emptyProfile: Profile = { firstName: '', lastName: '', phone: '', whatsapp: '', location: '' };

export default function UserDashboard({ user, initialProvider, services, onClose, onLogout, embedded = false }: { user: any; initialProvider?: ProviderSelection | null; services: ServiceCatalog; onClose: () => void; onLogout: () => Promise<void>; embedded?: boolean }) {
  const [tab, setTab] = useState<UserTab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [form, setForm] = useState<Profile>(emptyProfile);
  const [selectedProvider, setSelectedProvider] = useState<ProviderSelection | null>(initialProvider || null);
  const [bookingDescription, setBookingDescription] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingWhatsapp, setBookingWhatsapp] = useState('');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('garage');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerDashboard();
      const nextProfile = { ...emptyProfile, ...(data.profile || {}) };
      setBookings(data.bookings || []);
      setProfile(nextProfile);
      setForm(nextProfile);
      setBookingPhone(nextProfile.phone);
      setBookingWhatsapp(nextProfile.whatsapp);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const providerName = selectedProvider?.name || selectedProvider?.model || 'Provider';
  const providerType = selectedProvider?.serviceType || selectedProvider?.type || 'garage';
  const providerId = selectedProvider?.id;
  const pendingCount = bookings.filter(booking => booking.status === 'pending').length;
  const approvedCount = bookings.filter(booking => booking.status === 'approved').length;
  const reviewedCount = bookings.filter(booking => Boolean(booking.reviewId)).length;
  const greetingName = profile.firstName || user?.email?.split('@')[0] || 'there';
  const userName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user?.email?.split('@')[0] || 'there';
  const serviceOptions: { id: ServiceType; label: string; icon: JSX.Element; providers: ProviderSelection[] }[] = [
    { id: 'garage', label: 'Garages', icon: <Wrench size={16} />, providers: services.garages },
    { id: 'mechanic', label: 'Mechanics', icon: <Shield size={16} />, providers: services.mechanics },
    { id: 'transport', label: 'Transport', icon: <Truck size={16} />, providers: services.transport },
    { id: 'car-hire', label: 'Car Hire', icon: <Car size={16} />, providers: services.carHire },
    { id: 'bike-hire', label: 'Bike Hire', icon: <Bike size={16} />, providers: services.bikeHire },
  ];
  const activeServices = serviceOptions.find(option => option.id === serviceType)?.providers || [];

  const chooseAction = (action: string) => {
    setTab(action as UserTab);
  };

  const createBooking = async () => {
    if (!providerId) return setMessage('This provider cannot receive bookings yet.');
    setSaving(true);
    try {
      await api.createCustomerBooking({ providerId, providerType, description: bookingDescription, customerPhone: bookingPhone, customerWhatsapp: bookingWhatsapp });
      setSelectedProvider(null);
      setBookingDescription('');
      setMessage('Booking request sent.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const bookViaWhatsapp = async () => {
    if (!providerId) return setMessage('This provider cannot receive bookings yet.');
    if (!selectedProvider?.phone) return setMessage('This provider has no WhatsApp number listed.');
    setSaving(true);
    try {
      const result = await api.createCustomerWhatsappBooking({ providerId, providerType, description: bookingDescription });
      setMessage('Booking recorded. Opening WhatsApp...');
      await load();
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateCustomerProfile(form);
      setProfile(updated);
      setMessage('Contact details updated.');
      setBookingPhone(updated.phone || '');
      setBookingWhatsapp(updated.whatsapp || '');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveReview = async () => {
    if (!reviewBooking) return;
    setSaving(true);
    try {
      await api.submitCustomerReview(reviewBooking.id, reviewRating, reviewComment);
      setReviewBooking(null);
      setMessage('Review saved.');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account, bookings, and reviews permanently?')) return;
    setSaving(true);
    try {
      await api.deleteCustomerAccount();
      await onLogout();
    } catch (error) {
      setMessage((error as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className={embedded ? 'border-y border-border bg-background text-foreground' : 'fixed inset-0 z-50 overflow-y-auto bg-background text-foreground'}>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">PinPoint</p>
            <h1 className="text-xl font-black md:text-2xl">Hi, {greetingName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!embedded && <button onClick={onClose} className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"><ArrowLeft size={16} /> <span className="hidden sm:inline">Browse</span></button>}
            <button onClick={async () => { await onLogout(); }} className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-6 flex flex-col gap-3 rounded border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-primary">What would you like to do?</p><p className="text-sm text-muted-foreground">Choose an action and we will take you there.</p></div>
          <select value={tab} onChange={event => chooseAction(event.target.value)} className="w-full rounded border border-border bg-secondary px-3 py-2.5 text-sm font-semibold text-foreground outline-none sm:w-64">
            <option value="bookings">View bookings</option>
            <option value="services">Book a service</option>
            <option value="profile">Update contact details</option>
            <option value="support">Contact support</option>
          </select>
        </div>

        <section className="min-w-0">
          {message && <div className="mb-4 flex items-start justify-between gap-3 rounded border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"><span className="min-w-0 break-words">{message}</span><button className="shrink-0" onClick={() => setMessage('')}><X size={16} /></button></div>}
          {loading ? <div className="rounded border border-border bg-card p-10 text-center text-muted-foreground">Loading your dashboard...</div> : null}

          {!loading && tab === 'bookings' && (
            <div className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-3 md:gap-4">
                <div className="rounded border border-border bg-card p-3 md:p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p><p className="mt-1 text-2xl font-black">{bookings.length}</p></div>
                <div className="rounded border border-border bg-card p-3 md:p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending</p><p className="mt-1 text-2xl font-black text-yellow-400">{pendingCount}</p></div>
                <div className="rounded border border-border bg-card p-3 md:p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Approved</p><p className="mt-1 text-2xl font-black text-green-400">{approvedCount}</p></div>
              </div>
              {selectedProvider && (
                <div className="rounded border border-primary/40 bg-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">New booking</p><h2 className="text-xl font-black">{providerName}</h2><p className="text-sm text-muted-foreground">{selectedProvider.location || selectedProvider.area || 'Nairobi service area'} · {providerType}</p></div><button onClick={() => setSelectedProvider(null)}><X size={18} /></button></div>
                  <div className="grid gap-3 md:grid-cols-2"><input value={bookingPhone} onChange={e => setBookingPhone(e.target.value)} placeholder="Your phone" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /><input value={bookingWhatsapp} onChange={e => setBookingWhatsapp(e.target.value)} placeholder="Your WhatsApp" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /></div>
                  <textarea value={bookingDescription} onChange={e => setBookingDescription(e.target.value)} placeholder="What do you need help with?" className="mt-3 min-h-24 w-full rounded border border-border bg-secondary px-3 py-2 text-sm" />
                  <button disabled={saving} onClick={createBooking} className="mt-3 rounded bg-primary px-4 py-2 text-sm font-semibold text-white">{saving ? 'Sending...' : 'Send booking request'}</button>
                </div>
              )}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Your activity</p><h2 className="text-2xl font-black">Bookings and provider contact</h2></div><span className="text-sm text-muted-foreground">{reviewedCount} reviewed</span></div>
              {bookings.length === 0 ? <div className="rounded border border-border bg-card p-10 text-center text-muted-foreground">No bookings yet. Browse providers and choose View Details to request a service.</div> : bookings.map(booking => (
                <article key={booking.id} className="rounded border border-border bg-card p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h3 className="font-bold">{booking.providerName}</h3><p className="text-xs uppercase tracking-wider text-primary">{booking.serviceType}</p><p className="mt-1 text-sm text-muted-foreground">Requested {booking.dateRequested ? new Date(booking.dateRequested).toLocaleString() : 'recently'}</p></div><span className={`flex h-fit items-center gap-1 rounded px-2 py-1 text-xs font-bold uppercase ${booking.status === 'approved' ? 'bg-green-500/15 text-green-400' : booking.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>{booking.status === 'approved' ? <CheckCircle size={13} /> : booking.status === 'rejected' ? <XCircle size={13} /> : <Clock size={13} />}{booking.status}</span></div>
                  {(booking.providerLocation || booking.providerPhone || booking.providerWhatsapp) && <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">{booking.providerLocation && <p className="flex items-center gap-2"><MapPin size={15} />{booking.providerLocation}</p>}{booking.providerPhone && <a href={`tel:${booking.providerPhone}`} className="flex items-center gap-2 text-primary"><Phone size={15} />{booking.providerPhone}</a>}{booking.providerWhatsapp && <a href={`https://wa.me/${booking.providerWhatsapp.replace(/\D/g, '')}`} className="flex items-center gap-2 text-green-400"><MessageCircle size={15} />WhatsApp provider</a>}</div>}
                  {booking.description && <p className="mt-3 rounded bg-secondary p-3 text-sm text-muted-foreground">{booking.description}</p>}
                  {booking.status === 'approved' && <button onClick={() => { setReviewBooking(booking); setReviewRating(booking.reviewRating || 5); setReviewComment(booking.reviewComment || ''); }} className="mt-4 flex items-center gap-2 rounded border border-primary px-3 py-2 text-sm font-semibold text-primary"><Star size={15} />{booking.reviewId ? 'Edit review' : 'Rate provider'}</button>}
                </article>
              ))}
            </div>
          )}

          {!loading && tab === 'services' && (
            <div className="space-y-5">
              <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Book a service</p><h2 className="text-2xl font-black">Choose the service you need</h2></div>
              <div className="flex flex-wrap gap-2">
                {serviceOptions.filter(option => option.providers.length > 0).map(option => <button key={option.id} onClick={() => { setServiceType(option.id); setSelectedProvider(null); }} className={`flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold ${serviceType === option.id ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>{option.icon}{option.label}</button>)}
              </div>
              {activeServices.length === 0 ? <div className="rounded border border-border bg-card p-10 text-center text-muted-foreground">No providers are available for this service yet.</div> : <div className="grid gap-4 md:grid-cols-2">{activeServices.map(provider => <article key={provider.id} className="overflow-hidden rounded border border-border bg-card"><div className="flex flex-col gap-4 p-4 sm:flex-row"><img src={provider.img} alt={provider.name || provider.model || 'Provider'} className="h-40 w-full rounded object-cover sm:h-24 sm:w-28 sm:shrink-0" /><div className="min-w-0"><h3 className="font-bold">{provider.name || provider.model || 'Provider'}</h3><p className="text-sm text-primary">{provider.specialty || provider.type || serviceType}</p><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} />{provider.location || provider.area || provider.pickup || 'Nairobi'}</p><p className="mt-1 text-xs text-muted-foreground">{provider.availability || (provider.isAvailable === false ? 'Unavailable' : 'Available now')}</p></div></div><div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row"><button onClick={() => setSelectedProvider({ ...provider, serviceType })} className="flex-1 rounded border border-primary px-3 py-2 text-sm font-semibold text-primary">View details</button><button onClick={() => setSelectedProvider({ ...provider, serviceType })} className="flex-1 rounded bg-primary px-3 py-2 text-sm font-semibold text-white">Book now</button></div></article>)}</div>}
              {selectedProvider && <div className="rounded border border-primary/40 bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Provider details</p><h2 className="text-xl font-black">{providerName}</h2><p className="text-sm text-muted-foreground">{selectedProvider.location || selectedProvider.area || selectedProvider.pickup || 'Nairobi'} · {providerType}</p></div><button onClick={() => setSelectedProvider(null)} aria-label="Close provider details"><X size={18} /></button></div><div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">{selectedProvider.specialty && <p><strong className="text-foreground">Specialty:</strong> {selectedProvider.specialty}</p>}{selectedProvider.description && <p><strong className="text-foreground">Description:</strong> {selectedProvider.description}</p>}{selectedProvider.price && <p><strong className="text-foreground">Price:</strong> {selectedProvider.price}</p>}{selectedProvider.phone && <p><strong className="text-foreground">Phone:</strong> {selectedProvider.phone}</p>}{selectedProvider.availability && <p><strong className="text-foreground">Availability:</strong> {selectedProvider.availability}</p>}</div><textarea value={bookingDescription} onChange={e => setBookingDescription(e.target.value)} placeholder={`What do you need from ${providerName}?`} className="mt-4 min-h-24 w-full rounded border border-border bg-secondary px-3 py-2 text-sm" /><div className="mt-3 flex flex-wrap gap-2"><button disabled={saving} onClick={createBooking} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">{saving ? 'Sending...' : 'Book from site'}</button><button disabled={saving} onClick={bookViaWhatsapp} className="flex items-center gap-2 rounded bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><MessageCircle size={16} />Book via WhatsApp</button></div><p className="mt-2 text-xs text-muted-foreground">Both booking methods are saved to your bookings for analysis.</p></div>}
            </div>
          )}

          {!loading && tab === 'profile' && (
            <div className="max-w-2xl rounded border border-border bg-card p-5 md:p-7"><p className="text-xs font-bold uppercase tracking-widest text-primary">Your profile</p><h2 className="mb-6 text-2xl font-black">Keep your contact details current</h2><div className="grid gap-4 sm:grid-cols-2">{(['firstName', 'lastName', 'phone', 'whatsapp', 'location'] as const).map(field => <label key={field} className="text-sm font-semibold capitalize text-muted-foreground">{field === 'whatsapp' ? 'WhatsApp' : field}<input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal text-foreground" /></label>)}</div><button disabled={saving} onClick={saveProfile} className="mt-6 flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-white"><Save size={16} />{saving ? 'Saving...' : 'Save contact details'}</button><div className="mt-10 border-t border-border pt-5"><button disabled={saving} onClick={deleteAccount} className="flex items-center gap-2 rounded border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400"><Trash2 size={16} />Delete account</button></div></div>
          )}

          {!loading && tab === 'support' && (
            <div className="grid gap-5 md:grid-cols-2"><div className="rounded border border-border bg-card p-6"><h2 className="text-xl font-black">Contact PinPoint admin</h2><p className="mt-2 text-sm text-muted-foreground">Get help with bookings, reports, payments, or account issues.</p><a href="mailto:kwalyamorgan@gmail.com" className="mt-5 flex items-center gap-2 text-primary"><Mail size={16} />kwalyamorgan@gmail.com</a><a href="tel:+254708614916" className="mt-3 flex items-center gap-2 text-primary"><Phone size={16} />+254 708 614 916</a></div><div className="rounded border border-border bg-card p-6"><h2 className="text-xl font-black">Booking help</h2><p className="mt-2 text-sm text-muted-foreground">Contact the provider directly from each booking using the phone or WhatsApp actions.</p><button onClick={() => setTab('bookings')} className="mt-5 rounded bg-primary px-4 py-2 text-sm font-semibold text-white">Review bookings</button></div></div>
          )}
        </section>
      </main>

      {reviewBooking && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded border border-border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Review {reviewBooking.providerName}</h2><button onClick={() => setReviewBooking(null)}><X size={18} /></button></div><div className="my-5 flex gap-2">{[1,2,3,4,5].map(value => <button key={value} onClick={() => setReviewRating(value)} aria-label={`${value} stars`}><Star size={28} className={value <= reviewRating ? 'fill-primary text-primary' : 'text-muted-foreground'} /></button>)}</div><textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Write your review" className="min-h-28 w-full rounded border border-border bg-secondary p-3 text-sm" /><button disabled={saving} onClick={saveReview} className="mt-4 w-full rounded bg-primary px-4 py-2 font-semibold text-white">{saving ? 'Saving...' : 'Save review'}</button></div></div>}
    </div>
  );
}
