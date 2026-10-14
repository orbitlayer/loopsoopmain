"use client";

/*
 * BlurText — an original recreation of reactbits.dev's "Blur Text".
 * Same mechanics and contract as SplitText, but defaults to animating whole
 * words in from a soft blur (by="words", blur=true, y=12). Implemented on top
 * of SplitText so SSR-visible text, aria handling and reduced-motion behaviour
 * are shared. Every prop can still be overridden.
 */

import { SplitText, type SplitTextProps } from "./SplitText";

export type BlurTextProps = SplitTextProps;

export function BlurText({
  by = "words",
  blur = true,
  y = 12,
  ...rest
}: BlurTextProps) {
  return <SplitText by={by} blur={blur} y={y} {...rest} />;
}
