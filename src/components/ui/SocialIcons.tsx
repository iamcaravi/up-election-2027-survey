// Minimal brand glyphs (not from an icon library — lucide-react intentionally
// ships no brand/trademark icons) — shared here so the footer's social links
// and the results page's share buttons draw the exact same X/Facebook/
// Instagram marks instead of two independent implementations drifting apart.

export function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3l-7.3 8.34L21.5 21h-6.4l-5-6.5-5.7 6.5H1.4l7.8-8.9L1 3h6.5l4.5 5.9L17.5 3Zm-2.2 16.2h1.8L8.8 4.7H6.9l8.4 14.5Z" />
    </svg>
  );
}

export function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 22v-8h2.7l.5-3.5H14V8.3c0-1 .3-1.7 1.8-1.7h1.5V3.4C16.8 3.3 15.6 3 14.3 3 11.5 3 9.6 4.7 9.6 7.9v2.6H7v3.5h2.6v8h4.4Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.6c-.2-1-1-1.8-2-2C17.9 5.2 12 5.2 12 5.2s-5.9 0-7.6.4c-1 .2-1.8 1-2 2C2 9.3 2 12 2 12s0 2.7.4 4.4c.2 1 1 1.8 2 2 1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4c1-.2 1.8-1 2-2 .4-1.7.4-4.4.4-4.4s0-2.7-.4-4.4ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z" />
    </svg>
  );
}

export function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.48 2.48 0 1 0 0 4.96 2.48 2.48 0 0 0 0-4.96ZM3 9.75h3.96V21H3V9.75ZM9.5 9.75h3.8v1.54h.05c.53-1 1.83-1.9 3.77-1.9 4.03 0 4.78 2.5 4.78 5.76V21h-3.96v-5.13c0-1.22-.02-2.8-1.7-2.8-1.7 0-1.97 1.34-1.97 2.71V21H9.5V9.75Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c-5.25 0-9.5 4.25-9.5 9.5 0 1.68.44 3.3 1.28 4.73L2.5 21.5l4.9-1.25a9.46 9.46 0 0 0 4.6 1.17h.01c5.24 0 9.5-4.24 9.5-9.5s-4.25-9.42-9.51-9.42Zm0 17.35a7.86 7.86 0 0 1-4.02-1.1l-.29-.17-2.9.74.78-2.83-.19-.29a7.8 7.8 0 0 1-1.21-4.19c0-4.34 3.53-7.86 7.87-7.86 2.1 0 4.07.82 5.56 2.3a7.8 7.8 0 0 1 2.3 5.57c0 4.34-3.55 7.83-7.9 7.83Zm4.32-5.87c-.24-.12-1.4-.7-1.62-.77-.22-.08-.37-.12-.53.12-.16.24-.6.77-.74.93-.13.16-.27.18-.5.06-.24-.12-1-.37-1.9-1.18-.7-.62-1.18-1.4-1.31-1.64-.14-.24-.02-.37.1-.5.11-.1.24-.27.36-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.29-.73-1.76-.19-.46-.38-.4-.53-.4h-.45c-.16 0-.4.06-.62.3-.21.24-.81.8-.81 1.94 0 1.14.83 2.24.95 2.4.12.16 1.63 2.5 3.96 3.5.55.24.98.38 1.32.49.55.18 1.06.15 1.46.09.45-.07 1.4-.57 1.6-1.13.2-.55.2-1.02.14-1.13-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}
