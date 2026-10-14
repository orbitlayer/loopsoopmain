import { whatsappUrl } from "@/lib/data";
import { WhatsappIcon } from "@/lib/icons";

/* Persistent WhatsApp launcher — WhatsApp is the primary contact channel,
   so it stays reachable from every page. `href` overrides the default link
   with a CMS-resolved one (falls back to the built-in number). */
export function WhatsAppFloat({ href }: { href?: string }) {
  return (
    <a
      href={href ?? whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LOOPSOOP on WhatsApp"
      className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lg shadow-black/25 transition-transform duration-300 hover:scale-110 focus-visible:scale-110 lg:bottom-5"
    >
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}
