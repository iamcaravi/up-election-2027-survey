import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("privacy", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

const COPY = {
  hi: {
    breadcrumbLegal: "कानूनी",
    breadcrumbPrivacy: "गोपनीयता नीति",
    heading: "गोपनीयता नीति",
    paragraphs: [
      "इस मंच पर सर्वे में भाग लेने के लिए किसी खाते की आवश्यकता नहीं है। हम आपका नाम, फोन नंबर, ईमेल पता, वोटर ID, आधार नंबर, सटीक पता, GPS स्थान, या मतदान केंद्र नहीं मांगते या संग्रहीत नहीं करते।",
      "प्रत्येक प्रतिक्रिया केवल इनसे जुड़ी होती है: जिस विधानसभा क्षेत्र सर्वे में यह सबमिट की गई, आपके उत्तर, आपके IP पते का एक साल्टेड वन-वे हैश, और आपके ब्राउज़र के लोकल स्टोरेज में संग्रहीत एक रैंडम डिवाइस पहचानकर्ता का साल्टेड वन-वे हैश। ये हैश केवल डुप्लिकेट या दुरुपयोगी सबमिशन का पता लगाने के लिए उपयोग किए जाते हैं और इन्हें उलटकर आपका IP पता या डिवाइस पहचानकर्ता प्राप्त नहीं किया जा सकता।",
      "जनसांख्यिकीय उत्तर (आयु वर्ग, लिंग, सामाजिक श्रेणी, धर्म) वैकल्पिक हैं, और हर फ़ील्ड को छोड़ा जा सकता है। इनका उपयोग केवल अनाम, समग्र विश्लेषण की गणना के लिए किया जाता है, और इन्हें कभी भी व्यक्तिगत-प्रतिक्रिया स्तर पर प्रकाशित या निर्यात नहीं किया जाता। न्यूनतम निर्धारित प्रतिक्रिया संख्या से कम वाले किसी भी समूह को सार्वजनिक प्रदर्शन से रोका जाता है।",
      "हम व्यक्तिगत राजनीतिक प्रोफ़ाइल नहीं बनाते, और हम प्रतिक्रिया डेटा को तीसरे पक्षों के साथ बेचते या साझा नहीं करते।",
    ],
  },
  en: {
    breadcrumbLegal: "Legal",
    breadcrumbPrivacy: "Privacy Policy",
    heading: "Privacy Policy",
    paragraphs: [
      "Taking a survey on this platform does not require an account. We do not ask for or store your name, phone number, email address, voter ID, Aadhaar number, exact address, GPS location, or polling booth.",
      "Each response is linked only to: the constituency survey it was submitted to, your answers, a salted one-way hash of your IP address, and a salted one-way hash of a random device identifier stored in your browser's local storage. These hashes are used solely to detect duplicate or abusive submissions and cannot be reversed to recover your IP address or device identifier.",
      "Demographic answers (age group, gender, social category, religion) are optional, and every field can be skipped. They are used only to compute anonymous, aggregate breakdowns, and are never published or exported at the individual-response level. Any group with fewer than the configured minimum number of responses is withheld from public display.",
      "We do not build individual political profiles, and we do not sell or share response data with third parties.",
    ],
  },
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: c.breadcrumbLegal }, { label: c.breadcrumbPrivacy }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.breadcrumbLegal}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{c.heading}</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        {c.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Container>
  );
}
