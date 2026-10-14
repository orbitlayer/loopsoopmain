import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "invert" | "outline" | "outline-dark";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  invert: "bg-white text-ink hover:bg-white/90",
  outline: "border border-ink/15 text-ink hover:bg-ink hover:text-white",
  "outline-dark":
    "border border-white/20 text-white hover:bg-white hover:text-ink",
};

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: Variant;
  arrow?: boolean;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function Button({
  children,
  href,
  variant = "primary",
  arrow = true,
  className,
  type = "button",
  onClick,
  disabled,
  ariaLabel,
}: ButtonProps) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium",
    "transition-colors duration-300 disabled:opacity-60 disabled:pointer-events-none",
    variants[variant],
    className,
  );

  const inner = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          strokeWidth={2}
          aria-hidden
        />
      )}
    </>
  );

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          aria-label={ariaLabel}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}

/* Underlined text link with a sliding arrow (e.g. "Explore Our Work →") */
export function ArrowLink({
  children,
  href,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  href: string;
  onDark?: boolean;
  className?: string;
}) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const content = (
    <span
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium",
        onDark ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="relative">
        {children}
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-px w-full origin-left scale-x-100 transition-transform duration-300 group-hover:scale-x-0",
            onDark ? "bg-white" : "bg-ink",
          )}
        />
      </span>
      <ArrowRight
        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
        strokeWidth={2}
        aria-hidden
      />
    </span>
  );

  if (external) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {content}
      </a>
    );
  }
  return <Link href={href}>{content}</Link>;
}
