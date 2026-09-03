import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  LayoutDashboard,
  ListPlus,
  LocateFixed,
  Mail,
  MessageCircle,
  RefreshCw,
  Wrench,
  X,
} from "lucide-react";
import api from "../../lib/api";
import ListingDialog from "./ListingDialog";

type AdminView = "requests" | "history" | "listings" | "mechanics" | "customers";
type RequestStatus =
  | "pending"
  | "reviewed"
  | "approved"
  | "en-route"
  | "arrived"
  | "completed"
  | "rejected";

const statusLabels: Record<RequestStatus, string> = {
  pending: "Needs review",
  reviewed: "Reviewed",
  approved: "Arrival set",
  "en-route": "Mechanic en route",
  arrived: "Mechanic arrived",
  completed: "Completed",
  rejected: "Rejected",
};

function whatsappUrl(phone?: string) {
  const number = String(phone || "").replace(/\D/g, "");
  return number ? `https://wa.me/${number}` : "";
}

function googleMapsUrl(latitude?: number, longitude?: number) {
  return latitude && longitude
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : "";
}

function googleMapsEmbedUrl(latitude?: number, longitude?: number) {
  return latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
    : "";
}

export default function AdminDashboard({ auth }: { auth: any }) {
  const [view, setView] = useState<AdminView>("requests");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [listingOpen, setListingOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [mechanicOpen, setMechanicOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clearingHistory, setClearingHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, garages, mechanicsData, transportData] = await Promise.all([
        api.getAdminDashboard(),
        api.fetchGarages(),
        api.getAdminMechanics(),
        api.getAdminTransport(),
      ]);
      setRequests(dashboard.mechanicRequests || []);
      setCustomers(dashboard.customers || []);
      setMechanics(mechanicsData || []);
      setListings([
        ...(garages || []).map((item: any) => ({ ...item, type: item.serviceType || "garage" })),
        ...(transportData || []).map((item: any) => ({ ...item, type: "transport" })),
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user?.role === "admin") load();
  }, [auth.user]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await auth.login(email, password, true);
      if (!user) setError("Invalid admin credentials");
    } catch (err) {
      setError((err as Error).message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (
    request: any,
    data: { status?: string; scheduledAt?: string },
  ) => {
    try {
      await api.updateMechanicRequest(request.id, data);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const setArrival = (request: any) => {
    const input = document.querySelector(
      `#arrival-${request.id}`,
    ) as HTMLInputElement | null;
    if (input?.value)
      updateRequest(request, { scheduledAt: input.value, status: "approved" });
  };

  const clearHistory = async () => {
    if (!window.confirm("Clear all completed and past customer request history?")) return;
    setClearingHistory(true);
    try {
      await api.clearAdminRequestHistory();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setClearingHistory(false);
    }
  };

  if (auth.user?.role !== "admin")
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <form
          onSubmit={login}
          className="mx-auto grid max-w-md gap-4 rounded-xl border border-border bg-card p-7 shadow-xl"
        >
          <div>
            <p className="portal-kicker">PinPoint / secure access</p>
            <h1 className="mt-1 text-2xl font-black">Admin control room</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review mechanic requests and publish service listings.
            </p>
          </div>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Admin email"
            required
            className="rounded border border-border bg-secondary px-3 py-3 text-sm"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password"
            required
            className="rounded border border-border bg-secondary px-3 py-3 text-sm"
          />
          {error && (
            <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="rounded bg-primary px-4 py-3 text-sm font-bold text-white"
          >
            {loading ? "Signing in..." : "Sign in as admin"}
          </button>
        </form>
      </main>
    );

  const pending = requests.filter(
    (request) => request.status === "pending",
  ).length;
  const active = requests.filter(
    (request) => !["completed", "rejected"].includes(request.status),
  ).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="portal-kicker">PinPoint / operations</p>
            <h1 className="text-xl font-black md:text-2xl">
              Admin control room
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              title="Refresh"
              className="rounded border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={auth.logout}
              className="rounded bg-secondary px-3 py-2 text-sm font-semibold"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {error && (
          <div className="mb-5 flex justify-between rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="portal-surface rounded-xl p-4">
            <p className="portal-kicker">Needs review</p>
            <p className="mt-2 text-3xl font-black text-primary">{pending}</p>
          </div>
          <div className="portal-surface rounded-xl p-4">
            <p className="portal-kicker">Active jobs</p>
            <p className="mt-2 text-3xl font-black">{active}</p>
          </div>
          <div className="portal-surface rounded-xl p-4">
            <p className="portal-kicker">Published listings</p>
            <p className="mt-2 text-3xl font-black">{listings.length}</p>
          </div>
          <div className="portal-surface rounded-xl p-4">
            <p className="portal-kicker">Customers</p>
            <p className="mt-2 text-3xl font-black">{customers.length}</p>
          </div>
        </div>
        <nav className="my-6 flex gap-2 overflow-x-auto border-b border-border">
          <button
            onClick={() => setView("requests")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === "requests" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <Wrench size={16} />
            Customer requests
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <Clock size={16} />
            History ({requests.filter((request) => !["pending", "reviewed"].includes(request.status)).length})
          </button>
          <button
            onClick={() => setView("listings")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === "listings" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <ListPlus size={16} />
            Service listings
          </button>
          <button
            onClick={() => setView("customers")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === "customers" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <LayoutDashboard size={16} />
            Customers
          </button>
          <button
            onClick={() => setView("mechanics")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold ${view === "mechanics" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            <Wrench size={16} />
            Mechanics (private)
          </button>
        </nav>
        {view === "requests" && (
          <section className="space-y-4">
            <div>
              <p className="portal-kicker">Dispatch queue</p>
              <h2 className="text-2xl font-black">Review customer requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review customer information, confirm arrival time, then keep
                progress current.
              </p>
            </div>
            {requests.filter((request) => ["pending", "reviewed"].includes(request.status)).map((request) => (
              <article
                key={request.id}
                className="portal-surface rounded-xl p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">
                        {request.customerName || request.customerEmail}
                      </h3>
                      <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                        {statusLabels[request.status as RequestStatus] ||
                          request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.customerPhone}{" "}
                      {request.customerWhatsapp &&
                        `· WhatsApp ${request.customerWhatsapp}`}
                    </p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">
                      {request.requestService}
                    </p>
                    <p className="mt-1 text-sm">{request.description}</p>
                  </div>
                  <div className="grid min-w-0 gap-2 text-sm lg:w-[42%]">
                    <p className="flex items-start gap-2">
                      <LocateFixed
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      <span>
                        <strong>Location:</strong> {request.requestedLocation}
                        {googleMapsUrl(
                          request.locationLatitude,
                          request.locationLongitude,
                        ) && (
                          <a
                            href={googleMapsUrl(
                              request.locationLatitude,
                              request.locationLongitude,
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 text-primary underline"
                          >
                            Open in Google Maps
                          </a>
                        )}
                      </span>
                    </p>
                    {googleMapsEmbedUrl(
                      request.locationLatitude,
                      request.locationLongitude,
                    ) && (
                      <iframe
                        title="Customer selected location"
                        src={googleMapsEmbedUrl(
                          request.locationLatitude,
                          request.locationLongitude,
                        )}
                        className="mt-2 h-40 w-full rounded border border-border"
                        loading="lazy"
                      />
                    )}
                    <p>
                      <strong>Vehicle:</strong>{" "}
                      {[
                        request.vehicleMake,
                        request.vehicleModel,
                        request.vehicleYear,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                      {request.licensePlate ? ` · ${request.licensePlate}` : ""}
                    </p>
                    <p>
                      <strong>Requested:</strong>{" "}
                      {request.dateRequested
                        ? new Date(request.dateRequested).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 border-t border-border pt-4 md:grid-cols-[auto_1fr_auto]">
                  <button
                    onClick={() =>
                      updateRequest(request, { status: "reviewed" })
                    }
                    disabled={request.status !== "pending"}
                    className="flex items-center justify-center gap-2 rounded border border-primary px-3 py-2 text-sm font-bold text-primary disabled:opacity-40"
                  >
                    <CheckCircle size={16} />
                    Mark reviewed
                  </button>
                  <input
                    id={`arrival-${request.id}`}
                    type="datetime-local"
                    defaultValue={
                      request.scheduledAt
                        ? String(request.scheduledAt).slice(0, 16)
                        : ""
                    }
                    className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => setArrival(request)}
                    className="rounded bg-primary px-3 py-2 text-sm font-bold text-white"
                  >
                    Set arrival time
                  </button>
                </div>
              </article>
            ))}
            {!requests.some((request) => ["pending", "reviewed"].includes(request.status)) && (
              <div className="portal-surface rounded-xl p-10 text-center text-sm text-muted-foreground">
                No mechanic requests yet.
              </div>
            )}
          </section>
        )}
        {view === "history" && (
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="portal-kicker">Past requests</p>
                <h2 className="text-2xl font-black">Request history</h2>
                <p className="mt-1 text-sm text-muted-foreground">Arrival-set, completed, and declined requests are kept here.</p>
              </div>
              <button onClick={clearHistory} disabled={clearingHistory || !requests.some((request) => !["pending", "reviewed"].includes(request.status))} className="rounded border border-red-500/40 px-3 py-2 text-sm font-bold text-red-400 disabled:opacity-40">
                {clearingHistory ? "Clearing..." : "Clear history"}
              </button>
            </div>
            {requests.filter((request) => !["pending", "reviewed"].includes(request.status)).map((request) => (
              <article key={request.id} className="portal-surface rounded-xl p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div><h3 className="font-bold">{request.customerName || request.customerEmail}</h3><p className="mt-1 text-sm text-muted-foreground">{request.customerPhone} · {request.requestService}</p></div>
                  <span className="h-fit rounded-full bg-secondary px-2 py-1 text-xs font-bold uppercase text-muted-foreground">{statusLabels[request.status as RequestStatus] || request.status}</span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{request.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">Requested {request.dateRequested ? new Date(request.dateRequested).toLocaleString() : "-"}</p>
              </article>
            ))}
            {!requests.some((request) => !["pending", "reviewed"].includes(request.status)) && <div className="portal-surface rounded-xl p-10 text-center text-sm text-muted-foreground">No past requests yet.</div>}
          </section>
        )}
        {view === "listings" && (
          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="portal-kicker">Admin catalog</p>
                <h2 className="text-2xl font-black">
                  Publish service listings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Garages, car hire, and bike hire are managed here.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setListingOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-bold text-white"
              >
                <ListPlus size={17} />
                Upload listing
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <article
                  key={listing.id}
                  className="portal-surface rounded-xl p-4"
                >
                  <p className="portal-kicker">{listing.type}</p>
                  <h3 className="mt-1 font-bold">
                    {listing.name || listing.company}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <LocateFixed size={14} />
                    {listing.location || listing.address || "Location not set"}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    {listing.availability || "Availability not set"}
                  </p>
                  {listing.type === "transport" && (
                    <p className="mt-1 text-sm text-muted-foreground">Contact: {listing.phone || "Not provided"}</p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedListing(listing);
                      setListingOpen(true);
                    }}
                    className="mt-4 w-full rounded border border-primary px-3 py-2 text-sm font-semibold text-primary"
                  >
                    Edit listing
                  </button>
                </article>
              ))}
            </div>
            {!listings.length && (
              <div className="portal-surface rounded-xl p-10 text-center text-sm text-muted-foreground">
                No listings published yet. Upload the first garage, car hire, or
                bike hire listing.
              </div>
            )}
          </section>
        )}
        {view === "mechanics" && (
          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="portal-kicker">Private directory</p><h2 className="text-2xl font-black">Mechanics</h2><p className="mt-1 text-sm text-muted-foreground">Only admin can view and manage mechanic details.</p></div>
              <button onClick={() => { setSelectedMechanic(null); setMechanicOpen(true); }} className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-bold text-white"><ListPlus size={17} />Add mechanic</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{mechanics.map(mechanic => <article key={mechanic.id} className="portal-surface rounded-xl p-4"><p className="portal-kicker">{mechanic.specialty || 'General repairs'}</p><h3 className="mt-1 font-bold">{mechanic.name}</h3><p className="mt-2 text-sm text-muted-foreground">Contact: {mechanic.phone || 'Not provided'}</p><p className="text-sm text-muted-foreground">Garage: {mechanic.garageId || 'Independent'}</p><p className="text-sm text-muted-foreground">Location: {mechanic.location || 'Not provided'}</p><p className="mt-2 text-sm text-muted-foreground">{mechanic.description || 'No service details added.'}</p><button onClick={() => { setSelectedMechanic(mechanic); setMechanicOpen(true); }} className="mt-4 w-full rounded border border-primary px-3 py-2 text-sm font-semibold text-primary">Edit mechanic</button></article>)}</div>
            {!mechanics.length && <div className="portal-surface rounded-xl p-10 text-center text-sm text-muted-foreground">No mechanics added yet.</div>}
          </section>
        )}
        {view === "customers" && (
          <section className="portal-surface overflow-hidden rounded-xl">
            <div className="border-b border-border p-5">
              <p className="portal-kicker">Customer directory</p>
              <h2 className="mt-1 text-2xl font-black">Customers</h2>
            </div>
            <div className="divide-y divide-border">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-bold">
                      {[customer.firstName, customer.lastName]
                        .filter(Boolean)
                        .join(" ") || customer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        title="Email customer"
                        className="rounded border border-border p-2 text-primary"
                      >
                        <Mail size={16} />
                      </a>
                    )}
                    {customer.phone && (
                      <a
                        href={whatsappUrl(customer.whatsapp || customer.phone)}
                        target="_blank"
                        rel="noreferrer"
                        title="WhatsApp customer"
                        className="rounded border border-border p-2 text-green-500"
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {!customers.length && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No customers yet.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
      <ListingDialog
        open={listingOpen}
        onOpenChange={setListingOpen}
        initialItem={selectedListing}
        mode={selectedListing ? "edit" : "create"}
        providerContact={auth.user?.email}
        allowedServiceTypes={["garage", "car-hire", "bike-hire"]}
        onSaved={() => {
          setListingOpen(false);
          setSelectedListing(null);
          load();
        }}
      />
      <ListingDialog
        open={mechanicOpen}
        onOpenChange={setMechanicOpen}
        initialItem={selectedMechanic ? { ...selectedMechanic, serviceType: "mechanic" } : { serviceType: "mechanic" }}
        mode={selectedMechanic ? "edit" : "create"}
        allowedServiceTypes={["mechanic"]}
        onSaved={() => { setMechanicOpen(false); setSelectedMechanic(null); load(); }}
      />
    </div>
  );
}
