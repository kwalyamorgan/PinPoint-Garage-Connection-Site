import { useMemo, useState } from "react";
import {
  MapPin, Wrench, Truck, Car, Bike, Clock, Phone, Mail, ChevronRight,
  Star, Shield, Zap, Search, Menu, X, ArrowRight, CheckCircle, Calendar
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceTab = "garages" | "mechanics" | "transport" | "car-hire" | "bike-hire";

// ─── Data ─────────────────────────────────────────────────────────────────────

const garages = [
  { name: "Roysambu Auto Hub", rating: 4.9, reviews: 8, distance: "0.8 km", specialty: "Engine & Gearbox", location: "Roysambu", open: true, phone: "+254701123456", img: "/images/garages/roysambu.webp" },
  { name: "Githurai 44 Garage", rating: 4.7, reviews: 7, distance: "1.4 km", specialty: "All Makes & Models", location: "Githurai 44", open: true, phone: "+254701234567", img: "/images/garages/githurai44.webp" },
  { name: "Githurai 45 Motors", rating: 4.8, reviews: 9, distance: "2.1 km", specialty: "Electrical & Diagnostics", location: "Githurai 45", open: false, phone: "+254701345678", img: "/images/garages/githurai45.webp" },
  { name: "Kasarani Tyre & Service", rating: 4.6, reviews: 6, distance: "2.9 km", specialty: "Tyres, Brakes & Suspension", location: "Kasarani", open: true, phone: "+254701456789", img: "/images/garages/kasarani.webp" },
];

const mechanics = [
  { name: "James Mburu", specialty: "BMW & Mercedes Specialist", rating: 5.0, jobs: 8, available: true, location: "USIU Road", phone: "+254701567890" },
  { name: "Amina Hassan", specialty: "Hybrid & EV Technician", rating: 4.9, jobs: 7, available: true, location: "TRM", phone: "+254701678901" },
  { name: "David Otieno", specialty: "Diesel & 4x4 Expert", rating: 4.8, jobs: 10, available: false, location: "Mirema", phone: "+254701789012" },
  { name: "Grace Wairimu", specialty: "Auto Electrician", rating: 4.7, jobs: 6, available: true, location: "Northern Bypass", phone: "+254701890123" },
];

const transportServices = [
  { name: "QuickMove Logistics", type: "Home Shifting", capacity: "Up to 3 bedrooms", price: "From KSh 850", img: "/images/transport/quickmove.svg", area: "USIU Road" },
  { name: "LuggageXpress", type: "Luggage Transfer", capacity: "Airport & hotel runs", price: "From KSh 220", img: "/images/transport/luggagexpress.svg", area: "Kasarani" },
  { name: "OfficeReloc Pro", type: "Office Moves", capacity: "Full office fit-out", price: "From KSh 1 400", img: "/images/transport/officeReloc.svg", area: "Allsops" },
  { name: "StudentHaul", type: "Student Moves", capacity: "Single room / digs", price: "From KSh 380", img: "/images/transport/studenthaul.svg", area: "Roysambu" },
];

const carHire = [
  {
    model: "Toyota Corolla Quest",
    type: "Sedan",
    seats: 5,
    transmission: "Manual",
    price: 4200,
    base: "USIU Road",
    img: "/images/car hire/corolla.svg",
  },
  {
    model: "VW Polo Vivo",
    type: "Hatchback",
    seats: 5,
    transmission: "Manual",
    price: 3800,
    base: "Githurai 44",
    img: "/images/car hire/polo.svg",
  },
  {
    model: "Toyota Hilux",
    type: "Bakkie",
    seats: 5,
    transmission: "Automatic",
    price: 6800,
    base: "TRM",
    img: "/images/car hire/toyota hilux.webp",
  },
  {
    model: "Hyundai Tucson",
    type: "SUV",
    seats: 5,
    transmission: "Automatic",
    price: 7500,
    base: "Garden City",
    img: "/images/car hire/tucson.svg",
  },
  {
    model: "Ford Transit",
    type: "Minibus",
    seats: 14,
    transmission: "Manual",
    price: 9200,
    base: "Northern Bypass",
    img: "/images/car hire/transit.svg",
  },
  {
    model: "BMW 3 Series",
    type: "Executive",
    seats: 5,
    transmission: "Automatic",
    price: 11000,
    base: "Allsops",
    img: "/images/car hire/bmw3.svg",
  },
];

const bikeHire = [
  {
    model: "Trek FX 3 City Bike",
    type: "City / Commuter",
    hourly: 450,
    daily: 2200,
    pickup: "Garden City",
    img: "/images/bike hire/trek.svg",
    tag: "Most Popular",
  },
  {
    model: "Giant Escape 3",
    type: "Hybrid Bike",
    hourly: 400,
    daily: 1950,
    pickup: "USIU Road",
    img: "/images/bike hire/giant.svg",
    tag: "",
  },
  {
    model: "Specialized Rockhopper",
    type: "Mountain Bike",
    hourly: 650,
    daily: 2900,
    pickup: "Mirema",
    img: "/images/bike hire/rockhopper.svg",
    tag: "",
  },
  {
    model: "e-Bike Cannondale",
    type: "Electric Bike",
    hourly: 900,
    daily: 3800,
    pickup: "Kasarani",
    img: "/images/bike hire/cannondale.svg",
    tag: "Electric",
  },
];

const owner = {
  name: "Isaac Wambua",
  title: "Finance Student at USIU",
};

const supportNumber = "+254708614916";
const whatsappLink = `https://wa.me/254708614916?text=${encodeURIComponent("Hi PinPoint support, I need help with a service.")}`;

const locations = [
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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Local mechanic images (randomly assigned)
  const mechanicImages = [
    "/images/mechanics/1.webp",
    "/images/mechanics/2.jpg",
    "/images/mechanics/3.jpeg",
    "/images/mechanics/5.jpg",
    "/images/mechanics/6.jpg",
  ];

  const mechanicsWithImages = useMemo(() => {
    // Fisher-Yates shuffle
    const imgs = [...mechanicImages];
    for (let i = imgs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    }
    return mechanics.map((m, idx) => ({ ...m, img: imgs[idx % imgs.length] }));
  }, []);

  const [activeTab, setActiveTab] = useState<ServiceTab>("garages");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasFilter = Boolean(normalizedQuery || selectedLocation);
  const filterText = (value?: string) => normalizedQuery === "" || (value?.toLowerCase().includes(normalizedQuery) ?? false);
  const filterLocation = (location?: string) => !selectedLocation || location === selectedLocation;

  const filteredGarages = useMemo(
    () => garages.filter((g) => filterLocation(g.location) && (filterText(g.name) || filterText(g.specialty) || filterText(g.location))),
    [searchQuery, selectedLocation]
  );

  const filteredMechanics = useMemo(
    () => mechanicsWithImages.filter((m) => filterLocation(m.location) && (filterText(m.name) || filterText(m.specialty) || filterText(m.location))),
    [searchQuery, selectedLocation, mechanicsWithImages]
  );

  const filteredTransport = useMemo(
    () => transportServices.filter((t) => filterLocation(t.area) && (filterText(t.name) || filterText(t.type) || filterText(t.area))),
    [searchQuery, selectedLocation]
  );

  const filteredCars = useMemo(
    () => carHire.filter((c) => filterLocation(c.base) && (filterText(c.model) || filterText(c.type) || filterText(c.base))),
    [searchQuery, selectedLocation]
  );

  const filteredBikes = useMemo(
    () => bikeHire.filter((b) => filterLocation(b.pickup) && (filterText(b.model) || filterText(b.type) || filterText(b.pickup))),
    [searchQuery, selectedLocation]
  );

  const activeGarages = hasFilter ? filteredGarages : garages;
  const activeMechanics = hasFilter ? filteredMechanics : mechanicsWithImages;
  const activeTransport = hasFilter ? filteredTransport : transportServices;
  const activeCars = hasFilter ? filteredCars : carHire;
  const activeBikes = hasFilter ? filteredBikes : bikeHire;

  const tabs: { id: ServiceTab; label: string; icon: React.ReactNode }[] = [
    { id: "garages", label: "Garages", icon: <Wrench size={16} /> },
    { id: "mechanics", label: "Mechanics", icon: <Shield size={16} /> },
    { id: "transport", label: "Transport", icon: <Truck size={16} /> },
    { id: "car-hire", label: "Car Hire", icon: <Car size={16} /> },
    { id: "bike-hire", label: "Bike Hire", icon: <Bike size={16} /> },
  ];

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
            {tabs.map((t) => (
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
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">Sign In</button>
            <button className="text-sm bg-primary text-white font-semibold px-5 py-2 rounded hover:bg-[#e04a00] transition-colors">
              List Your Service
            </button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-card border-t border-border px-4 py-4 flex flex-col gap-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setMenuOpen(false); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t.icon} {t.label}
              </button>
            ))}
            <hr className="border-border" />
            <button className="text-sm bg-primary text-white font-semibold px-5 py-2.5 rounded w-full">
              List Your Service
            </button>
          </div>
        )}
      </nav>

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

            {/* Search bar */}
            <div className="flex flex-col gap-4 max-w-xl">
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
                  {locations.map((location) => (
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
              { icon: <Calendar size={22} className="text-primary" />, step: "02", title: "Book Instantly", body: "Select a slot or hire period, confirm details, and get a booking confirmation in under 60 seconds." },
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

      {/* ── SERVICES TABS ───────────────────────────────────────────────────── */}
      <section id="services" className="py-20 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
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
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded border transition-all ${
                  activeTab === t.id
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Garages ── */}
        {activeTab === "garages" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeGarages.map((g) => (
              <div key={g.name} className="bg-card border border-border rounded overflow-hidden group hover:border-primary/40 transition-colors">
                <div className="relative h-36 bg-secondary overflow-hidden">
                  <img
                    src={g.img}
                    alt={g.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded ${g.open ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                    {g.open ? "Open" : "Closed"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-sm mb-1">{g.name}</h3>
                  <p className="text-xs text-primary font-medium mb-1">{g.specialty}</p>
                  <p className="text-xs text-muted-foreground mb-3">{g.location}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={g.rating} />
                      <span className="text-xs text-muted-foreground">{g.rating} ({g.reviews})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{g.distance}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="block text-center text-xs font-bold uppercase tracking-wider bg-primary text-white py-2 rounded hover:bg-[#e04a00] transition-colors">
                      Book via WhatsApp
                    </a>
                    <button className="w-full text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:border-primary hover:text-primary py-2 rounded transition-colors">
                      See Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hasFilter && !activeGarages.length && (
              <div className="col-span-full bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No garages matched your search. Try a different area or clear the filters.
              </div>
            )}
          </div>
        )}

        {/* ── Mechanics ── */}
        {activeTab === "mechanics" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeMechanics.map((m) => (
              <div key={m.name} className="bg-card border border-border rounded p-5 hover:border-primary/40 transition-colors">
                <div className="relative overflow-hidden rounded-t-md mb-4">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-full h-40 object-cover"
                  />
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded ${m.available ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {m.available ? "Available" : "Busy"}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-sm">{m.name}</h3>
                <p className="text-xs text-primary font-medium mt-1 mb-1">{m.specialty}</p>
                <p className="text-xs text-muted-foreground mb-3">Based in {m.location}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Stars rating={m.rating} />
                  <span className="text-xs text-muted-foreground">{m.jobs} jobs</span>
                </div>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="w-full text-xs font-bold uppercase tracking-wider bg-primary text-white py-2 rounded hover:bg-[#e04a00] transition-colors text-center block">
                  Message on WhatsApp
                </a>
              </div>
            ))}
            {hasFilter && !activeMechanics.length && (
              <div className="col-span-full bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
                No mechanics matched your search. Try a different area or clear the filters.
              </div>
            )}
          </div>
        )}

        {/* ── Transport ── */}
        {activeTab === "transport" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTransport.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded overflow-hidden hover:border-primary/40 transition-colors group">
                <div className="h-40 bg-secondary overflow-hidden">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                </div>
                <div className="p-4">
                  <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {t.type}
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-1">{t.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{t.capacity}</p>
                  <p className="text-xs text-muted-foreground mb-3">Serving {t.area}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {t.price}
                    </span>
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase px-3 py-1.5 bg-primary text-white rounded hover:bg-[#e04a00] transition-colors">
                      Enquire
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {hasFilter && !activeTransport.length && (
              <div className="col-span-full bg-card border border-border rounded p-8 text-center text-sm text-muted-foreground">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCars.map((c) => (
                <div key={c.model} className="bg-card border border-border rounded overflow-hidden hover:border-primary/40 transition-colors group">
                  <div className="h-44 bg-secondary overflow-hidden">
                    <img
                      src={c.img}
                      alt={c.model}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{c.model}</h3>
                        <p className="text-xs text-muted-foreground">{c.type} · {c.seats} seats · {c.transmission}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pickup: {c.base}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                          KSh{c.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/day</span>
                      </div>
                      <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-wide px-4 py-2 bg-primary text-white rounded hover:bg-[#e04a00] transition-colors">
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeBikes.map((b) => (
                <div key={b.model} className="bg-card border border-border rounded overflow-hidden hover:border-primary/40 transition-colors group">
                  {b.tag && (
                    <div className="text-xs font-black uppercase bg-primary text-white px-3 py-1 text-center tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {b.tag}
                    </div>
                  )}
                  <div className="h-40 bg-secondary overflow-hidden">
                    <img
                      src={b.img}
                      alt={b.model}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {b.type}
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-2">{b.model}</h3>
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
                    <a href={whatsappLink} target="_blank" rel="noreferrer" className="w-full text-xs font-bold uppercase tracking-wider bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-white py-2.5 rounded transition-all text-center block">
                      Hire via WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {hasFilter && !activeBikes.length && (
              <div className="mt-4 bg-card border border-border rounded p-6 text-center text-sm text-muted-foreground">
                No bike hire options available for your search. Clear the filters or try another area.
              </div>
            )}
          </div>
        )}
      </section>

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Shield size={24} className="text-primary" />, title: "Verified Providers", body: "Every garage, mechanic, and transport operator is background-checked and regularly reviewed by real customers." },
              { icon: <Zap size={24} className="text-primary" />, title: "Instant Booking", body: "No phone tag. Book a service slot or a vehicle in under 60 seconds and get an immediate confirmation." },
              { icon: <MapPin size={24} className="text-primary" />, title: "Hyper-Local Matches", body: "We surface providers closest to you first, so your bike is ready down the road, not across town." },
              { icon: <Clock size={24} className="text-primary" />, title: "Flexible Hire Terms", body: "Bikes by the hour, cars by the day, trucks by the job — no rigid packages, just what you actually need." },
              { icon: <Star size={24} className="text-primary" />, title: "Community Ratings", body: "Hundreds of verified reviews on every listing. Ratings affect visibility — the best rise to the top." },
              { icon: <Phone size={24} className="text-primary" />, title: "24/7 Support", body: "Broke down at midnight? Our support team is live around the clock to get you moving again." },
            ].map((f) => (
              <div key={f.title} className="bg-card border border-border rounded p-6 hover:border-primary/30 transition-colors">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-bold text-foreground text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
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
    </div>
  );
}
