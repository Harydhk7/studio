import { useEffect, useMemo, useState } from "react";

const collectionConfig = {
  slides: {
    title: "Hero Slides",
    description: "Manage the homepage slideshow images (4-5 photos recommended).",
    primary: "image",
    secondary: "order",
    fields: [["image", "text"], ["caption", "text"], ["order", "text"], ["active", "checkbox"]],
  },
  vscoPhotos: {
    title: "VSCO Gallery",
    description: "Upload and manage photos shown in the masonry gallery below featured work.",
    primary: "image",
    secondary: "active",
    fields: [["image", "text"], ["active", "checkbox"]],
  },
  enquiries: {
    title: "Enquiries",
    description: "Review new photography enquiries and update follow-up status.",
    primary: "name",
    secondary: "eventType",
    fields: [
      ["name", "text"], ["phone", "text"], ["email", "email"],
      ["eventType", "select", ["Wedding", "Pre-wedding", "Baby shower", "Baby shoot", "Other event"]],
      ["eventDate", "date"], ["venue", "text"],
      ["status", "select", ["new", "contacted", "quoted", "converted", "closed"]],
      ["message", "textarea"],
    ],
  },
  bookings: {
    title: "Bookings",
    description: "Manage confirmed events, payment status, package and shoot details.",
    primary: "clientName",
    secondary: "eventType",
    fields: [
      ["clientName", "text"], ["phone", "text"],
      ["eventType", "select", ["Wedding", "Pre-wedding", "Baby shower", "Baby shoot", "Other event"]],
      ["eventDate", "date"], ["venue", "text"], ["packageName", "text"], ["amount", "text"],
      ["status", "select", ["pending", "confirmed", "shoot_done", "editing", "delivered", "cancelled"]],
      ["paymentStatus", "select", ["not_paid", "advance_paid", "paid", "refunded"]],
      ["notes", "textarea"],
    ],
  },
  services: {
    title: "Services",
    description: "Control service cards shown on the public website.",
    primary: "title",
    secondary: "price",
    fields: [["title", "text"], ["description", "textarea"], ["price", "text"], ["active", "checkbox"]],
  },
  packages: {
    title: "Packages",
    description: "Create and update photography package offers.",
    primary: "title",
    secondary: "price",
    fields: [["title", "text"], ["price", "text"], ["features", "textarea"], ["active", "checkbox"]],
  },
  galleries: {
    title: "Gallery",
    description: "Manage public portfolio cards and featured image paths.",
    primary: "title",
    secondary: "category",
    fields: [["title", "text"], ["image", "text"], ["category", "text"], ["featured", "checkbox"]],
  },
  testimonials: {
    title: "Testimonials",
    description: "Publish client reviews on the public site.",
    primary: "name",
    secondary: "event",
    fields: [["name", "text"], ["event", "text"], ["quote", "textarea"], ["active", "checkbox"]],
  },
  customers: {
    title: "Customers",
    description: "Keep client contact records and notes.",
    primary: "name",
    secondary: "phone",
    fields: [["name", "text"], ["phone", "text"], ["email", "email"], ["notes", "textarea"]],
  },
};

const fallback = {
  settings: {
    studioName: "Spot Freeze Photography",
    tagline: "Transforming genuine happiness into eternal imagery",
    email: "hello@spotfreeze.in",
    phone: "+91 98765 43210",
    heroImage: "/images/portfolio.jpeg",
  },
  slides: [
    { id: "fallback-slide-1", image: "/images/portfolio.jpeg", caption: "", active: true, order: 1 },
    { id: "fallback-slide-2", image: "/images/babyshower.jpeg", caption: "", active: true, order: 2 },
    { id: "fallback-slide-3", image: "/images/babyshoot.jpeg", caption: "", active: true, order: 3 },
  ],
  vscoPhotos: [
    { id: "fallback-vsco-1", image: "/images/portfolio.jpeg", active: true },
    { id: "fallback-vsco-2", image: "/images/babyshower.jpeg", active: true },
    { id: "fallback-vsco-3", image: "/images/babyshoot.jpeg", active: true },
  ],
  services: [
    { id: "fallback-wedding", title: "Wedding Photography", description: "Full-day ritual, candid, portrait, and reception coverage.", price: "Custom quote" },
    { id: "fallback-prewedding", title: "Pre-Wedding Shoots", description: "Relaxed couple portraits with a cinematic finish.", price: "Custom quote" },
    { id: "fallback-engagement", title: "Engagement Shoot", description: "Expressive portraits and intimate details for your promise.", price: "Custom quote" },
    { id: "fallback-candid", title: "Candid Videography", description: "Story-led coverage of laughter, rituals, and in-between moments.", price: "Custom quote" },
    { id: "fallback-maternity", title: "Maternity Shoot", description: "Warm, graceful portraits for this beautiful chapter.", price: "Custom quote" },
    { id: "fallback-newborn", title: "Newborn Baby Shoot", description: "Gentle portraits for your newest family member.", price: "Custom quote" },
    { id: "fallback-events", title: "Corporate Events", description: "Polished photography for conferences, launches, and teams.", price: "Custom quote" },
    { id: "fallback-editing", title: "Candid Video Editing", description: "Cinematic editing, colour, sound, and story shaping.", price: "Custom quote" },
    { id: "fallback-album", title: "Album Design", description: "Beautifully sequenced album layouts designed around your story.", price: "Custom quote" },
    { id: "fallback-gifts", title: "Wedding Gifts", description: "Thoughtful wedding keepsakes and personalised gifts.", price: "Custom quote" },
  ],
  packages: [
    { id: "fallback-classic", title: "Classic Wedding", price: "Rs. 55,000", features: "1 photographer, 1 videographer, edited photos, highlight reel" },
    { id: "fallback-premium", title: "Premium Wedding", price: "Rs. 95,000", features: "Candid team, traditional team, teaser, and album design" },
    { id: "fallback-family", title: "Family Moments", price: "Rs. 18,000", features: "2-hour session, edited gallery, and print-ready portraits" },
  ],
  galleries: [
    { id: "fallback-wedding-story", title: "Wedding Stories", image: "/images/portfolio.jpeg", category: "Wedding" },
    { id: "fallback-shower-story", title: "Baby Shower", image: "/images/babyshower.jpeg", category: "Family" },
    { id: "fallback-baby-story", title: "Baby Shoot", image: "/images/babyshoot.jpeg", category: "Portrait" },
  ],
  testimonials: [
    { id: "fallback-testimonial", name: "Varalakshmi & Karthik", event: "Wedding Album", quote: "The pictures turned out beautiful. We are so glad we chose Spot Freeze." },
  ],
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function assetUrl(value) {
  if (!value || !value.startsWith("/uploads/")) return value;
  return `${API_BASE_URL}${value}`;
}

async function api(path, options = {}) {
  const token = localStorage.getItem("spotfreeze_admin_token");
  const headers = { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Request failed");
  }
  return response.status === 204 ? null : response.json();
}

function useRoute() {
  const [route, setRoute] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
    window.scrollTo(0, 0);
  };
  return [route, navigate];
}

function getAdminSection(route) {
  const section = route.split("/")[2] || "dashboard";
  return section === "dashboard" || section === "settings" || collectionConfig[section] ? section : "dashboard";
}

function Navbar({ navigate }) {
  const [open, setOpen] = useState(false);
  const jump = (id) => {
    navigate("/");
    setOpen(false);
    setTimeout(() => document.querySelector(id)?.scrollIntoView({ behavior: "smooth" }), 40);
  };
  return (
    <header className="site-header">
      <button className="brand link-button" onClick={() => navigate("/")}>
        <img src="/images/spot-freeze-logo-4-1-.png" alt="" />
        <span>Spot Freeze</span>
      </button>
      <nav className={open ? "nav-links open" : "nav-links"}>
        <button onClick={() => jump("#work")}>Work</button>
        <button onClick={() => jump("#services")}>Services</button>
        <button onClick={() => jump("#packages")}>Packages</button>
        <button onClick={() => { setOpen(false); navigate("/contact"); }}>Contact</button>
        <button onClick={() => navigate("/admin")}>Admin</button>
      </nav>
      <button className="nav-cta" onClick={() => { setOpen(false); navigate("/contact"); }}>Contact</button>
      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu"><span /><span /><span /></button>
    </header>
  );
}

function ContactPage({ navigate }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    try {
      await api("/api/enquiries", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      form.reset();
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="contact-page">
      <header className="contact-page-header">
        <button className="brand link-button" onClick={() => navigate("/")}>
          <img src="/images/spot-freeze-logo-4-1-.png" alt="Spot Freeze Photography logo" />
          <span>Spot Freeze</span>
        </button>
        <button className="button ghost" onClick={() => navigate("/")}>Back to website</button>
      </header>
      <section className="contact-page-content">
        <div className="contact-page-intro">
          <img className="contact-page-logo" src="/images/spot-freeze-logo-4-1-.png" alt="Spot Freeze Photography logo" />
          <h1>Contact Spot Freeze</h1>
          <p>Tell us about your celebration, shoot, or creative project. Our team will get back to you with the next steps.</p>
          <a href="mailto:spofreezephotography@gmail.com">spofreezephotography@gmail.com</a>
        </div>
        <form className="contact-page-form" onSubmit={submit}>
          <label>Name<input name="name" required /></label>
          <label>Phone<input name="phone" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Service<select name="eventType"><option>Wedding photography</option><option>Pre-wedding shoot</option><option>Engagement shoot</option><option>Family or milestone shoot</option><option>Videography or editing</option><option>Corporate event</option><option>Other service</option></select></label>
          <label>Preferred date<input name="eventDate" type="date" /></label>
          <label>Venue or location<input name="venue" /></label>
          <label className="full">Message<textarea name="message" rows="5" placeholder="Tell us a little about what you have in mind." /></label>
          {error && <p className="error-note full">{error}</p>}
          {sent && <p className="success-note full">Thank you. Your message has been sent to Spot Freeze.</p>}
          <button className="button primary full" type="submit">Send Message</button>
        </form>
      </section>
    </main>
  );
}

function HeroSlider({ slides }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  return (
    <div className="hero-slider">
      {slides.map((slide, i) => (
        <div key={slide.id} className={`hero-slide${i === current ? " active" : ""}`}>
          <img src={assetUrl(slide.image) || slide.image} alt={slide.caption || ""} />
        </div>
      ))}
      {slides.length > 1 && (
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button key={i} className={i === current ? "dot active" : "dot"} onClick={() => setCurrent(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicSite({ navigate }) {
  const [data, setData] = useState(fallback);
  const [sent, setSent] = useState(false);
  useEffect(() => { api("/api/public").then(setData).catch(() => setData(fallback)); }, []);
  const { settings, slides = fallback.slides, services, packages: packageList, galleries, vscoPhotos = fallback.vscoPhotos, testimonials } = data;
  return (
    <>
      <Navbar navigate={navigate} />
      <main>
        <section className="hero">
          <HeroSlider slides={slides.length ? slides : fallback.slides} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">Wedding, family and event photography</p>
            <h1>{settings.studioName}</h1>
            <p>{settings.tagline} We Freeze Your Golden Moments.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}>Reserve a Date</button>
              <button className="button secondary" onClick={() => document.querySelector("#work")?.scrollIntoView({ behavior: "smooth" })}>View Stories</button>
            </div>
          </div>
        </section>
        <section className="stats-band">
          <div><strong>25+</strong><span>Weddings</span></div><div><strong>3+</strong><span>Years</span></div><div><strong>10</strong><span>Team Members</span></div><div><strong>8</strong><span>Locations</span></div>
        </section>
        <section id="work" className="section">
          <div className="section-heading"><p className="eyebrow">Featured work</p><h2>Stories shaped with light, patience, and timing.</h2></div>
          <div className="portfolio-grid">
            {galleries.map((item) => (
              <article className="story-card" key={item.id}>
                <img src={assetUrl(item.image) || item.image} alt={item.title} />
                <div><h3>{item.title}</h3><p>{item.category}</p></div>
              </article>
            ))}
          </div>
        </section>
        <section className="vsco-gallery">
          {vscoPhotos.map((item) => (
            <div className="vsco-item" key={item.id}>
              <img src={assetUrl(item.image) || item.image} alt="" />
            </div>
          ))}
        </section>
        <section id="services" className="split-section">
          <div><p className="eyebrow">Services</p><h2>Coverage built for weddings, families, and once-in-a-lifetime events.</h2><p>A very comprehensive range of services to capture all your special moments.</p></div>
          <div className="service-list">{services.map((service) => <span key={service.id}><b>{service.title}</b><small>{service.description}</small><em>{service.price}</em></span>)}</div>
        </section>
        <section id="packages" className="section muted">
          <div className="section-heading"><p className="eyebrow">Packages</p><h2>Photography packages ready for enquiries and bookings.</h2></div>
          <div className="process-grid">{packageList.map((item) => <article key={item.id}><span>{item.price}</span><h3>{item.title}</h3><p>{item.features}</p></article>)}</div>
        </section>
        <section className="section">
          <div className="section-heading"><p className="eyebrow">Client words</p><h2>Here's what our clients say about us.</h2></div>
          <div className="testimonial-grid">{testimonials.map((item) => <figure key={item.id}><blockquote>{item.quote}</blockquote><figcaption><strong>{item.name}</strong><span>{item.event}</span></figcaption></figure>)}</div>
        </section>
        <section id="contact" className="contact-section">
          <div><p className="eyebrow">Booking enquiry</p><h2>Give us a call or send us a message and we'll get back to you as soon as possible.</h2><p>Admin will review your enquiry and get back to you as soon as possible.</p>{sent && <p className="success-note">Enquiry saved. The Spot Freeze team can now see it in admin.</p>}</div>
          <form onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            await api("/api/enquiries", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
            form.reset();
            setSent(true);
          }}>
            <label>Name<input name="name" required /></label><label>Phone<input name="phone" required /></label><label>Email<input name="email" type="email" /></label>
            <label>Event Type<select name="eventType"><option>Wedding</option><option>Pre-wedding</option><option>Baby shower</option><option>Baby shoot</option><option>Other event</option></select></label>
            <label>Event Date<input name="eventDate" type="date" /></label><label>Venue<input name="venue" /></label><label className="full">Message<textarea name="message" rows="4" /></label>
            <button className="button primary full" type="submit">Send Enquiry</button>
          </form>
        </section>
      </main>
      <footer className="footer"><div><img src="/images/dark version logo.png" alt="" /><p><strong>{settings.studioName}</strong><br />{settings.email} - {settings.phone}</p></div><p>2026 Spot Freeze Photography All rights reserved.</p></footer>
    </>
  );
}

function AdminLogin({ onLogin }) {
  const [error, setError] = useState("");
  return (
    <main className="admin-login">
      <form onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        try {
          const result = await api("/api/admin/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
          localStorage.setItem("spotfreeze_admin_token", result.token);
          onLogin();
        } catch (err) { setError(err.message); }
      }}>
        <img src="/images/spot-freeze-logo-4-1-.png" alt="" /><h1>Admin Login</h1>
        <label>Username<input name="username" defaultValue="admin" /></label><label>Password<input name="password" type="password" defaultValue="admin123" /></label>
        {error && <p className="error-note full">{error}</p>}<button className="button primary full" type="submit">Login</button>
      </form>
    </main>
  );
}

function StatusBadge({ value }) {
  return <span className={`status-badge status-${String(value || "active").replaceAll("_", "-")}`}>{String(value || "active").replaceAll("_", " ")}</span>;
}

function Dashboard({ navigateAdmin }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => { api("/api/admin/dashboard").then(setSummary).catch(() => {}); }, []);
  if (!summary) return <div className="admin-card">Loading dashboard...</div>;
  const cards = [
    ["Enquiries", summary.counts.enquiries, "New leads from the public form", "enquiries"],
    ["Bookings", summary.counts.bookings, "Confirmed photography events", "bookings"],
    ["Customers", summary.counts.customers, "Client records", "customers"],
    ["Gallery", summary.counts.galleries, "Portfolio items", "galleries"],
  ];
  return (
    <>
      <div className="admin-title"><div><p className="eyebrow">Overview</p><h1>Dashboard</h1><p>Spot Freeze management center, shaped like the Sozolen admin flow.</p></div></div>
      <div className="admin-stats">{cards.map(([label, value, helper, route]) => <button key={label} onClick={() => navigateAdmin(route)}><strong>{value}</strong><span>{label}</span><small>{helper}</small></button>)}</div>
      <div className="admin-columns">
        <section className="admin-card"><h2>Recent Enquiries</h2>{summary.recentEnquiries.length === 0 && <p className="empty">No enquiries yet.</p>}{summary.recentEnquiries.map((item) => <button className="admin-row" key={item.id} onClick={() => navigateAdmin("enquiries")}><b>{item.name}</b><span>{item.eventType} - {item.status}</span><StatusBadge value={item.status} /></button>)}</section>
        <section className="admin-card"><h2>Upcoming Bookings</h2>{summary.upcomingBookings.length === 0 && <p className="empty">No bookings yet.</p>}{summary.upcomingBookings.map((item) => <button className="admin-row" key={item.id} onClick={() => navigateAdmin("bookings")}><b>{item.clientName}</b><span>{item.eventDate} - {item.eventType}</span><StatusBadge value={item.status} /></button>)}</section>
      </div>
    </>
  );
}

function Field({ field, type, options, value, onChange }) {
  const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
  if (type === "checkbox") {
    return <label className="checkbox-field"><input name={field} type="checkbox" checked={value !== false} onChange={(event) => onChange(field, event.target.checked)} /> {label}</label>;
  }
  if (type === "textarea") {
    return <label className="full">{label}<textarea name={field} rows="4" value={value || ""} onChange={(event) => onChange(field, event.target.value)} /></label>;
  }
  if (type === "select") {
    return <label>{label}<select name={field} value={value || options[0]} onChange={(event) => onChange(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
  }
  return <label>{label}<input name={field} type={type} value={value || ""} onChange={(event) => onChange(field, event.target.value)} /></label>;
}

function ImageUpload({ value, onChange }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const uploadImage = async () => {
    if (!file || !name.trim()) {
      setStatus("Choose an image and enter a file name first.");
      return;
    }
    setStatus("Uploading...");
    try {
      const body = new FormData();
      body.append("name", name);
      body.append("image", file);
      const result = await api("/api/admin/uploads", { method: "POST", body });
      onChange(result.image);
      setStatus(`Saved as ${result.name}`);
    } catch (error) {
      setStatus(error.message);
    }
  };
  return (
    <div className="image-upload full">
      <label>Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
      <label>File name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="wedding-story" /></label>
      <p>Gallery recommendation: 1600 x 1200 px, JPG/PNG/WebP, maximum 5 MB. The extension is kept from the selected file.</p>
      <button className="button ghost" type="button" onClick={uploadImage}>Upload and use image</button>
      {value && <small>Current image: {value}</small>}
      {status && <small>{status}</small>}
    </div>
  );
}

function AdminPreview({ collection, item }) {
  const title = item?.title || item?.name || item?.clientName || "Preview title";
  const subtitle = item?.eventType || item?.category || item?.event || item?.price || "Live preview";
  if (collection === "galleries" || collection === "vscoPhotos" || collection === "slides") {
    return (
      <div className="preview-phone">
        <article className="preview-story">
          <img src={assetUrl(item?.image || "/images/portfolio.jpeg")} alt="" />
          {collection === "galleries" && <div><h3>{title}</h3><p>{item?.category || "Wedding"}</p></div>}
        </article>
      </div>
    );
  }
  if (collection === "testimonials") {
    return (
      <div className="preview-phone">
        <figure className="preview-quote">
          <blockquote>{item?.quote || "Client quote preview appears here as you type."}</blockquote>
          <figcaption><strong>{title}</strong><span>{item?.event || "Event type"}</span></figcaption>
        </figure>
      </div>
    );
  }
  if (collection === "services") {
    return (
      <div className="preview-phone">
        <article className="preview-service">
          <span>Service</span>
          <h3>{title}</h3>
          <p>{item?.description || "Service description preview appears here."}</p>
          <strong>{item?.price || "Custom quote"}</strong>
        </article>
      </div>
    );
  }
  if (collection === "packages") {
    return (
      <div className="preview-phone">
        <article className="preview-package">
          <span>{item?.price || "Package price"}</span>
          <h3>{title}</h3>
          <p>{item?.features || "Package features preview appears here."}</p>
        </article>
      </div>
    );
  }
  return (
    <div className="preview-phone">
      <article className="preview-record">
        <StatusBadge value={item?.status || item?.paymentStatus || "active"} />
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <small>{item?.phone || item?.email || item?.venue || "Record details preview"}</small>
      </article>
    </div>
  );
}

function AdminCollection({ collection }) {
  const config = collectionConfig[collection];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const emptyItem = useMemo(() => Object.fromEntries(config.fields.map(([field, type]) => [field, type === "checkbox" ? true : ""])), [config]);
  useEffect(() => {
    let active = true;
    setError("");
    api(`/api/admin/${collection}`)
      .then((result) => { if (active) setItems(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [collection]);
  const load = () => api(`/api/admin/${collection}`).then(setItems).catch((err) => setError(err.message));
  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  const openEditor = (item) => {
    setEditing(item);
    setDraft({ ...item });
  };
  const closeEditor = () => {
    setEditing(null);
    setDraft(null);
  };
  const updateDraft = (field, value) => setDraft((current) => ({ ...(current || emptyItem), [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    const raw = { ...(draft || {}) };
    for (const [field, type] of config.fields) if (type === "checkbox") raw[field] = raw[field] !== false;
    const path = editing?.id ? `/api/admin/${collection}/${editing.id}` : `/api/admin/${collection}`;
    await api(path, { method: editing?.id ? "PUT" : "POST", body: JSON.stringify(raw) });
    closeEditor();
    load();
  };
  return (
    <>
      <div className="admin-title">
        <div><p className="eyebrow">Management</p><h1>{config.title}</h1><p>{config.description}</p></div>
        <button className="button primary" onClick={() => openEditor(emptyItem)}>Add New</button>
      </div>
      {error && <p className="error-note">{error}</p>}
      <div className="admin-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} /><span>{filtered.length} records</span></div>
      {editing && <div className="admin-editor-grid">
        <form className="admin-form" onSubmit={save}>
          {config.fields.map(([field, type, options]) => <Field key={field} field={field} type={type} options={options} value={draft?.[field]} onChange={updateDraft} />)}
          {collection === "galleries" && <ImageUpload value={draft?.image} onChange={(value) => updateDraft("image", value)} />}
          {collection === "slides" && <ImageUpload value={draft?.image} onChange={(value) => updateDraft("image", value)} />}
          {collection === "vscoPhotos" && <ImageUpload value={draft?.image} onChange={(value) => updateDraft("image", value)} />}
          <button className="button primary" type="submit">Save</button><button className="button ghost" type="button" onClick={closeEditor}>Cancel</button>
        </form>
        <aside className="admin-preview-card">
          <div className="preview-header"><span>Preview</span><StatusBadge value={draft?.status || draft?.paymentStatus || (draft?.active === false ? "inactive" : "active")} /></div>
          <AdminPreview collection={collection} item={draft} />
        </aside>
      </div>}
      <div className="admin-table">
        <div className="admin-table-head"><span>Name</span><span>Details</span><span>Status</span><span>Actions</span></div>
        {filtered.map((item) => <article key={item.id}>
          <div><h3>{item[config.primary] || item.id}</h3><p>{item.email || item.phone || item.image || item.createdAt}</p></div>
          <div><p>{item[config.secondary] || item.venue || item.features || item.description || "No details"}</p></div>
          <div><StatusBadge value={item.status || item.paymentStatus || (item.active === false ? "inactive" : item.featured === false ? "not_featured" : "active")} /></div>
          <div className="row-actions"><button onClick={() => openEditor(item)}>Edit</button><button onClick={async () => { await api(`/api/admin/${collection}/${item.id}`, { method: "DELETE" }); load(); }}>Delete</button></div>
        </article>)}
        {filtered.length === 0 && <div className="empty-table">No records found.</div>}
      </div>
    </>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState(fallback.settings);
  const [draft, setDraft] = useState(fallback.settings);
  useEffect(() => { api("/api/public").then((data) => { setSettings(data.settings); setDraft(data.settings); }); }, []);
  return (
    <>
      <div className="admin-title"><div><p className="eyebrow">Site</p><h1>Settings</h1><p>Control the public brand, contact details, and hero image.</p></div></div>
      <div className="admin-editor-grid">
        <form className="admin-form" onSubmit={async (event) => {
          event.preventDefault();
          const result = await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(draft) });
          setSettings(result);
          setDraft(result);
        }}>
          {["studioName", "tagline", "email", "phone", "instagram", "heroImage"].map((field) => <Field key={field} field={field} type="text" value={draft[field]} onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))} />)}
          <button className="button primary" type="submit">Save Settings</button>
        </form>
        <aside className="admin-preview-card">
          <div className="preview-header"><span>Home Preview</span><StatusBadge value="draft" /></div>
          <div className="preview-home">
            <img src={assetUrl(draft.heroImage || "/images/portfolio.jpeg")} alt="" />
            <div>
              <p>Wedding, family and event photography</p>
              <h3>{draft.studioName || settings.studioName}</h3>
              <span>{draft.tagline || settings.tagline}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function AdminApp({ route, navigate }) {
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("spotfreeze_admin_token")));
  const section = getAdminSection(route);
  const navigateAdmin = (target) => navigate(target === "dashboard" ? "/admin" : `/admin/${target}`);
  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  const nav = [["dashboard", "Dashboard"], ...Object.entries(collectionConfig).map(([key, value]) => [key, value.title]), ["settings", "Settings"]];
  return (
    <main className="admin-shell">
      <aside>
        <button className="brand link-button" onClick={() => navigate("/")}><img src="/images/spot-freeze-logo-4-1-.png" alt="" /><span>Spot Freeze Admin</span></button>
        <div className="admin-user"><strong>admin</strong><span>Studio manager</span></div>
        {nav.map(([key, label]) => <button key={key} className={section === key || (key === "dashboard" && section === "dashboard") ? "active" : ""} onClick={() => navigateAdmin(key)}>{label}</button>)}
        <button onClick={() => { localStorage.removeItem("spotfreeze_admin_token"); setLoggedIn(false); }}>Logout</button>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><button onClick={() => navigate("/")}>View Website</button><span>Spot Freeze Photography</span></header>
        <section className="admin-content">
          {section === "dashboard" && <Dashboard navigateAdmin={navigateAdmin} />}
          {section === "settings" && <SettingsPanel />}
          {collectionConfig[section] && <AdminCollection collection={section} />}
          {!collectionConfig[section] && section !== "dashboard" && section !== "settings" && <div className="admin-card">Page not found.</div>}
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [route, navigate] = useRoute();
  if (route === "/contact") return <ContactPage navigate={navigate} />;
  return route.startsWith("/admin") ? <AdminApp route={route} navigate={navigate} /> : <PublicSite navigate={navigate} />;
}
