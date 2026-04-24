import type { SVGProps } from "react";

export function MoonLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="moonGrad" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="hsl(280 70% 92%)" />
          <stop offset="60%" stopColor="hsl(280 60% 78%)" />
          <stop offset="100%" stopColor="hsl(260 50% 60%)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#moonGrad)" />
      <circle cx="40" cy="28" r="20" fill="hsl(222 47% 11%)" />
      <circle cx="50" cy="14" r="1.2" fill="hsl(280 70% 92%)" />
      <circle cx="14" cy="50" r="1.6" fill="hsl(280 70% 92%)" />
      <circle cx="56" cy="40" r="1" fill="hsl(280 70% 92%)" />
    </svg>
  );
}