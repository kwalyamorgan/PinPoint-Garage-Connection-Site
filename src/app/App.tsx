import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import AuthDialog from "./components/AuthDialog";
import ListingDialog from "./components/ListingDialog";
import ProviderDashboard from "./components/ProviderDashboard";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import {
  MapPin, Wrench, Truck, Car, Bike, Clock, Phone, Mail, ChevronRight, ChevronDown,
  Star, Shield, Zap, Search, Menu, X, ArrowRight, CheckCircle, Calendar, BarChart3
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceTab = "garages" | "mechanics" | "transport" | "car-hire" | "bike-hire";

// ─── Data ─────────────────────────────────────────────────────────────────────

// fallback static data (used until API responds or if offline)
const fallbackImageBase = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&auto=format&fit=crop&q=80";

const optimizeImageUrl = (source: string, width = 900, height = 560) => {
  if (!source) return fallbackImageBase;
  if (source.includes('res.cloudinary.com') && source.includes('/upload/')) {
    return source.replace('/upload/', `/upload/f_auto,q_auto:good,c_fill,w_${width},h_${height}/`);
  }
  return source;
};

const garagesStatic: any[] = [];

const mechanicsStatic: any[] = [];

const transportStatic: any[] = [];

const owner = {
  name: "Isaac Wambua",
  title: "Finance Student at USIU",
};

const supportNumber = "+254708614916";
const whatsappLink = `https://wa.me/254708614916?text=${encodeURIComponent("Hi PinPoint support, I need help with a service.")}`;

const normalizeGarage = (item: any, index: number = 0) => ({
  id: item?.id ?? `garage-${index}`,
  ownerId: item?.ownerId ?? item?.ownerid ?? null,
  name: item?.name ?? `Garage ${index + 1}`,
  rating: Number(item?.rating ?? 4.7),
  reviews: Number(item?.reviews ?? 0),
  distance: item?.distance ?? "Nearby",
  specialty: item?.specialty ?? item?.service ?? "General service",
  location: item?.location ?? item?.address ?? "Nairobi",
  open: item?.open ?? (item?.availability ? String(item.availability).toLowerCase().includes('open') : true),
  phone: item?.phone ?? "+254700000000",
  description: item?.description ?? "",
  price: item?.price ?? item?.pricing ?? "",
  discount: Number(item?.discount ?? 0),
  availability: item?.availability ?? "Available now",
  isAvailable: (item?.isAvailable ?? item?.isavailable) !== false,
  serviceType: item?.serviceType ?? item?.servicetype ?? "garage",
  label: item?.label ?? "",
  imageUrl: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? "",
  img: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? fallbackImageBase,
});

const normalizeMechanic = (item: any, index: number = 0, imageList: string[] = []) => ({
  id: item?.id ?? `mechanic-${index}`,
  ownerId: item?.ownerId ?? item?.ownerid ?? null,
  serviceType: 'mechanic',
  type: 'mechanic',
  name: item?.name ?? `Mechanic ${index + 1}`,
  specialty: item?.specialty ?? item?.service ?? "General repairs",
  rating: Number(item?.rating ?? 4.8),
  reviews: Number(item?.reviews ?? item?.jobs ?? 0),
  jobs: Number(item?.jobs ?? 0),
  available: item?.available ?? (item?.availability ? !String(item.availability).toLowerCase().includes('busy') : true),
  location: item?.location ?? item?.address ?? item?.garageId ?? item?.garageid ?? "Nairobi",
  phone: item?.phone ?? "+254700000000",
  description: item?.description ?? "",
  price: item?.price ?? item?.pricing ?? "",
  discount: Number(item?.discount ?? 0),
  availability: item?.availability ?? "Available now",
  isAvailable: (item?.isAvailable ?? item?.isavailable) !== false,
  label: item?.label ?? "",
  imageUrl: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? "",
  img: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? imageList[index % imageList.length] ?? fallbackImageBase,
});

const normalizeTransport = (item: any, index: number = 0) => ({
  id: item?.id ?? `transport-${index}`,
  ownerId: item?.ownerId ?? item?.ownerid ?? null,
  serviceType: 'transport',
  name: item?.name ?? item?.company ?? `Transport ${index + 1}`,
  type: item?.type ?? item?.service ?? "Moving service",
  capacity: item?.capacity ?? "Flexible",
  price: item?.price ?? item?.pricing ?? "From KSh 500",
  imageUrl: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? "",
  img: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? item?.photo ?? fallbackImageBase,
  area: item?.location ?? item?.area ?? item?.address ?? item?.company ?? "Nairobi",
  location: item?.location ?? item?.area ?? item?.address ?? "Nairobi",
  vehicleType: item?.vehicleType ?? item?.vehicletype ?? item?.type ?? "",
  phone: item?.phone ?? "+254700000000",
  rating: Number(item?.rating ?? 0),
  reviews: Number(item?.reviews ?? 0),
  description: item?.description ?? "",
  discount: Number(item?.discount ?? 0),
  availability: item?.availability ?? "Available now",
  isAvailable: (item?.isAvailable ?? item?.isavailable) !== false,
  label: item?.label ?? "",
});

const normalizeHire = (item: any, index: number, kind: "car-hire" | "bike-hire") => ({
  id: item?.id ?? `${kind}-${index}`,
  ownerId: item?.ownerId ?? item?.ownerid ?? null,
  serviceType: kind,
  name: item?.name ?? item?.model ?? `${kind === "car-hire" ? "Car" : "Bike"} ${index + 1}`,
  model: item?.name ?? item?.model ?? `${kind === "car-hire" ? "Car" : "Bike"} ${index + 1}`,
  type: item?.serviceType ?? item?.servicetype ?? item?.type ?? kind,
  base: item?.location ?? item?.address ?? item?.base ?? item?.pickup ?? "Nairobi",
  pickup: item?.location ?? item?.address ?? item?.pickup ?? item?.base ?? "Nairobi",
  price: Number(item?.price ?? 0),
  hourly: Number(item?.hourly ?? item?.price ?? 0),
  daily: Number(item?.daily ?? item?.price ?? 0),
  seats: item?.seats ?? "",
  transmission: item?.transmission ?? "",
  description: item?.description ?? "",
  phone: item?.phone ?? "+254700000000",
  rating: Number(item?.rating ?? 0),
  reviews: Number(item?.reviews ?? 0),
  imageUrl: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? "",
  img: item?.imageUrl ?? item?.imageurl ?? item?.img ?? item?.image ?? fallbackImageBase,
  isAvailable: (item?.isAvailable ?? item?.isavailable) !== false,
  tag: item?.label ?? item?.tag ?? "",
});

// ─── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= Math.round(rating) ? "fill-[#FF5500] text-[#FF5500]" : "fill-transparent text-[#444]"}
        />
      ))}
    </span>
  );
}

function ProviderReviews({ provider }: { provider: any }) {
  const reviewCount = Number(provider.reviews ?? 0);
  const rating = Number(provider.rating ?? 0);
  const hasRating = rating > 0;

  return (
    <details className="mt-3 border-t border-border pt-3 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-muted-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {hasRating ? <><Stars rating={rating} /><span className="text-foreground">{rating.toFixed(1)}</span></> : <span>No ratings yet</span>}
          <span>({reviewCount} {reviewCount === 1 ? "review" : "reviews"})</span>
        </span>
        <span className="flex items-center gap-1 text-primary"><span>View ratings & reviews</span><ChevronDown size={14} /></span>
      </summary>
      <div className="mt-2 rounded bg-secondary/70 px-3 py-2 leading-relaxed text-muted-foreground">
        {reviewCount > 0
          ? `${rating.toFixed(1)} out of 5 from ${reviewCount} customer ${reviewCount === 1 ? "review" : "reviews"}.`
          : "Reviews appear here after customers complete and review a booking."}
      </div>
    </details>
  );
}

function ProviderDetailDialog({
  open,
  onOpenChange,
  provider,
  onSignIn,
  onBook,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: any | null;
  onSignIn: () => void;
  onBook: () => void;
}) {
  if (!provider) return null;

  const isLoggedIn = Boolean(provider._loggedIn ?? true);

  return (
    <div className={open ? "block" : "hidden"}>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-0 shadow-2xl">
          <div className="relative h-44 bg-secondary">
            <img src={optimizeImageUrl(provider.img || fallbackImageBase, 1000, 560)} alt={provider.name || provider.model || 'Provider'} className={`h-full w-full object-cover ${!provider.isAvailable ? 'opacity-40' : 'opacity-80'}`} />
            {!provider.isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-white font-bold text-xl">Unavailable</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
              aria-label="Close provider details"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {provider.type || provider.specialty || "Provider"}
                </div>
                <h3 className="mt-1 text-2xl font-black text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {provider.name || provider.model || "Service provider"}
                </h3>
              </div>
              {provider.open !== undefined ? (
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${provider.open ? "border-green-500/30 bg-green-500/15 text-green-400" : "border-red-500/30 bg-red-500/15 text-red-400"}`}>
                  {provider.open ? "Open" : "Closed"}
                </span>
              ) : (
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${provider.isAvailable ? "border-green-500/30 bg-green-500/15 text-green-400" : "border-red-500/30 bg-red-500/15 text-red-400"}`}>
                  {provider.isAvailable ? "Available" : "Unavailable"}
                </span>
              )}
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              {(provider.location || provider.area || provider.address) && (
                <p>{provider.location || provider.area || provider.address}</p>
              )}
              {provider.rating !== undefined && (
                <div className="flex items-center gap-2">
                  <Stars rating={provider.rating} />
                  <span>{provider.rating} ({provider.reviews || provider.jobs || 0} reviews)</span>
                </div>
              )}
              {provider.specialty && <p><span className="font-semibold text-foreground">Specialty:</span> {provider.specialty}</p>}
              {provider.vehicleType && <p><span className="font-semibold text-foreground">Vehicle:</span> {provider.vehicleType}</p>}
              {provider.capacity && <p><span className="font-semibold text-foreground">Capacity:</span> {provider.capacity}</p>}
              {provider.seats && <p><span className="font-semibold text-foreground">Seats:</span> {provider.seats}</p>}
              {provider.transmission && <p><span className="font-semibold text-foreground">Transmission:</span> {provider.transmission}</p>}
              {provider.pickup && <p><span className="font-semibold text-foreground">Pickup:</span> {provider.pickup}</p>}
              {provider.description && <p><span className="font-semibold text-foreground">Description:</span> {provider.description}</p>}
              {provider.price && <p><span className="font-semibold text-foreground">Price:</span> {provider.price}</p>}
              {provider.hourly ? <p><span className="font-semibold text-foreground">Hourly rate:</span> KSh {Number(provider.hourly).toLocaleString()}</p> : null}
              {provider.daily ? <p><span className="font-semibold text-foreground">Daily rate:</span> KSh {Number(provider.daily).toLocaleString()}</p> : null}
              {provider.discount ? <p><span className="font-semibold text-foreground">Discount:</span> {provider.discount}% off</p> : null}
              {provider.availability && <p><span className="font-semibold text-foreground">Availability:</span> {provider.availability}</p>}
              {provider.label && <p><span className="font-semibold text-foreground">Label:</span> {provider.label}</p>}
              {provider.phone && <p><span className="font-semibold text-foreground">Phone:</span> {provider.phone}</p>}
            </div>

            <div className="mt-5 flex gap-2">
              {!isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onSignIn();
                  }}
                  className="flex-1 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e04a00]"
                >
                  Sign in to book
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onBook();
                  }}
                  className="flex-1 rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e04a00]"
                >
                  Continue
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Local mechanic images (randomly assigned)
  const mechanicImages = [
    fallbackImageBase,
    fallbackImageBase,
    fallbackImageBase,
    fallbackImageBase,
    fallbackImageBase,
  ];

  const [activeTab, setActiveTab] = useState<ServiceTab>("garages");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [garagesState, setGaragesState] = useState<any[]>(garagesStatic.map((item) => ({ ...item, img: item.img || fallbackImageBase })));
  const [mechanicsState, setMechanicsState] = useState<any[]>(mechanicsStatic.map((item) => ({ ...item, img: item.img || fallbackImageBase })));
  const [transportState, setTransportState] = useState<any[]>(transportStatic.map((item) => ({ ...item, img: item.img || fallbackImageBase })));
  const [carHireState, setCarHireState] = useState<any[]>([]);
  const [bikeHireState, setBikeHireState] = useState<any[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [userDashboardOpen, setUserDashboardOpen] = useState(false);
  const [scrollAuthPromptOpen, setScrollAuthPromptOpen] = useState(false);

  // auth
  const auth = useAuth();
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminDashboard auth={auth} />;
  }
  const showPublicHomepage = !auth.user || auth.user.role !== 'user';
  const servicesVisible = showPublicHomepage;

  useEffect(() => {
    if (auth.user || authOpen) {
      setScrollAuthPromptOpen(false);
      return;
    }

    const seenSessionKey = 'pinpoint-scroll-auth-prompt-seen';
    const hasSeenPrompt = sessionStorage.getItem(seenSessionKey) === 'true';

    if (hasSeenPrompt) {
      setScrollAuthPromptOpen(false);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 420) {
        setScrollAuthPromptOpen(true);
        sessionStorage.setItem(seenSessionKey, 'true');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [auth.user, authOpen]);

  const mechanicsWithImages = useMemo(() => {
    // Fisher-Yates shuffle
    const imgs = [...mechanicImages];
    for (let i = imgs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    }
    return mechanicsState.map((m, idx) => ({
      ...m,
      img: m.img || imgs[idx % imgs.length],
    }));
  }, [mechanicsState]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const g = await api.fetchGarages();
        const m = await api.fetchMechanics();
        const t = await api.fetchTransport();
        if (!mounted) return;

        const normalizedGarages = Array.isArray(g) ? g.map((item, index) => normalizeGarage(item, index)) : [];
        const nextGarages = normalizedGarages.filter((item) => item.serviceType === 'garage');
        const nextCars = normalizedGarages
          .filter((item) => item.serviceType === 'car-hire')
          .map((item, index) => normalizeHire(item, index, 'car-hire'));
        const nextBikes = normalizedGarages
          .filter((item) => item.serviceType === 'bike-hire')
          .map((item, index) => normalizeHire(item, index, 'bike-hire'));
        const nextMechanics = Array.isArray(m) ? m.map((item, index) => normalizeMechanic(item, index, mechanicImages)) : mechanicsStatic;
        const nextTransport = Array.isArray(t) ? t.map((item, index) => normalizeTransport(item, index)) : transportStatic;

        setGaragesState(nextGarages);
        setMechanicsState(nextMechanics);
        setTransportState(nextTransport);
        setCarHireState(nextCars);
        setBikeHireState(nextBikes);
      } catch (err) {
        console.warn('API fetch failed, using static data', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasFilter = Boolean(normalizedQuery || selectedLocation);
  const filterText = (value?: string) => normalizedQuery === "" || (value?.toLowerCase().includes(normalizedQuery) ?? false);
  const filterLocation = (location?: string) => !selectedLocation || location === selectedLocation;

  const filteredGarages = useMemo(
    () => garagesState.filter((g) => filterLocation(g.location) && (filterText(g.name) || filterText(g.specialty) || filterText(g.location))),
    [garagesState, searchQuery, selectedLocation]
  );

  const filteredMechanics = useMemo(
    () => mechanicsState.filter((m) => filterLocation(m.location) && (filterText(m.name) || filterText(m.specialty) || filterText(m.location))),
    [mechanicsState, searchQuery, selectedLocation]
  );

  const filteredTransport = useMemo(
    () => transportState.filter((t) => filterLocation(t.area) && (filterText(t.name) || filterText(t.type) || filterText(t.area))),
    [transportState, searchQuery, selectedLocation]
  );

  const filteredCars = useMemo(
    () => carHireState.filter((c) => filterLocation(c.base) && (filterText(c.model) || filterText(c.type) || filterText(c.base))),
    [carHireState, searchQuery, selectedLocation]
  );

  const filteredBikes = useMemo(
    () => bikeHireState.filter((b) => filterLocation(b.pickup) && (filterText(b.model) || filterText(b.type) || filterText(b.pickup))),
    [bikeHireState, searchQuery, selectedLocation]
  );

  const activeGarages = hasFilter ? filteredGarages : garagesState;
  const activeMechanics = hasFilter ? filteredMechanics : mechanicsWithImages;
  const activeTransport = hasFilter ? filteredTransport : transportState;
  const activeCars = hasFilter ? filteredCars : carHireState;
  const activeBikes = hasFilter ? filteredBikes : bikeHireState;

  const availableLocations = useMemo(() => {
    const providerLocations = [
      ...garagesState.map((garage) => garage.location),
      ...mechanicsState.map((mechanic) => mechanic.location),
      ...transportState.map((transport) => transport.location || transport.area),
      ...carHireState.map((car) => car.base),
      ...bikeHireState.map((bike) => bike.pickup),
    ];

    return Array.from(new Set(
      providerLocations
        .map((location) => String(location || '').trim())
        .filter(Boolean)
    )).sort((first, second) => first.localeCompare(second));
  }, [garagesState, mechanicsState, transportState, carHireState, bikeHireState]);

  const tabs: { id: ServiceTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "garages", label: "Garages", icon: <Wrench size={16} />, count: garagesState.length },
    { id: "mechanics", label: "Mechanics", icon: <Shield size={16} />, count: mechanicsState.length },
    { id: "transport", label: "Transport", icon: <Truck size={16} />, count: transportState.length },
    { id: "car-hire", label: "Car Hire", icon: <Car size={16} />, count: carHireState.length },
    { id: "bike-hire", label: "Bike Hire", icon: <Bike size={16} />, count: bikeHireState.length },
  ].filter((tab) => tab.count > 0);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
    if (selectedLocation && !availableLocations.includes(selectedLocation)) {
      setSelectedLocation('');
    }
  }, [activeTab, availableLocations, selectedLocation, tabs]);

  // Provider dashboard view (full page)
  if (auth.user && auth.user.role === 'lister') {
    return (
      <ProviderDashboard 
        onClose={() => {
          // Providers can't close the dashboard, it's their main view
        }}
        onLogout={() => {
          // Refresh auth state to reflect logout
          auth.refresh && auth.refresh();
        }}
      />
    );
  }

  if (auth.user && auth.user.role === 'user' && userDashboardOpen) {
    return (
      <UserDashboard
        user={auth.user}
        initialProvider={selectedProvider}
        services={{ garages: garagesState, mechanics: mechanicsWithImages, transport: transportState, carHire: carHireState, bikeHire: bikeHireState }}
        onClose={() => setUserDashboardOpen(false)}
        onLogout={auth.logout}
      />
    );
  }

  // Customer homepage view
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Barlow', sans-serif" }}
    >
      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-bold tracking-wide text-foreground uppercase"
            >
              PinPoint
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {servicesVisible && tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
                className="hover:text-foreground transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {auth.user ? (
              <>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Hi {auth.user.email}</button>
                {auth.user.role === 'user' && (
                  <button onClick={() => setUserDashboardOpen(true)} className="text-sm bg-primary/80 text-white font-semibold px-4 py-2 rounded hover:bg-primary transition-colors">My Dashboard</button>
                )}
                {auth.user.role === 'lister' && (
                  <button
                    onClick={() => undefined}
                    className="text-sm bg-primary/80 text-white font-semibold px-4 py-2 rounded hover:bg-primary transition-colors flex items-center gap-1.5"
                  >
                    <BarChart3 size={16} /> Dashboard
                  </button>
                )}
                <button onClick={async () => { await auth.logout(); }} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Log Out</button>
              </>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Sign In</button>
            )}
            {(!auth.user || auth.user.role === 'lister') && (
              <button onClick={() => { if (!auth.user) { setAuthOpen(true); return; } setListingOpen(true); }} className="text-sm bg-primary text-white font-semibold px-5 py-2 rounded hover:bg-[#e04a00] transition-colors">
                List Your Service
              </button>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-card border-t border-border px-4 py-4 flex flex-col gap-4">
            {servicesVisible && tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setMenuOpen(false); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t.icon} {t.label}
              </button>
            ))}
            <hr className="border-border" />
            {auth.user ? (
              <>
                <button className="text-sm text-muted-foreground px-5 py-2.5">Logged in as: {auth.user.email}</button>
                {auth.user.role === 'user' && (
                  <button onClick={() => { setMenuOpen(false); setUserDashboardOpen(true); }} className="text-sm bg-primary/80 text-white font-semibold px-5 py-2.5 rounded w-full">My Dashboard</button>
                )}
                {auth.user.role === 'lister' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      return;
                    }}
                    className="text-sm bg-primary/80 text-white font-semibold px-5 py-2.5 rounded w-full flex items-center justify-center gap-1.5"
                  >
                    <BarChart3 size={16} /> Dashboard
                  </button>
                )}
                {auth.user.role === 'lister' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setListingOpen(true);
                    }}
                    className="text-sm bg-primary text-white font-semibold px-5 py-2.5 rounded w-full"
                  >
                    Add New Service
                  </button>
                )}
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await auth.logout();
                  }}
                  className="text-sm border border-border bg-background text-foreground font-semibold px-5 py-2.5 rounded w-full"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="text-sm border border-border bg-background text-foreground font-semibold px-5 py-2.5 rounded w-full"
                >
                  Sign In / Up
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="text-sm bg-primary text-white font-semibold px-5 py-2.5 rounded w-full"
                >
                  List Your Service
                </button>
              </>
            )}
          </div>
        )}
      </nav>

      {scrollAuthPromptOpen && !auth.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-[360px] rounded-xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur-sm animate-in fade-in">
            <button
              onClick={() => {
                setScrollAuthPromptOpen(false);
                sessionStorage.setItem('pinpoint-scroll-auth-prompt-seen', 'true');
              }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss sign-in prompt"
            >
              <X size={16} />
            </button>
            <div className="pr-6">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                Welcome back
              </div>
              <h3 className="font-bold text-foreground text-lg mb-1">Sign in to manage your bookings</h3>
              <p className="text-sm text-muted-foreground mb-4">Save your preferred providers and keep your service history in one place.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sessionStorage.setItem('pinpoint-scroll-auth-prompt-seen', 'true');
                    setScrollAuthPromptOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex-1 bg-primary text-white font-semibold text-sm px-3 py-2 rounded hover:bg-[#e04a00]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('pinpoint-scroll-auth-prompt-seen', 'true');
                    setScrollAuthPromptOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex-1 border border-border text-foreground font-semibold text-sm px-3 py-2 rounded hover:border-primary/50"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Support on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/35 transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.15 6.23 2.15 11.57c0 1.84.53 3.63 1.53 5.18L2 22l5.42-1.78c1.48.81 3.17 1.24 4.9 1.24 5.46 0 9.89-4.23 9.89-9.57C21.93 6.23 17.5 2 12.04 2zm5.42 13.12c-.24.67-1.38 1.25-1.9 1.33-.48.07-1.08.1-3.48-.74-2.95-1.08-4.83-3.84-4.98-4.02-.15-.18-1.21-1.61-1.21-3.06 0-1.45.76-2.16 1.03-2.45.27-.28.58-.35.78-.35h.56c.18 0 .42.01.64.49.27.58.92 2.01.99 2.15.08.14.13.32.02.52-.11.2-.17.32-.33.5-.15.18-.32.4-.46.54-.15.14-.31.3-.13.58.18.28.8 1.31 1.72 2.12 1.18 1.05 2.18 1.38 2.48 1.53.3.16.48.14.66-.08.18-.22.78-.9.99-1.21.21-.31.42-.25.72-.15.3.1 1.94 1.12 2.28 1.32.34.2.56.29.64.45.08.17.08.99-.16 1.66z"/>
        </svg>
      </a>

      <ProviderDetailDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        provider={selectedProvider ? { ...selectedProvider, _loggedIn: !!auth.user } : null}
        onSignIn={() => setAuthOpen(true)}
        onBook={() => {
          if (!auth.user) {
            setAuthOpen(true);
            return;
          }
          setUserDashboardOpen(true);
        }}
      />
      <AuthDialog auth={auth} open={authOpen} onOpenChange={setAuthOpen} onSuccess={() => auth.refresh && auth.refresh()} />
      <ListingDialog open={listingOpen} onOpenChange={setListingOpen} onSaved={(item) => {
        if (!item) return;
        if (item.specialty || item.garageId) setMechanicsState((s) => [item, ...s]);
        else if (item.type || item.company) setTransportState((s) => [item, ...s]);
        else setGaragesState((s) => [item, ...s]);
      }} />

      {showPublicHomepage && <>
      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=800&fit=crop&auto=format"
            alt="Night cityscape with cars"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded mb-6"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <MapPin size={12} /> Nairobi & Surrounds
            </div>

            <h1
              className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tight mb-6 text-foreground"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Your City. <br />
              <span className="text-primary">Every Drive.</span>
              <br /> Sorted.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-6 leading-relaxed">
              Find trusted garages, certified mechanics, transport crews, car hire and bike hire across Nairobi — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground max-w-xl">
              <div>
                Built by <span className="text-foreground font-semibold">{owner.name}</span>, {owner.title}.
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:text-[#e04a00]"
              >
                WhatsApp support {supportNumber}
              </a>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-primary text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded hover:bg-[#e04a00] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthOpen(true)}
                className="border border-border bg-background/60 text-foreground font-semibold text-sm px-6 py-3 rounded hover:border-primary/50 transition-colors"
              >
                Sign Up
              </button>
            </div>

            {/* Search bar */}
            <div className="flex flex-col gap-4 max-w-xl mt-6">
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <div className="flex items-center gap-3 bg-secondary border border-border rounded px-4 py-3">
                  <Search size={18} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Nairobi services, locations or providers…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
                  />
                </div>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-secondary border border-border rounded px-4 py-3 text-sm text-foreground outline-none"
                >
                  <option value="">All Nairobi Areas</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-primary text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded hover:bg-[#e04a00] transition-colors flex items-center justify-center gap-2"
              >
                Find Now <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded overflow-hidden max-w-2xl">
            {[
              { val: "5+", label: "Local Garages" },
              { val: "9+", label: "Certified Mechanics" },
              { val: "7+", label: "Transport Fleets" },
              { val: "4.8★", label: "Avg Service Rating" },
            ].map((s) => (
              <div key={s.label} className="bg-card px-6 py-4">
                <div
                  className="text-2xl font-black text-primary"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {s.val}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="bg-secondary py-14 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Search size={22} className="text-primary" />, step: "01", title: "Search & Filter", body: "Enter your location and pick a service category. See real-time availability, ratings, and pricing." },
              { icon: <Calendar size={22} className="text-primary" />, step: "02", title: "Compare Fast", body: "Review nearby options, compare providers, and choose the right fit before you continue." },
              { icon: <CheckCircle size={22} className="text-primary" />, step: "03", title: "Track & Review", body: "Monitor your service in real time. Rate and review providers to help the community." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5">
                <div
                  className="text-4xl font-black text-border leading-none mt-0.5 shrink-0"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {item.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {item.icon}
                    <h3 className="font-bold text-foreground text-base">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      </>}

      {servicesVisible && <>
      {/* ── SERVICES TABS ───────────────────────────────────────────────────── */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-6">
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest text-primary mb-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Services
            </div>
            <h2
              className="text-4xl md:text-5xl font-black uppercase text-foreground"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              What Do You Need?
            </h2>
          </div>
        </div>

        <div className="sticky top-16 z-20 -mx-4 mb-10 border-y border-border bg-background/95 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Browse by service</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{tabs.find((tab) => tab.id === activeTab)?.count ?? 0} providers</p>
            </div>
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                aria-pressed={activeTab === t.id}
                className={`flex shrink-0 items-center gap-1.5 rounded border px-3 py-2 text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t.icon} {t.label} <span className="text-[10px] opacity-70">{t.count}</span>
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* ── Garages ── */}
        {activeTab === "garages" && (
          <div>
            {activeGarages.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeGarages.map((g) => (
                  <div key={g.id} className={`flex h-full flex-col overflow-hidden rounded border border-border bg-card group transition-colors hover:border-primary/40 ${!g.isAvailable ? 'opacity-50' : ''}`}>
                    <div className="relative h-36 bg-secondary overflow-hidden">
                      {g.label && (
                        <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {g.label}
                        </div>
                      )}
                      <img
                        src={optimizeImageUrl(g.img, 900, 560)}
                        alt={g.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                      <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded ${!g.isAvailable ? 'bg-red-500/20 text-red-400 border border-red-500/30' : g.open ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {!g.isAvailable ? 'Unavailable' : g.open ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-bold text-foreground text-sm mb-1">{g.name}</h3>
                      <p className="text-xs text-primary font-medium mb-1">{g.specialty}</p>
                      <p className="text-xs text-muted-foreground mb-2">{g.location}</p>
                      {g.description && <p className="text-[11px] text-muted-foreground mb-2 line-clamp-3">{g.description}</p>}
                      {g.price && <p className="text-xs font-semibold text-foreground mb-2">{g.price}{g.discount ? ` · ${g.discount}% off` : ''}</p>}
                      {g.availability && <p className="text-[11px] text-muted-foreground mb-3">{g.availability}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Stars rating={g.rating} />
                          <span className="text-xs text-muted-foreground">{g.rating} ({g.reviews})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{g.distance}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProvider(g);
                            setProviderDialogOpen(true);
                          }}
                          className="w-full text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary py-2 rounded transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                      <ProviderReviews provider={g} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No garage listings are available yet. New listings will appear here when they are added from the backend.
              </div>
            )}
            {hasFilter && !activeGarages.length && (
              <div className="mt-4 bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No garages matched your search. Try a different area or clear the filters.
              </div>
            )}
          </div>
        )}

        {/* ── Mechanics ── */}
        {activeTab === "mechanics" && (
          <div>
            {activeMechanics.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeMechanics.map((m) => (
                  <div key={m.id} className={`flex h-full flex-col overflow-hidden rounded border border-border bg-card p-4 transition-colors hover:border-primary/40 ${!m.isAvailable ? 'opacity-50' : ''}`}>
                    <div className="group relative mb-4 overflow-hidden rounded">
                      {m.label && (
                        <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {m.label}
                        </div>
                      )}
                      <img
                        src={optimizeImageUrl(m.img, 900, 620)}
                        alt={m.name}
                        loading="lazy"
                        decoding="async"
                        className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded ${!m.isAvailable ? 'bg-red-500/20 text-red-400' : m.available ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {!m.isAvailable ? 'Unavailable' : m.available ? 'Available' : 'Busy'}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm">{m.name}</h3>
                    <p className="text-xs text-primary font-medium mt-1 mb-1">{m.specialty}</p>
                    <p className="text-xs text-muted-foreground mb-2">Based in {m.location}</p>
                    {m.description && <p className="text-[11px] text-muted-foreground mb-2 line-clamp-3">{m.description}</p>}
                    {m.price && <p className="text-xs font-semibold text-foreground mb-2">{m.price}{m.discount ? ` · ${m.discount}% off` : ''}</p>}
                    {m.availability && <p className="text-[11px] text-muted-foreground mb-3">{m.availability}</p>}
                    <div className="flex items-center gap-2 mb-4">
                      <Stars rating={m.rating} />
                      <span className="text-xs text-muted-foreground">{m.jobs} jobs</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProvider(m);
                        setProviderDialogOpen(true);
                      }}
                      className="w-full text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary py-2 rounded transition-colors text-center block"
                    >
                      View Details
                    </button>
                    <ProviderReviews provider={m} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No mechanic listings are available yet. New listings will appear here when they are added from the backend.
              </div>
            )}
            {hasFilter && !activeMechanics.length && (
              <div className="mt-4 bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No mechanics matched your search. Try a different area or clear the filters.
              </div>
            )}
          </div>
        )}

        {/* ── Transport ── */}
        {activeTab === "transport" && (
          <div>
            {activeTransport.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeTransport.map((t) => (
                  <div key={t.id} className={`flex h-full flex-col overflow-hidden rounded border border-border bg-card group transition-colors hover:border-primary/40 ${!t.isAvailable ? 'opacity-50' : ''}`}>
                    <div className="relative h-40 bg-secondary overflow-hidden">
                      {t.label && (
                        <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {t.label}
                        </div>
                      )}
                      <img
                        src={optimizeImageUrl(t.img, 900, 600)}
                        alt={t.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                      />
                      <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded ${!t.isAvailable ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                        {!t.isAvailable ? 'Unavailable' : 'Available'}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {t.type}
                      </div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{t.capacity}</p>
                      <p className="text-xs text-muted-foreground mb-2">Serving {t.area}</p>
                      {t.description && <p className="text-[11px] text-muted-foreground mb-2 line-clamp-3">{t.description}</p>}
                      {t.price && <p className="text-xs font-semibold text-foreground mb-2">{t.price}{t.discount ? ` · ${t.discount}% off` : ''}</p>}
                      {t.availability && <p className="text-[11px] text-muted-foreground mb-3">{t.availability}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {t.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProvider(t);
                            setProviderDialogOpen(true);
                          }}
                          className="text-xs font-bold uppercase px-3 py-1.5 border border-border text-muted-foreground rounded hover:border-primary hover:text-primary transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                      <ProviderReviews provider={t} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No transport listings are available yet. New listings will appear here when they are added from the backend.
              </div>
            )}
            {hasFilter && !activeTransport.length && (
              <div className="mt-4 bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No transport options matched your search. Try a different area or clear the filters.
              </div>
            )}
          </div>
        )}

        {/* ── Car Hire ── */}
        {activeTab === "car-hire" && (
          <div>
            <div className="flex items-center gap-3 mb-6 p-4 bg-secondary border border-border rounded text-sm text-muted-foreground">
              <Zap size={16} className="text-primary shrink-0" />
              All prices are per day (24 hrs). Insurance included. Minimum hire 1 day. Fuel not included.
            </div>
            {activeCars.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCars.map((c) => (
                  <div key={c.id} className={`flex h-full flex-col overflow-hidden rounded border border-border bg-card group transition-colors hover:border-primary/40 ${!c.isAvailable ? 'opacity-50' : ''}`}>
                    <div className="relative h-44 overflow-hidden bg-secondary">
                      <img
                        src={optimizeImageUrl(c.img, 900, 560)}
                        alt={c.model}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wider text-white">Car Hire</span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{c.model}</h3>
                          <p className="text-xs text-muted-foreground">{c.type} · {c.seats} seats · {c.transmission}</p>
                          <p className="text-xs text-muted-foreground mt-1">Pickup: {c.base}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded ${c.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {c.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            KSh{c.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/day</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProvider(c);
                            setProviderDialogOpen(true);
                          }}
                          className="text-xs font-bold uppercase tracking-wide px-4 py-2 border border-border text-muted-foreground rounded hover:border-primary hover:text-primary transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                      <ProviderReviews provider={c} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-card border border-border rounded p-6 text-center text-sm text-muted-foreground">
                No car hire listings are available yet. New listings will appear here when they are added from the backend.
              </div>
            )}
            {hasFilter && !activeCars.length && (
              <div className="mt-4 bg-card border border-border rounded p-6 text-center text-sm text-muted-foreground">
                No cars available for your search. Clear the filters or try another area.
              </div>
            )}
          </div>
        )}

        {/* ── Bike Hire ── */}
        {activeTab === "bike-hire" && (
          <div>
            <div className="flex items-center gap-3 mb-6 p-4 bg-secondary border border-border rounded text-sm text-muted-foreground">
              <Bike size={16} className="text-primary shrink-0" />
              Helmets and locks provided free. ID required as deposit. Available 6 AM – 10 PM daily.
            </div>
            {activeBikes.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeBikes.map((b) => (
                  <div key={b.id} className={`flex h-full flex-col overflow-hidden rounded border border-border bg-card group transition-colors hover:border-primary/40 ${!b.isAvailable ? 'opacity-50' : ''}`}>
                    {b.tag && (
                      <div className="text-xs font-black uppercase bg-primary text-white px-3 py-1 text-center tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {b.tag}
                      </div>
                    )}
                    <div className="relative h-44 overflow-hidden bg-secondary">
                      <img
                        src={optimizeImageUrl(b.img, 900, 560)}
                        alt={b.model}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-wider text-white">Bike Hire</span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {b.type}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-sm mb-2">{b.model}</h3>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded ${b.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {b.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Pickup: {b.pickup}</p>
                      <div className="grid grid-cols-2 gap-px bg-border rounded overflow-hidden mb-4">
                        <div className="bg-secondary px-3 py-2">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                            <Clock size={10} /> Per Hour
                          </div>
                          <div className="font-black text-foreground text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            KSh{b.hourly.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-secondary px-3 py-2">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                            <Calendar size={10} /> Per Day
                          </div>
                          <div className="font-black text-foreground text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            KSh{b.daily.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProvider(b);
                          setProviderDialogOpen(true);
                        }}
                        className="w-full text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary py-2.5 rounded transition-all text-center block"
                      >
                        View Details
                      </button>
                      <ProviderReviews provider={b} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-card border border-border rounded p-6 text-center text-sm text-muted-foreground">
                No bike hire listings are available yet. New listings will appear here when they are added from the backend.
              </div>
            )}
            {hasFilter && !activeBikes.length && (
              <div className="mt-4 bg-card border border-border rounded p-6 text-center text-sm text-muted-foreground">
                No bike hire options available for your search. Clear the filters or try another area.
              </div>
            )}
          </div>
        )}
      </section>
      </>}

      {auth.user?.role === 'user' && !userDashboardOpen && (
        <UserDashboard
          user={auth.user}
          initialProvider={selectedProvider}
          services={{ garages: garagesState, mechanics: mechanicsWithImages, transport: transportState, carHire: carHireState, bikeHire: bikeHireState }}
          embedded
          onClose={() => setUserDashboardOpen(false)}
          onLogout={auth.logout}
        />
      )}

      {showPublicHomepage && <>
      {/* ── WHY PINPOINT ────────────────────────────────────────────────────── */}
      <section className="bg-secondary border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              Why Us
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Built for Drivers, <span className="text-primary">Not Desks</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Verified Providers",
                image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80",
                body: "Every garage, mechanic, and transport operator is background-checked and regularly reviewed by real customers.",
              },
              {
                title: "Fast Discovery",
                image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
                body: "Browse nearby providers, compare their details, and choose the right one without the back-and-forth.",
              },
              {
                title: "Hyper-Local Matches",
                image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
                body: "We surface providers closest to you first so your bike is ready down the road, not across town.",
              },
              {
                title: "Flexible Hire Terms",
                image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
                body: "Bikes by the hour, cars by the day, trucks by the job — no rigid packages, just what you actually need.",
              },
              {
                title: "Community Ratings",
                image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
                body: "Hundreds of verified reviews on every listing. Ratings affect visibility — the best rise to the top.",
              },
              {
                title: "24/7 Support",
                image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80",
                body: "Broke down at midnight? Our support team is live around the clock to get you moving again.",
              },
              {
                title: "Fast Turnaround",
                image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80",
                body: "We prioritise urgent jobs and short-notice trips so downtime stays low and momentum stays high.",
              },
              {
                title: "Trusted Network",
                image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
                body: "From roadside repairs to fleet hire, our network makes it easier to get moving without guesswork.",
              },
            ].map((f) => (
              <div key={f.title} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                <img src={f.image} alt={f.title} className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-black text-white text-lg uppercase tracking-wide mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{f.title}</h3>
                  <p className="text-sm text-white/85 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1400&h=500&fit=crop&auto=format"
            alt="Highway at night"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          <div className="max-w-xl">
            <h2
              className="text-4xl md:text-6xl font-black uppercase text-foreground mb-4 leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              List Your <span className="text-primary">Garage</span> or <span className="text-primary">Fleet</span>
            </h2>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed">
              Join 1 400+ providers already growing their business on PinPoint. Free to list, transparent fees only when you get bookings.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-primary text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded hover:bg-[#e04a00] transition-colors flex items-center gap-2">
                Get Started Free <ChevronRight size={16} />
              </button>
              <button className="border border-border text-foreground font-semibold text-sm px-6 py-3 rounded hover:border-primary/50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                  <MapPin size={13} className="text-white" />
                </div>
                <span className="text-base font-black uppercase tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  PinPoint
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Connecting drivers, riders, and movers with trusted service providers across the city.
              </p>
              <div className="flex gap-3">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Phone size={12} /> +254 708 614 916
                </a>
              </div>
              <div className="flex gap-3 mt-1">
                <a href="mailto:hello@pinpoint.co.ke" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Mail size={12} /> hello@pinpoint.co.ke
                </a>
              </div>
            </div>

            {[
              { heading: "Services", links: ["Car Garages", "Specialist Mechanics", "Transport & Moving", "Luggage Delivery", "Car Hire", "Bike Hire"] },
              { heading: "Company", links: ["About Us", "How It Works", "Pricing", "Blog", "Careers", "Press"] },
              { heading: "Support", links: ["Help Centre", "Safety", "Terms of Service", "Privacy Policy", "Contact Us", "Report an Issue"] },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © 2026 PinPoint Garage & Car Hire. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              Built by Isaac Wambua, Finance Student at USIU — Nairobi service network.
            </p>
          </div>
        </div>
      </footer>
      </>}
    </div>
  );
}
