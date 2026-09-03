import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Car, LocateFixed, MapPin, MessageCircle, Phone, Wrench } from 'lucide-react';
import api from '../../lib/api';

declare global {
  interface Window { google?: any; }
}

const EMERGENCY_NUMBER = '+254708614916';

type RequestForm = {
  serviceType: 'breakdown' | 'towing' | 'onsite-repair';
  description: string;
  location: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  phone: string;
  whatsapp: string;
  latitude: string;
  longitude: string;
};

const emptyForm: RequestForm = {
  serviceType: 'breakdown', description: '', location: '', make: '', model: '', year: '',
  licensePlate: '', phone: '', whatsapp: '',
  latitude: '', longitude: '',
};

export default function MechanicRequestDialog({ open, onOpenChange, user, onRequireLogin, onSubmitted }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onRequireLogin: () => void;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState<RequestForm>(emptyForm);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [locationSource, setLocationSource] = useState<'manual' | 'detected' | ''>('');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!open || !mapElement || !key) {
      if (open && !key) setMapError('Google Maps is not configured. Use the GPS button below.');
      return;
    }
    const initialise = () => {
      const center = { lat: Number(form.latitude) || -1.286389, lng: Number(form.longitude) || 36.817223 };
      const map = new window.google.maps.Map(mapElement, { center, zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      const marker = new window.google.maps.Marker({ map, position: center, draggable: true, title: 'Vehicle location' });
      const selectPoint = async (point: any) => {
        const latitude = point.lat();
        const longitude = point.lng();
        update('latitude', String(latitude));
        update('longitude', String(longitude));
        setLocationSource('detected');
        setMessage('Map location selected. Resolving the readable address...');
        try { update('location', await reverseGeocode(latitude, longitude)); setMessage('Map location selected. Review it before submitting.'); }
        catch { setMessage('Map point selected. Enter the nearest road or landmark.'); }
      };
      map.addListener('click', (event: any) => { marker.setPosition(event.latLng); selectPoint(event.latLng); });
      marker.addListener('dragend', (event: any) => selectPoint(event.latLng));
    };
    if (window.google?.maps) initialise();
    else {
      const existing = document.querySelector('script[data-pinpoint-google-maps]') as HTMLScriptElement | null;
      const script = existing || document.createElement('script');
      if (!existing) { script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`; script.async = true; script.defer = true; script.dataset.pinpointGoogleMaps = 'true'; document.head.appendChild(script); }
      script.addEventListener('load', initialise, { once: true });
      script.addEventListener('error', () => setMapError('Google Maps could not load. Use the GPS button below.'), { once: true });
    }
  }, [open, mapElement]);

  useEffect(() => {
    if (open && user) {
      setForm(current => ({ ...current, phone: current.phone || user.phone || '', whatsapp: current.whatsapp || user.whatsapp || '' }));
    }
  }, [open, user]);

  useEffect(() => {
    if (!open || !navigator.permissions?.query) return;
    navigator.permissions.query({ name: 'geolocation' }).then(permission => {
      setPermissionState(permission.state);
      permission.onchange = () => setPermissionState(permission.state);
    }).catch(() => setPermissionState('prompt'));
  }, [open]);

  const update = (key: keyof RequestForm, value: string) => setForm(current => ({ ...current, [key]: value }));

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
    if (response.ok) {
      const result = await response.json();
      const readableLocation = [result.locality, result.city, result.principalSubdivision, result.countryName]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', ');
      if (readableLocation) return readableLocation;
    }

    const fallbackResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
    if (!fallbackResponse.ok) throw new Error('Location metadata lookup failed');
    const fallbackResult = await fallbackResponse.json();
    const address = fallbackResult.address || {};
    const readableLocation = fallbackResult.display_name || [address.road, address.neighbourhood || address.suburb, address.city || address.town || address.village, address.state].filter(Boolean).join(', ');
    if (!readableLocation) throw new Error('No readable address found');
    return readableLocation as string;
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return setMessage('This device does not support GPS location. A device with location services is required.');
    }
    setLocating(true);
    let bestAccuracy = Number.POSITIVE_INFINITY;
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let finished = false;

    const finish = async () => {
      if (finished) return;
      finished = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (!bestPosition) {
        setMessage('Location permission was unavailable. Enter your location below.');
        setLocating(false);
        return;
      }
      try {
        const { coords } = bestPosition;
        const readableLocation = await reverseGeocode(coords.latitude, coords.longitude);
        update('location', readableLocation);
        update('latitude', String(coords.latitude));
        update('longitude', String(coords.longitude));
        setLocationSource('detected');
        setLocationAccuracy(coords.accuracy);
        setMessage(coords.accuracy > 100 ? 'GPS found an approximate location. Confirm or correct the area before submitting.' : 'GPS location found. Review it before submitting.');
      } catch {
        setMessage('GPS was found, but we could not identify a readable address. Enter a road, estate, or landmark manually.');
      } finally {
        setLocating(false);
      }
    };

    watchId = navigator.geolocation.watchPosition(
      position => {
        if (position.coords.accuracy < bestAccuracy) {
          bestAccuracy = position.coords.accuracy;
          bestPosition = position;
        }
        if (position.coords.accuracy <= 25) finish();
      },
      () => finish(),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    window.setTimeout(finish, 15000);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!user) { onRequireLogin(); return; }
    if (!form.description.trim() || !form.location.trim() || !form.make.trim() || !form.model.trim() || !form.phone.trim()) {
      setMessage('Please complete the problem, location, vehicle, and phone fields.');
      return;
    }
    setSaving(true);
    try {
      await api.createMechanicRequest(form);
      setMessage('Request sent. Admin will contact you to confirm the timing.');
      setForm(emptyForm);
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      setMessage((error as Error).message);
    } finally { setSaving(false); }
  };

  const call = `tel:${EMERGENCY_NUMBER}`;
  const whatsapp = `https://wa.me/${EMERGENCY_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent('I need emergency mechanic assistance.')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wrench className="text-primary" size={20} /> Request a mechanic</DialogTitle>
          <DialogDescription>Tell us what happened. Admin will arrange the mechanic and confirm the timing with you.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-5">
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
            <label className="portal-kicker">Choose your situation</label>
            <select value={form.serviceType} onChange={event => update('serviceType', event.target.value)} className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 text-sm">
              <option value="breakdown">Breakdown assistance</option>
              <option value="towing">Towing</option>
              <option value="onsite-repair">Onsite repair</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">What is the problem?</label>
            <textarea required value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describe what happened and any warning signs" className="mt-1 min-h-24 w-full rounded border border-border bg-secondary px-3 py-2 text-sm" />
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <label className="portal-kicker">Vehicle location</label>
            <div ref={setMapElement} className="mt-3 h-52 w-full overflow-hidden rounded border border-border bg-secondary" />
            {mapError && <p className="mt-2 text-xs text-yellow-400">{mapError}</p>}
            <div className="mt-1 flex gap-2"><input required value={form.location} onChange={event => { update('location', event.target.value); update('latitude', ''); update('longitude', ''); setLocationSource('manual'); }} placeholder="Enter a road, estate, landmark, or area" className="min-w-0 flex-1 rounded border border-border bg-secondary px-3 py-2 text-sm" /><button type="button" onClick={detectLocation} title="Allow device GPS and detect location" className="rounded border border-primary px-3 text-primary hover:bg-primary/10"><LocateFixed size={17} /></button></div>
            {locating && <p className="mt-1 text-xs text-muted-foreground">Finding the nearest readable address...</p>}
            {!locating && permissionState === 'denied' && <p className="mt-1 text-xs text-red-400">Device location permission is blocked. Enable it in browser settings, then try again.</p>}
            {!locating && permissionState === 'denied' && <p className="mt-1 text-xs text-muted-foreground">You can continue by entering the vehicle location manually.</p>}
            {!locating && permissionState === 'granted' && locationSource !== 'detected' && <p className="mt-1 text-xs text-yellow-400">Location permission granted. Tap the button to get your current position.</p>}
            {!locating && locationSource === 'detected' && <p className={`mt-1 text-xs ${locationAccuracy && locationAccuracy > 100 ? 'text-yellow-400' : 'text-green-500'}`}>GPS readable location{locationAccuracy ? ` (approximately ${Math.round(locationAccuracy)}m accuracy)` : ''}</p>}
          </div>
          <div className="rounded border border-border p-3"><p className="mb-3 flex items-center gap-2 text-sm font-bold"><Car size={16} className="text-primary" /> Vehicle Information</p><div className="grid gap-3 sm:grid-cols-2"><input required value={form.make} onChange={event => update('make', event.target.value)} placeholder="Make" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /><input required value={form.model} onChange={event => update('model', event.target.value)} placeholder="Model" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /><input value={form.year} onChange={event => update('year', event.target.value)} placeholder="Year" inputMode="numeric" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /><input value={form.licensePlate} onChange={event => update('licensePlate', event.target.value)} placeholder="License Plate" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /></div></div>
          <div><p className="mb-2 text-sm font-semibold">Contact information</p><div className="grid gap-3 sm:grid-cols-2"><input required value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="Phone number" type="tel" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /><input value={form.whatsapp} onChange={event => update('whatsapp', event.target.value)} placeholder="WhatsApp number (optional)" type="tel" className="rounded border border-border bg-secondary px-3 py-2 text-sm" /></div></div>
          {message && <p className="rounded border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
          <button disabled={saving} className="rounded bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Sending request...' : user ? 'Submit mechanic request' : 'Sign in to submit request'}</button>
          <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm sm:flex-row"><a href={call} className="flex flex-1 items-center justify-center gap-2 rounded border border-border px-3 py-2 font-semibold"><Phone size={15} /> Emergency call</a><a href={whatsapp} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded border border-green-500/40 px-3 py-2 font-semibold text-green-500"><MessageCircle size={15} /> Emergency WhatsApp</a></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
