"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Single manually-designed artwork for both lower homepage cards ("हमारा
// उद्देश्य" + "एक जिम्मेदार पहल") — headings, paragraphs and list items are
// baked into the image. The image intentionally does NOT include the
// "हमारे बारे में जानें" CTA; that is added below as a real, clickable,
// keyboard-accessible <a>, positioned with percentage insets (measured
// against the source image's own pixel coordinates) so it lines up under
// the "हमारा उद्देश्य" paragraph at any render size. `unoptimized` serves
// the original PNG bytes as-is (no Next.js re-encode/downscale) to keep the
// baked-in Hindi text crisp.
export function LowerCardsSection({
  mobileImageUrl = "/images/homepage/about-mobile.png",
  tabletImageUrl = null,
  /** Admin-editor-only: forces exactly one device's branch to render,
   * deterministically, regardless of the real browser viewport width — see
   * Hero.tsx's editorShows* variables for the identical reasoning (a preview
   * canvas can be narrower than the browser window, so real CSS breakpoints
   * can't be relied on there). Left undefined on the public site, where the
   * CSS-driven classNames below decide instead. */
  previewDevice,
}: {
  mobileImageUrl?: string;
  tabletImageUrl?: string | null;
  previewDevice?: "mobile" | "tablet" | "desktop";
} = {}) {
  const { t } = useLocale();
  const altText =
    "हमारा उद्देश्य — देश के लोकतंत्र को और अधिक मजबूत बनाने के लिए जनता की राय को एक विश्वसनीय और पारदर्शी मंच प्रदान करना। एक जिम्मेदार पहल — आपकी गोपनीयता हमारी प्राथमिकता, डेटा सुरक्षा और पारदर्शिता, किसी भी राजनीतिक दल से स्वतंत्र, तथ्यों और आंकड़ों पर आधारित।";
  const showsDesktop = previewDevice ? previewDevice === "desktop" || (previewDevice === "tablet" && !tabletImageUrl) : null;
  const showsTabletPoster = previewDevice ? previewDevice === "tablet" && !!tabletImageUrl : null;
  const showsMobilePoster = previewDevice ? previewDevice === "mobile" : null;
  return (
    <div>
      {/* Desktop (and tablet, unless a dedicated tablet image is set below): existing
          manually-composed image, unchanged. */}
      <div
        className={
          previewDevice
            ? showsDesktop
              ? "relative w-full overflow-hidden rounded-3xl"
              : "hidden"
            : tabletImageUrl
              ? "relative hidden w-full overflow-hidden rounded-3xl lg:block"
              : "relative hidden w-full overflow-hidden rounded-3xl sm:block"
        }
        style={{ aspectRatio: "2157 / 497", containerType: "inline-size" }}
      >
        <Image src="/images/homepage/home-lower-cards-final.png" alt={altText} fill unoptimized className="object-contain" />
        <Link
          href="/about"
          className="absolute flex items-center justify-start font-semibold text-orange-600 transition-opacity hover:opacity-70 dark:text-orange-400"
          style={{
            left: "3.66%",
            top: "66.4%",
            width: "13%",
            height: "9%",
            fontSize: "clamp(9px, 1.25cqw, 18px)",
          }}
        >
          {t.lowerCards.aboutCta}&nbsp;→
        </Link>
      </div>

      {/* Mobile only (<640px): pre-composited poster. The CTA text isn't baked into
          this image (unlike the desktop composition), so it's added below as a normal
          visible link rather than a precisely-positioned invisible overlay. */}
      {(previewDevice ? showsMobilePoster : true) && (
        <div className={previewDevice ? "" : "block sm:hidden"}>
          <div className="relative w-full overflow-hidden rounded-3xl" style={{ aspectRatio: "1024 / 1536" }}>
            <Image src={mobileImageUrl} alt={altText} fill className="object-cover" />
          </div>
          <Link
            href="/about"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:gap-3 transition-all dark:text-orange-400"
          >
            {t.lowerCards.aboutCta} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Tablet only (640-1023px), only when the admin has set a dedicated tablet
          image — absent that, tablet uses the desktop composition above. */}
      {tabletImageUrl && (previewDevice ? showsTabletPoster : true) && (
        <div className={previewDevice ? "" : "hidden sm:block lg:hidden"}>
          <div className="relative w-full overflow-hidden rounded-3xl" style={{ aspectRatio: "1024 / 1536" }}>
            <Image src={tabletImageUrl} alt={altText} fill className="object-cover" />
          </div>
          <Link
            href="/about"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:gap-3 transition-all dark:text-orange-400"
          >
            {t.lowerCards.aboutCta} <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
