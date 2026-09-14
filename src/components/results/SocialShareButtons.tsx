"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { WhatsAppIcon, FacebookIcon, XIcon, InstagramIcon } from "@/components/ui/SocialIcons";

const ICON_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-ink/15 bg-white text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40";

// Real, functional per-platform sharing — not decorative icons. WhatsApp/X
// each open that platform's own share/intent URL with the same hook text
// (src/lib/share-message.ts); Facebook's sharer endpoint only ever accepts a
// URL (it reads its own preview from the page's OG metadata, so there is no
// "text" param to add). Instagram has no equivalent public web endpoint —
// rather than fabricate one, this falls back to the device's native share
// sheet (which can itself hand off to Instagram) or, failing that, copies
// the message so the user can paste it into a Story/DM themselves.
export function SocialShareButtons({ hook, url }: { hook: string; url: string }) {
  const { t } = useLocale();
  const [instagramCopied, setInstagramCopied] = useState(false);

  const fullMessage = `${hook}\n${url}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(hook)}`;

  async function handleInstagram() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: fullMessage, url });
        return;
      } catch {
        // user cancelled or the platform rejected it — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullMessage);
        setInstagramCopied(true);
        setTimeout(() => setInstagramCopied(false), 3000);
      } catch {
        // clipboard permission denied/unavailable — nothing more we can do
        // without fabricating an Instagram sharing endpoint that doesn't exist.
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.results.shareOnWhatsApp}
        title={t.results.shareOnWhatsApp}
        className={ICON_BUTTON_CLASS}
      >
        <WhatsAppIcon size={18} />
      </a>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.results.shareOnFacebook}
        title={t.results.shareOnFacebook}
        className={ICON_BUTTON_CLASS}
      >
        <FacebookIcon size={18} />
      </a>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.results.shareOnX}
        title={t.results.shareOnX}
        className={ICON_BUTTON_CLASS}
      >
        <XIcon size={18} />
      </a>
      <button
        type="button"
        onClick={handleInstagram}
        aria-label={t.results.shareOnInstagram}
        title={t.results.shareOnInstagram}
        className={ICON_BUTTON_CLASS}
      >
        <InstagramIcon size={18} />
      </button>
      {instagramCopied && <span className="text-xs font-medium text-positive">{t.results.shareInstagramCopied}</span>}
    </div>
  );
}
