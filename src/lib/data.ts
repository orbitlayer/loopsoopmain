/* ------------------------------------------------------------------ */
/*  LOOPSOOP — content model                                           */
/*  Single source of truth for copy shown across the site.            */
/* ------------------------------------------------------------------ */

export const site = {
  name: "Loopsoop",
  tagline: "Edit. Connect. Elevate.",
  domain: "loopsoop.in",
  url: "https://loopsoop.in",
  description:
    "Loopsoop is the creative division of OrbitLayer, providing premium Video Editing and Graphic Design services for creators, startups, agencies, and businesses.",
  email: "loopsoop@orbitlayer.in",
  phone: "+91 98351 06943",
  phoneHref: "+919835106943",
  // WhatsApp number in international format, digits only (no +, spaces or dashes).
  whatsapp: "919835106943",
  hours: "Mon - Sat, 10AM - 8PM IST",
  discord: "@loopsoop.in",
  discordHref: "https://discord.com/users/loopsoop.in",
  location: "Remote First",
  // Loopsoop is the creative division of its parent company, OrbitLayer.
  parent: {
    name: "OrbitLayer",
    url: "https://orbitlayer.in",
    relationship: "A Creative Division of OrbitLayer",
  },
  socials: {
    instagram: "https://instagram.com/loopsoop",
    youtube: "https://youtube.com/@loopsoop",
    linkedin: "https://linkedin.com/company/loopsoop",
    discord: "https://discord.com/users/loopsoop.in",
  },
} as const;

/* WhatsApp is the primary contact / quotation channel. */
export const WHATSAPP_DEFAULT_MESSAGE =
  "Hi LOOPSOOP! I'd like a quote for a video editing project.";

/* Build a wa.me link for a specific number (used with CMS-resolved details). */
export const whatsappLink = (
  number: string,
  message: string = WHATSAPP_DEFAULT_MESSAGE,
) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/* Default wa.me link using the built-in number (fallback when no override). */
export const whatsappUrl = (message: string = WHATSAPP_DEFAULT_MESSAGE) =>
  whatsappLink(site.whatsapp, message);

/* Visible primary navigation.
   Hidden-but-live routes (kept functional, intentionally not listed here):
   - /portfolio   → the gallery "engine" (reached via the Our Work categories)
   - /clients     → Past Clients (re-enable later by adding it back) */
export const nav = [
  { label: "Home", href: "/" },
  { label: "Our Work", href: "/our-work" },
  { label: "About", href: "/about" },
] as const;

/* Monochrome brand wordmarks for the "trusted by" strips.
   `style` maps to a small set of typographic treatments in <BrandMark>. */
export type Brand = { name: string; style?: "serif" | "italic" | "wide" | "black" };

/* Same trusted-brand roster is shown on both Home and Contact. */
const trustedBrands: Brand[] = [
  { name: "OrbitLayer", style: "black" },
  { name: "Mr Nefgamer", style: "italic" },
  { name: "Xtra Gaming", style: "wide" },
  { name: "Xstart", style: "black" },
  { name: "Solami", style: "serif" },
  { name: "Solana Foundation", style: "wide" },
  { name: "Unknown Logs", style: "italic" },
  { name: "Rextrakt", style: "black" },
  { name: "Nova Studios", style: "wide" },
  { name: "Pixelforge", style: "black" },
  { name: "Vortex Media", style: "italic" },
];

export const trustedHome: Brand[] = trustedBrands;

export const trustedClients: Brand[] = trustedBrands;

/* Portfolio categories (home) */
export type Category = { label: string; icon: string };

export const categories: Category[] = [
  { label: "Motion Graphics", icon: "sparkles" },
  { label: "Talking Head", icon: "mic" },
  { label: "2D Animation", icon: "shapes" },
  { label: "Real Estate", icon: "building-2" },
  { label: "Commercials", icon: "megaphone" },
];

/* Projects — used across Home (featured) and Our Work (all) */
export type Project = {
  id: string;
  title: string;
  category: string; // display label
  filter: string; // matches a filter chip on /our-work (an editingCategories name)
  type: "long" | "short"; // long-form (16:9) or short-form (9:16) — drives the subsection
  seed: number; // deterministic placeholder variation (fallback when no thumbnail)
  provider?: "youtube" | "google_drive"; // video source (defaults to youtube)
  youtubeId?: string; // YouTube video ID — powers the thumbnail + modal player
  driveId?: string; // Google Drive file ID — powers the preview embed
  thumbnailUrl?: string; // explicit thumbnail (Drive override / fallback)
  featured?: boolean;
};

// ⚠️ youtubeId values below are PLACEHOLDERS (same demo video for every card).
// Replace each with the real YouTube video ID for that project — it's the part
// after "v=" in a watch URL, e.g. https://youtu.be/dQw4w9WgXcQ → "dQw4w9WgXcQ".
const DEMO_VIDEO = "aqz-KE-bpKQ";

export const projects: Project[] = [
  // Commercials
  { id: "boat-airdopes", title: "boAt Airdopes 141", category: "Product Commercial", filter: "Commercials", type: "long", seed: 3, youtubeId: DEMO_VIDEO, featured: true },
  { id: "puma-ignite", title: "PUMA Ignite Campaign", category: "Brand Commercial", filter: "Commercials", type: "long", seed: 21, youtubeId: DEMO_VIDEO, featured: true },
  { id: "coca-cola-zero", title: "Coca-Cola Zero", category: "Commercial Reel", filter: "Commercials", type: "short", seed: 63, youtubeId: DEMO_VIDEO },
  { id: "minimalist-skincare", title: "Minimalist Skincare", category: "Product Ad", filter: "Commercials", type: "short", seed: 91, youtubeId: DEMO_VIDEO },
  // Motion Graphics
  { id: "nexgen-app", title: "NexGen App Launch", category: "Motion Graphics", filter: "Motion Graphics", type: "long", seed: 72, youtubeId: DEMO_VIDEO, featured: true },
  { id: "kinetic-reel", title: "Kinetic Type Reel", category: "Motion Design", filter: "Motion Graphics", type: "short", seed: 18, youtubeId: DEMO_VIDEO },
  // 2D Animation
  { id: "payments-explained", title: "How Payments Work", category: "2D Explainer", filter: "2D Animation", type: "long", seed: 33, youtubeId: DEMO_VIDEO, featured: true },
  { id: "animated-brand-story", title: "Animated Brand Story", category: "Character Animation", filter: "2D Animation", type: "short", seed: 84, youtubeId: DEMO_VIDEO },
  // Real Estate
  { id: "luxury-redefined", title: "Luxury Redefined", category: "Real Estate Film", filter: "Real Estate", type: "long", seed: 44, youtubeId: DEMO_VIDEO, featured: true },
  { id: "skyline-residences", title: "Skyline Residences", category: "Property Walkthrough", filter: "Real Estate", type: "short", seed: 51, youtubeId: DEMO_VIDEO },
  // Talking Head
  { id: "finance-simplified", title: "Finance Simplified", category: "Talking-Head Series", filter: "Talking Head", type: "long", seed: 12, youtubeId: DEMO_VIDEO, featured: true },
  { id: "creator-diaries", title: "Creator Diaries", category: "Talking-Head Short", filter: "Talking Head", type: "short", seed: 7, youtubeId: DEMO_VIDEO },
];

/* Unified editing categories.
   One taxonomy shown as cards on Our Editing, used as the Our Work filter
   chips, and referenced by ?category=<slug> deep links. Every project's
   `filter` matches one of these `name`s. Add/rename here to update everywhere. */
export type EditingCategory = {
  slug: string;
  name: string;
  description: string;
  seed: number;
  image: string; // category-card cover image (public/categories/<slug>.webp)
};

export const editingCategories: EditingCategory[] = [
  { slug: "motion-graphics", name: "Motion Graphics", description: "Animated graphics, kinetic typography and motion design that make every frame move with intent.", seed: 72, image: "/categories/corporate.webp?v=2" },
  // Talking Head & 2D Animation have no accurate baked-in cover art yet, so they
  // use the clean monochrome card fallback (empty image) instead of a poster whose
  // text would read the wrong service. Drop in real covers to light them up.
  { slug: "talking-head", name: "Talking Head", description: "Crisp talking-head edits for creators, founders and brands - tight pacing, clean captions and retention built in.", seed: 12, image: "" },
  { slug: "2d-animation", name: "2D Animation", description: "Custom 2D animation and illustrated explainers that turn complex ideas into simple, scroll-stopping stories.", seed: 33, image: "" },
  { slug: "real-estate", name: "Real Estate", description: "Cinematic property tours and walkthroughs that sell every space before the first visit.", seed: 44, image: "/categories/luxury.webp?v=2" },
  { slug: "commercials", name: "Commercials", description: "Punchy, high-converting ads and brand films crafted to stop the scroll and drive action.", seed: 21, image: "/categories/commercial.webp?v=2" },
  { slug: "gaming", name: "Gaming", description: "High-energy gaming edits - montages, highlights and stream moments that hit hard.", seed: 3, image: "/categories/gaming.webp?v=2" },
];

/* Translate between a ?category= slug and its display name. */
export const categorySlugToName = (slug?: string | null): string | null =>
  editingCategories.find((c) => c.slug === slug)?.name ?? null;

export const categoryNameToSlug = (name: string): string | null =>
  editingCategories.find((c) => c.name === name)?.slug ?? null;

/* Filter chips on Our Work: "All Work" + every category. */
export const workFilters: string[] = [
  "All Work",
  ...editingCategories.map((c) => c.name),
];

/* Editing styles — compact list (home) */
export const stylesShort = [
  { name: "Cinematic", icon: "film" },
  { name: "Clean & Minimal", icon: "feather" },
  { name: "High Energy", icon: "zap" },
  { name: "Moody & Dark", icon: "moon" },
  { name: "Smooth & Elegant", icon: "gem" },
  { name: "Colorful & Vibrant", icon: "palette" },
];

export const styleIncludes = [
  { icon: "zap", title: "Smooth Transitions", description: "Seamless cuts and transitions that keep your audience hooked." },
  { icon: "palette", title: "Color Grading", description: "Cinematic color correction that brings your story to life." },
  { icon: "type", title: "Motion Typography", description: "Clean, modern and animated text that adds impact." },
  { icon: "music", title: "Sound Design", description: "Perfect sync with music and sound effects." },
  { icon: "monitor", title: "Optimized Delivery", description: "High quality exports for every platform." },
];

/* Stats bands */
export const statsMain = [
  { value: "300+", label: "Projects Completed", icon: "clapperboard" },
  { value: "150+", label: "Happy Clients", icon: "smile" },
  { value: "500M+", label: "Views Generated", icon: "play" },
  { value: "25+", label: "Countries Served", icon: "globe" },
];

export const statsWork = [
  { value: "250+", label: "Projects Completed", icon: "clapperboard" },
  { value: "50+", label: "Happy Clients", icon: "star" },
  { value: "100M+", label: "Views Generated", icon: "play" },
  { value: "5+", label: "Years of Experience", icon: "clock" },
];

/* Testimonials (clients) */
export type Testimonial = {
  brand: string;
  project: string;
  quote: string;
  name: string;
  role: string;
  seed: number;
};

export const testimonials: Testimonial[] = [
  {
    brand: "boAt",
    project: "Airdopes 141",
    quote:
      "Loopsoop completely transformed our raw footage into a crisp, high-converting ad that performed beyond our expectations.",
    name: "Aman Gupta",
    role: "Co-Founder, boAt",
    seed: 3,
  },
  {
    brand: "Puma",
    project: "Campaign Film",
    quote:
      "Super professional team with insane attention to detail. They understood the vision and brought it to life.",
    name: "Sejal Shah",
    role: "Marketing Lead, PUMA India",
    seed: 27,
  },
  {
    brand: "Slice",
    project: "Brand Film",
    quote:
      "The edits were slick, modern and matched our brand perfectly. Loopsoop is now our go-to editing partner.",
    name: "Rajat Verma",
    role: "Growth Lead, Slice",
    seed: 72,
  },
];

/* About — mission values */
export const values = [
  { icon: "book-open", title: "Story First", description: "We focus on the story, craft the edit around emotion and keep the audience hooked." },
  { icon: "search-check", title: "Detail Obsessed", description: "From transitions to color grading, every detail is designed to perfection." },
  { icon: "trending-up", title: "Results Driven", description: "We don't just deliver edits, we deliver impact that drives real results." },
];

/* About / process */
export const processSteps = [
  { n: "01", icon: "message-circle", title: "Discover", description: "We understand your goals, vision and target audience." },
  { n: "02", icon: "folder", title: "Plan", description: "We plan the flow, style and structure for maximum impact." },
  { n: "03", icon: "scissors", title: "Edit", description: "Our editors bring the story to life with creativity." },
  { n: "04", icon: "wand-sparkles", title: "Refine", description: "We fine-tune every detail until it's perfect." },
  { n: "05", icon: "send", title: "Deliver", description: "On-time delivery, optimized and ready to perform." },
];

/* About / team */
export type Member = { name: string; role: string; seed: number };

export const team: Member[] = [
  { name: "Ritik Verma", role: "Founder & Creative Director", seed: 15 },
  { name: "Arnav Sharma", role: "Lead Editor", seed: 41 },
  { name: "Kunal Mehta", role: "Motion Graphics Artist", seed: 66 },
  { name: "Sejal Rao", role: "Color Grading Specialist", seed: 88 },
];

/* Contact — project types + FAQ */
export const projectTypes = [
  "Motion Graphics",
  "Talking Head Video",
  "2D Animation",
  "Real Estate Video",
  "Commercial / Ad",
  "Other",
];

export const faqs = [
  {
    q: "What types of videos do you make?",
    a: "We focus on motion graphics, talking-head edits, 2D animation, real-estate films and commercials - from a single reel to a full campaign.",
  },
  {
    q: "How long does a typical project take?",
    a: "Most projects are delivered within 3-7 days depending on length and complexity. Short-form edits often turn around in 48 hours.",
  },
  {
    q: "What do you need to get started?",
    a: "Your raw footage, any brand assets or references, and a short brief on the vision. We handle the rest from concept to final delivery.",
  },
  {
    q: "Do you offer revisions?",
    a: "Yes. Every project includes multiple revision rounds so the final edit matches your vision perfectly.",
  },
];
