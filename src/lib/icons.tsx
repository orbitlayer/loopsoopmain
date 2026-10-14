import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Clapperboard,
  Clock,
  Feather,
  Film,
  Folder,
  Gem,
  Globe,
  Heart,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Minus,
  Monitor,
  MonitorPlay,
  Moon,
  Music,
  Palette,
  Phone,
  Play,
  Plus,
  Quote,
  Scissors,
  SearchCheck,
  Send,
  Smartphone,
  Smile,
  Star,
  TrendingUp,
  Type,
  Upload,
  WandSparkles,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "book-open": BookOpen,
  briefcase: Briefcase,
  calendar: Calendar,
  check: Check,
  "chevron-down": ChevronDown,
  clapperboard: Clapperboard,
  clock: Clock,
  feather: Feather,
  film: Film,
  folder: Folder,
  gem: Gem,
  globe: Globe,
  heart: Heart,
  mail: Mail,
  "map-pin": MapPin,
  megaphone: Megaphone,
  menu: Menu,
  "message-circle": MessageCircle,
  minus: Minus,
  monitor: Monitor,
  "monitor-play": MonitorPlay,
  moon: Moon,
  music: Music,
  palette: Palette,
  phone: Phone,
  play: Play,
  plus: Plus,
  quote: Quote,
  scissors: Scissors,
  "search-check": SearchCheck,
  send: Send,
  smartphone: Smartphone,
  smile: Smile,
  star: Star,
  "trending-up": TrendingUp,
  type: Type,
  upload: Upload,
  "wand-sparkles": WandSparkles,
  x: X,
  zap: Zap,
};

export function Icon({
  name,
  className,
  strokeWidth = 1.5,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = iconMap[name];
  if (!Cmp) return null;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/* Discord isn't in lucide — small custom glyph */
export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.213.383-.463.9-.636 1.31a18.27 18.27 0 0 0-5.497 0A12.6 12.6 0 0 0 9.11 3a19.74 19.74 0 0 0-4.435 1.37C1.86 8.59 1.093 12.7 1.476 16.752a19.9 19.9 0 0 0 6.073 3.078c.49-.669.927-1.38 1.304-2.127-.716-.27-1.4-.603-2.046-.99.171-.126.34-.257.502-.392a14.2 14.2 0 0 0 12.18 0c.164.14.332.27.502.392-.647.388-1.332.72-2.048.99.377.747.814 1.458 1.304 2.127a19.86 19.86 0 0 0 6.075-3.078c.45-4.706-.766-8.78-3.209-12.383ZM8.02 14.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.334-.955 2.419-2.156 2.419Zm7.96 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.334-.946 2.419-2.156 2.419Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.56.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.418-.822.679-1.382.896-.422.164-1.057.36-2.227.413-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413a3.712 3.712 0 0 1-1.382-.896 3.712 3.712 0 0 1-.896-1.382c-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.413-2.227.217-.562.477-.96.896-1.382.42-.418.82-.679 1.382-.896.422-.164 1.057-.36 2.227-.413 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.775.13 4.904.333 4.14.63a5.883 5.883 0 0 0-2.126 1.384A5.883 5.883 0 0 0 .63 4.14C.333 4.904.131 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.261 2.148.558 2.912a5.883 5.883 0 0 0 1.384 2.126 5.868 5.868 0 0 0 2.126 1.384c.764.297 1.635.499 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.148-.261 2.912-.558a5.898 5.898 0 0 0 2.126-1.384 5.86 5.86 0 0 0 1.384-2.126c.297-.764.499-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.261-2.148-.558-2.912a5.89 5.89 0 0 0-1.384-2.126A5.847 5.847 0 0 0 19.86.63c-.764-.297-1.635-.5-2.912-.558C15.668.014 15.259 0 12 0m0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881" />
    </svg>
  );
}

export function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
