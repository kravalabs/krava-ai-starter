import type { SVGProps } from "react";

// Replace this SVG with your own logo, or use any Lucide icon instead.
export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="appLogoGrad" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.9)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#appLogoGrad)" />
      <circle cx="32" cy="24" r="8" fill="hsl(var(--background) / 0.9)" />
      <path d="M18 44c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="hsl(var(--background) / 0.9)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
