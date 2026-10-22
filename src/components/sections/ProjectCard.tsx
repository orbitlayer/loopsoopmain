"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import type { Project } from "@/lib/data";
import { cn } from "@/lib/cn";
import { videoThumbnail, videoEmbedUrl, isSelfHosted } from "@/lib/video";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export function ProjectCard({
  project,
  showArrow = false,
  orientation = "landscape",
  className,
}: {
  project: Project;
  showArrow?: boolean;
  orientation?: "landscape" | "portrait";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = videoEmbedUrl(project);
  const hasVideo = Boolean(embedUrl);
  const selfHosted = isSelfHosted(project.provider);
  const portrait = orientation === "portrait";
  const thumb = videoThumbnail(project);

  // Close on Escape + lock body scroll while the player is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const media = (
    <>
      <div
        className={cn(
          "relative overflow-hidden",
          portrait ? "aspect-[9/16]" : "aspect-video",
        )}
      >
        <MediaPlaceholder
          seed={project.seed}
          src={thumb}
          alt={
            project.title
              ? `${project.title}${hasVideo ? " - play video" : ""}`
              : undefined
          }
          vignette
          play={hasVideo}
          playSize={portrait ? "sm" : "md"}
          className="transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3",
          portrait ? "p-4" : "p-5",
        )}
      >
        <div>
          {project.title?.trim() && (
            <h3
              className={cn(
                "font-display font-medium leading-tight text-white",
                portrait ? "text-base" : "text-lg",
              )}
            >
              {project.title}
            </h3>
          )}
          <p
            className={cn(
              "mt-1 text-white/60",
              portrait ? "text-xs" : "text-sm",
            )}
          >
            {project.category}
          </p>
        </div>
        {showArrow && !hasVideo && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors duration-300 group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  return (
    <>
      <article
        className={cn(
          "group relative overflow-hidden rounded-[20px] border border-line/50 bg-dark",
          "transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]",
          className,
        )}
      >
        {hasVideo ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Play ${project.title}`}
            className="block w-full text-left"
          >
            {media}
          </button>
        ) : (
          media
        )}
      </article>

      <AnimatePresence>
        {open && hasVideo && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} - video`}
          >
            <motion.div
              className={cn(
                "relative w-full",
                portrait ? "max-w-[400px]" : "max-w-4xl",
              )}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close video"
                className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
              <div
                className={cn(
                  "overflow-hidden rounded-xl bg-black shadow-2xl",
                  portrait ? "aspect-[9/16]" : "aspect-video",
                )}
              >
                {selfHosted ? (
                  <video
                    src={embedUrl}
                    poster={thumb}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full bg-black"
                  />
                ) : (
                  <iframe
                    src={embedUrl}
                    title={project.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="h-full w-full"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
