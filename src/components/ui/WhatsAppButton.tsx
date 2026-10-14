import { whatsappUrl, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/data";
import { WhatsappIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";

type Variant = "primary" | "invert";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  invert: "bg-white text-ink hover:bg-white/90",
};

export function WhatsAppButton({
  message = WHATSAPP_DEFAULT_MESSAGE,
  label = "Chat on WhatsApp",
  variant = "primary",
  className,
  href,
}: {
  message?: string;
  label?: string;
  variant?: Variant;
  className?: string;
  href?: string;
}) {
  return (
    <a
      href={href ?? whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
    >
      <WhatsappIcon className="h-[18px] w-[18px]" />
      {label}
    </a>
  );
}
