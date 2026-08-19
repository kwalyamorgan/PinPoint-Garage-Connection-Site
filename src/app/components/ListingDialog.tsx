import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import api from '../../lib/api';
import { Upload, X } from 'lucide-react';

const LOCATIONS = [
  "Allsops",
  "Garden City",
  "Githurai 44",
  "Githurai 45",
  "Kasarani",
  "Lumumba Drive",
  "Mirema",
  "Northern Bypass",
  "Roysambu",
  "TRM",
  "USIU Road",
];

const VEHICLE_TYPES = [
  "Lorry",
  "Pick up",
  "Van",
  "Truck",
  "Trailer",
  "Container",
];

type ServiceType = 'garage' | 'mechanic' | 'transport' | 'car-hire' | 'bike-hire';

function normalizeServiceType(value: unknown): ServiceType {
  return value === 'mechanic' || value === 'transport' || value === 'car-hire' || value === 'bike-hire'
    ? value
    : 'garage';
}

export default function ListingDialog({
  open,
  onOpenChange,
  onSaved,
  initialItem,
  mode = 'create',
  providerContact,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (item: any) => void;
  initialItem?: any;
  mode?: 'create' | 'edit';
  providerContact?: string;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>('garage');
  const [vehicleType, setVehicleType] = useState('Lorry');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [availability, setAvailability] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const nextType = normalizeServiceType(initialItem?.serviceType ?? initialItem?.type);
    setServiceType(nextType);
    setName(initialItem?.name || initialItem?.company || initialItem?.type || '');
    setLocation(initialItem?.location || initialItem?.address || '');
    setPhone(initialItem?.phone || providerContact || '');
    setSpecialty(initialItem?.specialty || '');
    setImageUrl(initialItem?.imageUrl || '');
    setImageFile(null);
    setImagePreview(initialItem?.imageUrl || '');
    setDescription(initialItem?.description || '');
    setPrice(initialItem?.price || '');
    setDiscount(initialItem?.discount?.toString() || '');
    setAvailability(initialItem?.availability || '');
    setIsAvailable(initialItem?.isAvailable !== false);
    setLabel(initialItem?.label || '');
    setVehicleType(initialItem?.vehicleType || 'Lorry');
  }, [open, initialItem]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (): Promise<string> => {
    if (!imageFile) return imageUrl;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const upload = await api.getCloudinaryUploadSignature();
      formData.append('api_key', upload.apiKey);
      formData.append('timestamp', String(upload.timestamp));
      formData.append('folder', upload.folder);
      formData.append('signature', upload.signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${upload.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed');
      }

      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new Error('Failed to upload image to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name/Title is required');
      return;
    }

    if (!location.trim()) {
      setError('Location is required');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary();
      }

      const basePayload = {
        imageUrl: finalImageUrl,
        description,
        price,
        discount,
        availability,
        isAvailable,
        label,
        location,
        phone: phone || providerContact,
      };

      let item: any = null;

      if (serviceType === 'garage') {
        const payload = { name, address: location, serviceType, ...basePayload };
        item = mode === 'edit' && initialItem
          ? await api.updateGarage(initialItem.id, payload)
          : await api.createGarage(payload);
      } else if (serviceType === 'mechanic') {
        const payload = {
          name,
          garageId: location,
          specialty: specialty || 'General repairs',
          serviceType,
          ...basePayload,
        };
        item = mode === 'edit' && initialItem
          ? await api.updateMechanic(initialItem.id, payload)
          : await api.createMechanic(payload);
      } else if (serviceType === 'transport') {
        const payload = {
          type: vehicleType,
          company: name,
          serviceType,
          ...basePayload,
        };
        item = mode === 'edit' && initialItem
          ? await api.updateTransport(initialItem.id, payload)
          : await api.createTransport(payload);
      } else if (serviceType === 'car-hire') {
        const payload = {
          name,
          type: 'car-hire',
          serviceType,
          ...basePayload,
        };
        item = mode === 'edit' && initialItem
          ? await api.updateGarage(initialItem.id, payload)
          : await api.createGarage(payload);
      } else if (serviceType === 'bike-hire') {
        const payload = {
          name,
          type: 'bike-hire',
          serviceType,
          ...basePayload,
        };
        item = mode === 'edit' && initialItem
          ? await api.updateGarage(initialItem.id, payload)
          : await api.createGarage(payload);
      }

      onSaved({ ...item, type: serviceType });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || (mode === 'edit' ? 'Failed to save changes' : 'Failed to create listing'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit service' : 'List a service'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update your listing details.' : 'Add your service so customers can find you.'}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          {/* Service Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              disabled={mode === 'edit'}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-foreground"
            >
              <option value="garage">Garage</option>
              <option value="mechanic">Mechanic</option>
              <option value="transport">Transport</option>
              <option value="car-hire">Car Hire</option>
              <option value="bike-hire">Bike Hire</option>
            </select>
          </div>

          {/* Vehicle Type for Transport */}
          {serviceType === 'transport' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-foreground"
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Name/Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name / Title</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name or service title" />
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Service Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-foreground"
            >
              <option value="">Select a location</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Specialty for Mechanics */}
          {serviceType === 'mechanic' && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Specialty</label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g., Engine repair, Electrical work" />
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Phone Contact</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Provider phone from profile" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Service Image</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded border border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setImageUrl('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/50 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload size={24} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG (optimized by Cloudinary)</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 min-h-[80px] text-foreground placeholder-muted-foreground"
              placeholder="Describe what you offer"
            />
          </div>

          {/* Price and Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Price</label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="KSh 2500" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Discount %</label>
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="10" />
            </div>
          </div>

          {/* Availability and Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Availability</label>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`w-full px-3 py-2 rounded font-medium transition ${
                  isAvailable
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </button>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Label</label>
              <select value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-secondary border border-border rounded px-3 py-2 text-foreground">
                <option value="">None</option>
                <option value="Premium">Premium</option>
                <option value="New">New</option>
                <option value="Brand">Brand</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Availability Details</label>
            <Input
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="e.g. Mon-Sat, 8:00 AM-6:00 PM"
            />
          </div>

          {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || uploading}
              >
                {uploading ? 'Uploading...' : loading ? 'Saving...' : mode === 'edit' ? 'Save' : 'Create'}
              </Button>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

