import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import api from '../../lib/api';

export default function ListingDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (item: any) => void }) {
  const [kind, setKind] = useState<'garage'|'mechanic'|'transport'>('garage');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!name) { setError('Name required'); return; }
    setLoading(true);
    try {
      if (kind === 'garage') {
        const res = await api.createGarage({ name, address, phone });
        if (!res.ok) throw new Error('create failed');
        const item = await res.json();
        onCreated(item);
      } else if (kind === 'mechanic') {
        const payload = {
          name,
          garageId: address || 'garage-unknown',
          specialty: specialty || 'General repairs',
          phone,
        };
        const res = await api.createMechanic(payload);
        if (!res.ok) throw new Error('create failed');
        const item = await res.json();
        onCreated(item);
      } else {
        const res = await api.createTransport({ type: name, company: address, phone });
        if (!res.ok) throw new Error('create failed');
        const item = await res.json();
        onCreated(item);
      }
      onOpenChange(false);
    } catch (err) {
      setError('Failed to create');
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>List a service</DialogTitle>
          <DialogDescription>Add your service so customers can find you.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-3" onSubmit={submit}>
          <div>
            <label className="text-sm text-muted-foreground">Type</label>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="w-full bg-secondary border border-border rounded px-3 py-2">
              <option value="garage">Garage</option>
              <option value="mechanic">Mechanic</option>
              <option value="transport">Transport</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Name / Title</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">{kind === 'mechanic' ? 'Garage id / location' : kind === 'transport' ? 'Company / service area' : 'Address / area'}</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">{kind === 'mechanic' ? 'Specialty' : 'Phone'}</label>
            {kind === 'mechanic' ? (
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            ) : (
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            )}
          </div>

          {kind !== 'mechanic' && (
            <div>
              <label className="text-sm text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}

          {error && <div className="text-destructive text-sm">{error}</div>}

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button type="submit" className="flex-1" disabled={loading}>Create</Button>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
