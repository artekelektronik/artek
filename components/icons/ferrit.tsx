import type { SVGProps } from 'react'

export const FerritIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Ferrite Core - Toroidal/ring core shape */}
    <ellipse cx="12" cy="12" rx="8" ry="8" />
    <ellipse cx="12" cy="12" rx="4" ry="4" fill="currentColor" opacity="0.15" />
    <path d="M4 12h4M16 12h4" strokeWidth="1.5" />
    <path d="M12 4v4M12 16v4" strokeWidth="1.5" />
  </svg>
)
