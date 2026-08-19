import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import api, * as apiClient from '../../lib/api';
import ListingDialog from './ListingDialog';
import {
  X, ChevronRight, Package, TrendingUp, Clock, CheckCircle, XCircle,
  Edit2, Trash2, Plus, Phone, Mail, MessageCircle, ExternalLink, LogOut
} from 'lucide-react';

interface Listing {
  id: string;
  name?: string;
  service?: string;
  type: 'garage' | 'mechanic' | 'transport' | 'car-hire' | 'bike-hire';
  imageUrl?: string;
  description?: string;
  price?: string;
  discount?: number;
  availability?: string;
  isAvailable?: boolean;
  label?: string;
  location?: string;
  phone?: string;
  specialty?: string;
  vehicleType?: string;
}

interface Booking {
  id: string;
  customerId: string;
  providerType: string;
  serviceType?: string;
  status: 'pending' | 'approved' | 'rejected';
  customerEmail: string;
  customerPhone?: string;
  customerWhatsapp?: string;
  customerName?: string;
  dateRequested: string;
  dateApproved?: string;
  notes?: string;
}

interface DashboardStats {
  totalListings: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  mostPopularService?: string;
  mostPopularCount: number;
}

type DashboardTab = 'overview' | 'listings' | 'bookings' | 'profile' | 'stats';

export default function ProviderDashboard({ onClose, onLogout }: { onClose: () => void; onLogout?: () => void }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', whatsapp: '', location: '' });
  const [listingDialogOpen, setListingDialogOpen] = useState(false);
  const [listingDialogMode, setListingDialogMode] = useState<'create' | 'edit'>('create');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [bookingNote, setBookingNote] = useState('');

  const normalizeProfile = (profileData: any) => ({
    userId: profileData?.userId ?? profileData?.userid ?? null,
    firstName: profileData?.firstName ?? profileData?.firstname ?? '',
    lastName: profileData?.lastName ?? profileData?.lastname ?? '',
    phone: profileData?.phone ?? '',
    whatsapp: profileData?.whatsapp ?? '',
    location: profileData?.location ?? '',
  });

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [dashboardData, profileData] = await Promise.all([
        api.getProviderDashboard(),
        api.getProviderProfile(),
      ]);

      const normalizedProfile = normalizeProfile(profileData);

      setListings(dashboardData.listings || []);
      setBookings(dashboardData.bookings || []);
      setStats(dashboardData.stats || null);
      setProfile(normalizedProfile);
      setProfileForm({
        firstName: normalizedProfile.firstName || '',
        lastName: normalizedProfile.lastName || '',
        phone: normalizedProfile.phone || '',
        whatsapp: normalizedProfile.whatsapp || '',
        location: normalizedProfile.location || '',
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleBookingStatusChange = async (bookingId: string, newStatus: string, notes?: string) => {
    try {
      const updated = await api.updateBookingStatus(bookingId, newStatus, notes);
      const nextBookings = bookings.map(b => b.id === bookingId ? { ...b, ...updated } : b);
      setBookings(nextBookings);
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, ...updated });
      }
      setBookingNote('');
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const handleProfileSave = async () => {
    try {
      const updated = await api.updateProviderProfile(profileForm);
      const normalized = normalizeProfile(updated);
      setProfile(normalized);
      setProfileForm({
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        phone: normalized.phone,
        whatsapp: normalized.whatsapp,
        location: normalized.location,
      });
      setEditProfile(false);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your provider account and all related listings. Continue?');
    if (!confirmed) return;

    try {
      await api.deleteProviderAccount();
      await logout();
      onLogout?.();
    } catch (err) {
      console.error('Failed to delete account:', err);
      window.alert('Unable to delete account right now. Please try again.');
    }
  };

  const handleDeleteListing = async (listing: Listing) => {
    try {
      if (listing.type === 'garage') {
        await apiClient.deleteGarage(listing.id);
      } else if (listing.type === 'mechanic') {
        await apiClient.deleteMechanic(listing.id);
      } else if (listing.type === 'transport') {
        await apiClient.deleteTransport(listing.id);
      } else {
        await apiClient.deleteGarage(listing.id);
      }
      setListings(current => current.filter(item => item.id !== listing.id));
      if (selectedListing?.id === listing.id) setSelectedListing(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to delete listing:', err);
    }
  };

  const handleListingSaved = (item: any) => {
    const normalized = {
      ...item,
      type: item.type || item.serviceType || (listingDialogMode === 'edit' ? selectedListing?.type : 'garage'),
      name: item.name || item.company || item.type || 'Service',
    };

    setListings(current => {
      if (listingDialogMode === 'edit' && selectedListing) {
        return current.map(entry => entry.id === selectedListing.id ? { ...entry, ...normalized } : entry);
      }
      return [normalized, ...current];
    });
    setSelectedListing(null);
    loadDashboardData();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (bookingFilter === 'all') return true;
    return booking.status === bookingFilter;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex flex-col">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold text-foreground text-lg">Provider Hub</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '📊' },
              { id: 'listings' as const, label: 'Listings', icon: '📦' },
              { id: 'bookings' as const, label: 'Bookings', icon: '📋' },
              { id: 'stats' as const, label: 'Statistics', icon: '📈' },
              { id: 'profile' as const, label: 'Profile', icon: '👤' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </nav>

          {/* Profile Summary with Logout */}
          <div className="p-4 border-t border-border bg-secondary">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Welcome</p>
              <p className="text-lg font-bold text-foreground">
                Hello {profile?.firstName || user?.email?.split('@')[0] || 'Provider'}
              </p>
              <p className="text-xs text-primary mt-1 font-medium">Provider Account</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 border border-red-500/30 font-semibold text-sm transition-colors"
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border px-8 py-5 flex items-center justify-between bg-secondary/50">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'listings' && 'My Listings'}
                {activeTab === 'bookings' && 'Booking Orders'}
                {activeTab === 'stats' && 'Performance Analytics'}
                {activeTab === 'profile' && 'Profile Settings'}
              </h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Total Listings</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.totalListings || 0}</p>
                      </div>
                      <Package className="text-primary opacity-50" size={32} />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Total Bookings</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stats?.totalBookings || 0}</p>
                      </div>
                      <MessageCircle className="text-primary opacity-50" size={32} />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Pending</p>
                        <p className="text-3xl font-bold text-yellow-400 mt-2">{stats?.pendingBookings || 0}</p>
                      </div>
                      <Clock className="text-yellow-400 opacity-50" size={32} />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Approved</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">{stats?.approvedBookings || 0}</p>
                      </div>
                      <CheckCircle className="text-green-400 opacity-50" size={32} />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Rejected</p>
                        <p className="text-3xl font-bold text-red-400 mt-2">{stats?.rejectedBookings || 0}</p>
                      </div>
                      <XCircle className="text-red-400 opacity-50" size={32} />
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Recent Bookings</h2>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary rounded border border-border/50">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{booking.customerName || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">{booking.serviceType || 'Service Request'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setActiveTab('bookings');
                            }}
                            className="text-primary hover:text-primary/80"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LISTINGS TAB */}
            {activeTab === 'listings' && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">Manage Your Listings</h2>
                  <button
                    onClick={() => {
                      setSelectedListing(null);
                      setListingDialogMode('create');
                      setListingDialogOpen(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-[#e04a00]"
                  >
                    <Plus size={18} /> Add New Service
                  </button>
                </div>

                {listings.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <p className="text-muted-foreground mb-4">No listings yet. Create your first service listing to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map(listing => (
                      <div key={listing.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors group">
                        <div className="relative h-40 bg-secondary overflow-hidden">
                          {listing.label && (
                            <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              {listing.label}
                            </div>
                          )}
                          {listing.imageUrl ? (
                            <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Package size={40} className="text-primary/40" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-foreground text-sm mb-1">{listing.name || 'Service'}</h3>
                          <p className="text-xs text-primary font-medium mb-2">{listing.type.toUpperCase()}</p>
                          {listing.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{listing.description}</p>
                          )}
                          {listing.price && (
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {listing.price}{listing.discount ? ` · ${listing.discount}% off` : ''}
                            </p>
                          )}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setListingDialogMode('edit');
                                setListingDialogOpen(true);
                              }}
                              className="flex-1 text-xs font-semibold py-2 rounded border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-1"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing)}
                              className="flex-1 text-xs font-semibold py-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-foreground mb-4">Booking Requests</h2>
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setBookingFilter(status)}
                        className={`px-4 py-2 rounded text-sm font-medium border transition-all ${
                          bookingFilter === status
                            ? 'bg-primary text-white border-primary'
                            : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="bg-card border border-border rounded-lg p-12 text-center">
                    <p className="text-muted-foreground">No booking requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map(booking => (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{booking.customerName || 'Customer Request'}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{booking.serviceType || 'Service'}</p>
                          </div>
                          <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-3">
                          <div>
                            <p className="font-medium text-foreground">{booking.customerEmail}</p>
                            <Mail size={14} className="inline mt-1" />
                          </div>
                          {booking.customerPhone && (
                            <div>
                              <p className="font-medium text-foreground">{booking.customerPhone}</p>
                              <Phone size={14} className="inline mt-1" />
                            </div>
                          )}
                          {booking.customerWhatsapp && (
                            <div>
                              <p className="font-medium text-foreground">{booking.customerWhatsapp}</p>
                              <MessageCircle size={14} className="inline mt-1" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {new Date(booking.dateRequested).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp size={20} /> Approval Rate
                    </h3>
                    <p className="text-4xl font-bold text-green-400">{stats?.approvalRate ?? 0}%</p>
                    <p className="text-xs text-muted-foreground mt-2">Based on recent bookings</p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-4">Most Popular Service</h3>
                    <p className="text-2xl font-bold text-primary">{stats?.mostPopularService || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground mt-2">{stats?.mostPopularCount || 0} bookings</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold text-foreground mb-4">Booking Breakdown</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Approved</span>
                        <span className="font-semibold text-foreground">{stats?.approvedBookings || 0}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-green-400" style={{ width: `${(stats?.approvedBookings || 0) / (stats?.totalBookings || 1) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Pending</span>
                        <span className="font-semibold text-foreground">{stats?.pendingBookings || 0}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400" style={{ width: `${(stats?.pendingBookings || 0) / (stats?.totalBookings || 1) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Rejected</span>
                        <span className="font-semibold text-foreground">{stats?.rejectedBookings || 0}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: `${(stats?.rejectedBookings || 0) / (stats?.totalBookings || 1) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="p-8">
                <div className="max-w-2xl">
                  <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-foreground">Account Information</h2>
                      <button
                        onClick={() => setEditProfile(!editProfile)}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Edit2 size={16} /> {editProfile ? 'Cancel' : 'Edit'}
                      </button>
                    </div>

                    {editProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="First Name"
                            value={profileForm.firstName}
                            onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-border bg-secondary text-foreground text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Last Name"
                            value={profileForm.lastName}
                            onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-border bg-secondary text-foreground text-sm"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Service Location (e.g., Nairobi, Westlands)"
                          value={profileForm.location}
                          onChange={e => setProfileForm({ ...profileForm, location: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-border bg-secondary text-foreground text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-border bg-secondary text-foreground text-sm"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp Number (optional)"
                          value={profileForm.whatsapp}
                          onChange={e => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-border bg-secondary text-foreground text-sm"
                        />
                        <button
                          onClick={handleProfileSave}
                          className="w-full bg-primary text-white py-2.5 rounded font-semibold hover:bg-[#e04a00]"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="w-full bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded font-semibold hover:bg-red-500/30"
                        >
                          Delete Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Email</p>
                          <p className="text-foreground font-medium">{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Name</p>
                          <p className="text-foreground font-medium">{profileForm.firstName || profileForm.lastName ? `${profileForm.firstName} ${profileForm.lastName}`.trim() : 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Service Location</p>
                          <p className="text-foreground font-medium">{profileForm.location || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Phone</p>
                          <p className="text-foreground font-medium">{profileForm.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">WhatsApp</p>
                          <p className="text-foreground font-medium">{profileForm.whatsapp || 'Not provided'}</p>
                        </div>
                      </div>
                    )}

                    {!editProfile && (
                      <button
                        onClick={handleDeleteAccount}
                        className="mt-6 w-full bg-red-500/20 text-red-400 border border-red-500/30 py-2.5 rounded font-semibold hover:bg-red-500/30"
                      >
                        Delete Account
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        <ListingDialog
          open={listingDialogOpen}
          mode={listingDialogMode}
          initialItem={selectedListing}
          providerContact={profileForm.phone || profile?.phone}
          onOpenChange={(open) => {
            setListingDialogOpen(open);
            if (!open) {
              setSelectedListing(null);
            }
          }}
          onSaved={handleListingSaved}
        />

        {/* Booking Detail Modal */}
        {selectedBooking && activeTab === 'bookings' && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
            <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Booking Details</h2>
                <button onClick={() => setSelectedBooking(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Customer Name</p>
                  <p className="text-foreground font-semibold">{selectedBooking.customerName || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Status</p>
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getStatusBadge(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase font-medium mb-1 block">Notes</label>
                  <textarea
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground min-h-[90px]"
                    placeholder="Optional note for the customer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1 flex items-center gap-1">
                      <Mail size={12} /> Email
                    </p>
                    <p className="text-sm text-foreground break-all">{selectedBooking.customerEmail}</p>
                  </div>
                  {selectedBooking.customerPhone && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-1 flex items-center gap-1">
                        <Phone size={12} /> Phone
                      </p>
                      <p className="text-sm text-foreground">{selectedBooking.customerPhone}</p>
                    </div>
                  )}
                </div>

                {selectedBooking.customerWhatsapp && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1 flex items-center gap-1">
                      <MessageCircle size={12} /> WhatsApp
                    </p>
                    <a
                      href={`https://wa.me/${selectedBooking.customerWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                    >
                      {selectedBooking.customerWhatsapp}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Service Type</p>
                  <p className="text-foreground">{selectedBooking.serviceType || 'General Service'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Requested Date</p>
                  <p className="text-foreground">{new Date(selectedBooking.dateRequested).toLocaleString()}</p>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Notes</p>
                    <p className="text-foreground text-sm">{selectedBooking.notes}</p>
                  </div>
                )}

                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleBookingStatusChange(selectedBooking.id, 'approved', bookingNote)}
                      className="flex-1 bg-green-500/20 text-green-400 py-2.5 rounded font-semibold hover:bg-green-500/30"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleBookingStatusChange(selectedBooking.id, 'rejected', bookingNote)}
                      className="flex-1 bg-red-500/20 text-red-400 py-2.5 rounded font-semibold hover:bg-red-500/30"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
