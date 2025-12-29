import type { SVGProps } from 'react'

export const EeIcon = (props: SVGProps<SVGSVGElement>) => (
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
    {/* EE Core - Classic transformer E-E laminated core shape */}
    <rect x="4" y="5" width="6" height="14" rx="0.5" />
    <rect x="14" y="5" width="6" height="14" rx="0.5" />
    <line x1="10" y1="8" x2="14" y2="8" strokeWidth="1.5" />
    <line x1="10" y1="12" x2="14" y2="12" strokeWidth="1.5" />
    <line x1="10" y1="16" x2="14" y2="16" strokeWidth="1.5" />
    <path d="M4 12h6M14 12h6" strokeWidth="1" opacity="0.5" />
  </svg>
)
