import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Truck } from 'lucide-react';
import api from '../../lib/api';

type TransportForm = {
  movingDate: string;
  pickupLocation: string;
  destination: string;
  items: string;
  phone: string;
  whatsapp: string;
  notes: string;
};

const emptyForm: TransportForm = {
  movingDate: '', pickupLocation: '', destination: '', items: '', phone: '', whatsapp: '', notes: '',
};

export default function TransportRequestDialog({ open, onOpenChange, user, onRequireLogin, onSubmitted }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onRequireLogin: () => void;
  onSubmitted?: () => void;
}) {
  const [form, setForm] = useState<TransportForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setForm(current => ({ ...current, phone: current.phone || user.phone || '', whatsapp: current.whatsapp || user.whatsapp || '' }));
  }, [open, user]);

  const update = (key: keyof TransportForm, value: string) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!user) { onRequireLogin(); return; }
    if (!form.movingDate || !form.pickupLocation.trim() || !form.destination.trim() || !form.items.trim() || !form.phone.trim()) {
      setMessage('Please complete the moving date, locations, items, and phone fields.');
      return;
    }
    setSaving(true);
    try {
      await api.createTransportRequest(form);
      setMessage('Request sent. PinPoint admin will match you with a transport provider.');
      setForm(emptyForm);
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck className="text-primary" size={20} /> Hama na Sisi</DialogTitle>
          <DialogDescription>Request help moving household items or shifting. PinPoint admin will coordinate a suitable provider for you.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Moving date<input required type="date" value={form.movingDate} onChange={event => update('movingDate', event.target.value)} className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
            <label className="text-sm font-semibold">Phone<input required type="tel" value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="Your phone number" className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
          </div>
          <label className="text-sm font-semibold">Pickup location<input required value={form.pickupLocation} onChange={event => update('pickupLocation', event.target.value)} placeholder="Where should we collect the items?" className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
          <label className="text-sm font-semibold">Destination<input required value={form.destination} onChange={event => update('destination', event.target.value)} placeholder="Where are you moving to?" className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
          <label className="text-sm font-semibold">Household items<textarea required value={form.items} onChange={event => update('items', event.target.value)} placeholder="List the items and approximate quantity" className="mt-1 min-h-24 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">WhatsApp (optional)<input value={form.whatsapp} onChange={event => update('whatsapp', event.target.value)} placeholder="WhatsApp number" className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
            <label className="text-sm font-semibold">Extra details (optional)<input value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="Stairs, fragile items, timing" className="mt-1 w-full rounded border border-border bg-secondary px-3 py-2 font-normal" /></label>
          </div>
          {message && <p className="rounded border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p>}
          <button disabled={saving} className="rounded bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Sending request...' : user ? 'Request transport' : 'Sign in to request transport'}</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
