import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "@/lib/enums";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("methodology", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function buildSections(locale: Locale, minGroupSize: number): { title: string; body: React.ReactNode }[] {
  if (locale === "hi") {
    return [
      {
        title: "यह क्या है",
        body: (
          <p>
            इंडिया इलेक्शन सर्वे एक स्वैच्छिक, ऑप्ट-इन ऑनलाइन जनमत सर्वे है जो इस मंच पर प्रकाशित प्रत्येक राज्य के
            लिए, विधानसभा क्षेत्र-दर-क्षेत्र, राज्य विधानसभा चुनावों को कवर करता है। कोई भी भाग ले सकता है; कोई
            नमूनाकरण फ्रेम, कोटा, या किसी राज्य के मतदाताओं का आनुपातिक प्रतिनिधित्व करने का प्रयास नहीं है। परिणाम{" "}
            <em>सर्वे उत्तरदाताओं</em> का वर्णन करते हैं, संपूर्ण मतदाताओं का नहीं।
          </p>
        ),
      },
      {
        title: "प्रतिक्रियाएं कैसे एकत्र की जाती हैं",
        body: (
          <p>
            प्रत्येक विधानसभा क्षेत्र में, किसी विशिष्ट चुनाव के भीतर, एक सक्रिय सर्वे होता है जिसमें उम्मीदवार
            पसंद, पार्टी पसंद, सबसे महत्वपूर्ण स्थानीय मुद्दा, और वैकल्पिक जनसांख्यिकी (आयु वर्ग, लिंग, सामाजिक
            श्रेणी, धर्म) पर प्रश्न होते हैं। हर वैकल्पिक प्रश्न छोड़ा जा सकता है। हम कभी भी नाम, फोन नंबर, ईमेल,
            वोटर ID, आधार, सटीक पता, GPS स्थान, या बूथ नंबर एकत्र नहीं करते।
          </p>
        ),
      },
      {
        title: "हेरफेर-रोधी उपाय",
        body: (
          <ul className="list-disc space-y-1 pl-5">
            <li>प्रतिक्रिया स्वीकार किए जाने से पहले हर प्रश्न और विकल्प का सर्वर-साइड सत्यापन।</li>
            <li>प्रति नेटवर्क और प्रति डिवाइस फिंगरप्रिंट दर सीमा।</li>
            <li>डुप्लिकेट पहचान — प्रति डिवाइस प्रति विधानसभा क्षेत्र सर्वे प्रति 24 घंटे में एक गिनी गई प्रतिक्रिया।</li>
            <li>बर्स्ट डिटेक्शन एक छोटी अवधि में एक ही नेटवर्क से असामान्य रूप से उच्च सबमिशन मात्रा को चिह्नित करता है।</li>
            <li>
              हर प्रतिक्रिया एक स्थिति के साथ संग्रहीत की जाती है: <code>VALID</code>, <code>FLAGGED</code>, या{" "}
              <code>REJECTED</code>। केवल <code>VALID</code> प्रतिक्रियाएं सार्वजनिक परिणामों में गिनी जाती हैं।
            </li>
          </ul>
        ),
      },
      {
        title: "छोटे-नमूने की सुरक्षा",
        body: (
          <p>
            कोई भी ब्रेकडाउन — एक विधानसभा क्षेत्र का कुल, या उसके भीतर एक जनसांख्यिकीय समूह — केवल तब प्रकाशित किया
            जाता है जब उसके पास कम से कम <strong>{minGroupSize}</strong> मान्य प्रतिक्रियाएं हों। इस सीमा से नीचे हम
            एक संख्या के बजाय &quot;अपर्याप्त प्रतिक्रियाएं&quot; दिखाते हैं, ताकि डेटा को सांख्यिकीय रूप से सार्थक
            रखा जा सके और छोटे या विस्तृत जनसांख्यिकीय हिस्सों से व्यक्तिगत उत्तरदाताओं की पहचान के किसी भी जोखिम से
            बचा जा सके।
          </p>
        ),
      },
      {
        title: "सर्वे परिणाम बनाम चुनाव परिणाम",
        body: (
          <p>
            सर्वे परिणामों को कभी भी चुनाव परिणाम के रूप में वर्णित नहीं किया जाता। जहां कोई विकल्प आगे है, हम कहते
            हैं कि यह <em>&quot;सर्वे उत्तरदाताओं के बीच फिलहाल आगे है&quot;</em> — कभी नहीं कि यह सीट
            &quot;जीतेगा&quot;। सर्वे की स्थिति के अनुसार रंग दिखाने वाले मानचित्र और कार्ड विज़ुअलाइज़ेशन हमेशा
            &quot;वर्तमान सर्वे लीडर&quot; लेबल किए जाते हैं, कभी &quot;विजेता&quot; या &quot;परिणाम&quot; नहीं।
          </p>
        ),
      },
      {
        title: "उम्मीदवार सूचियां",
        body: (
          <p>
            उम्मीदवारों को सूचीबद्ध करने के समय सार्वजनिक रूप से उपलब्ध, स्रोत-उद्धृत जानकारी के आधार पर घोषित,
            संभावित, संभावित दावेदार, वर्तमान विधायक, या ऐतिहासिक के रूप में लेबल किया जाता है। &quot;संभावित
            दावेदार&quot; लेबल आधिकारिक नामांकन का दावा नहीं है। उम्मीदवार तस्वीरें आधिकारिक पार्टी पेजों, उम्मीदवारों
            की अपनी सार्वजनिक प्रोफ़ाइलों, विकिमीडिया कॉमन्स, या प्रतिष्ठित समाचार कवरेज से प्राप्त की जाती हैं — स्रोत
            URL, स्रोत नाम और प्राप्ति तिथि के साथ दर्ज की जाती हैं — और प्रकाशन से पहले समीक्षा की जाती हैं। जहां
            कोई विश्वसनीय तस्वीर मौजूद नहीं है, हम किसी छवि को गढ़ने या अनुमान लगाने के बजाय एक इनिशियल्स अवतार
            दिखाते हैं।
          </p>
        ),
      },
      {
        title: "निष्पक्षता",
        body: (
          <p>
            यह मंच किसी भी पार्टी या उम्मीदवार को बढ़ावा या हमला नहीं करता। सर्वे और सूचियों में पार्टी और उम्मीदवार
            का क्रम एक निश्चित या वर्णानुक्रम में होता है, कभी लोकप्रियता या प्रदर्शन के अनुसार नहीं। हम प्रतिकूल
            परिणाम नहीं छिपाते, और हम उत्तरदाताओं, प्रतिशत, या उम्मीदवारों को गढ़ते नहीं हैं।
          </p>
        ),
      },
    ];
  }
  return [
    {
      title: "What this is",
      body: (
        <p>
          India Election Survey is a voluntary, opt-in online public-opinion survey covering state assembly
          elections, constituency by constituency, for each state published on this platform. Anyone can
          participate; there is no sampling frame, quota, or attempt to represent any state&apos;s electorate
          proportionally. Results describe <em>survey respondents</em>, not the electorate as a whole.
        </p>
      ),
    },
    {
      title: "How responses are collected",
      body: (
        <p>
          Each constituency, within a specific election, has one active survey with questions on candidate
          preference, party preference, the most important local issue, and optional demographics (age group,
          gender, social category, religion). Every optional question can be skipped. We never collect name, phone
          number, email, voter ID, Aadhaar, exact address, GPS location, or booth number.
        </p>
      ),
    },
    {
      title: "Anti-manipulation measures",
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li>Server-side validation of every question and option before a response is accepted.</li>
          <li>Rate limiting per network and per device fingerprint.</li>
          <li>Duplicate detection — one counted response per device per constituency survey per 24 hours.</li>
          <li>Burst detection flags unusually high submission volume from a single network in a short window.</li>
          <li>
            Every response is stored with a status: <code>VALID</code>, <code>FLAGGED</code>, or{" "}
            <code>REJECTED</code>. Only <code>VALID</code> responses are counted in public results.
          </li>
        </ul>
      ),
    },
    {
      title: "Small-sample protection",
      body: (
        <p>
          Any breakdown — a constituency total, or a demographic group within it — is only published once it has at
          least <strong>{minGroupSize}</strong> valid responses. Below that threshold we show &quot;insufficient
          responses&quot; rather than a number, both to keep the data statistically meaningful and to avoid any risk
          of identifying individual respondents from small or granular demographic slices.
        </p>
      ),
    },
    {
      title: "Survey result vs. election result",
      body: (
        <p>
          Survey results are never described as election outcomes. Where one option leads, we say it{" "}
          <em>&quot;currently leads among survey respondents&quot;</em> — never that it &quot;will win&quot; the
          seat. Map and card visualisations that shade by survey standing are always labelled &quot;Current Survey
          Leader&quot;, never &quot;Winner&quot; or &quot;Result&quot;.
        </p>
      ),
    },
    {
      title: "Candidate listings",
      body: (
        <p>
          Candidates are labelled Declared, Likely, Potential Contender, Incumbent, or Historical based on publicly
          available, source-cited information at the time of listing. A &quot;Potential Contender&quot; listing is
          not a claim of official nomination. Candidate photographs are sourced from official party pages,
          candidates&apos; own public profiles, Wikimedia Commons, or reputable news coverage — with the source URL,
          source name and retrieval date recorded — and reviewed before publication. Where no reliable photo exists,
          we show an initials avatar rather than fabricate or guess an image.
        </p>
      ),
    },
    {
      title: "Neutrality",
      body: (
        <p>
          This platform does not promote or attack any party or candidate. Party and candidate ordering in surveys
          and lists follows a fixed or alphabetical order, never popularity or performance. We do not hide
          unfavourable results, and we do not fabricate respondents, percentages, or candidates.
        </p>
      ),
    },
  ];
}

const HEADINGS: Record<Locale, { breadcrumbHelp: string; breadcrumbMethodology: string; eyebrow: string; heading: string }> = {
  hi: { breadcrumbHelp: "सहायता", breadcrumbMethodology: "पद्धति", eyebrow: "कानूनी और पद्धति", heading: "पद्धति" },
  en: { breadcrumbHelp: "Help", breadcrumbMethodology: "Methodology", eyebrow: "Legal & methodology", heading: "Methodology" },
};

export default async function MethodologyPage() {
  const locale = await getServerLocale();
  const h = HEADINGS[locale];
  const sections = buildSections(locale, MIN_ANALYTICS_GROUP_SIZE_DEFAULT);

  return (
    <Container className="max-w-3xl py-14 prose-headings:font-display">
      <Breadcrumb items={[{ label: h.breadcrumbHelp }, { label: h.breadcrumbMethodology }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{h.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{h.heading}</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        {sections.map((s, i) => (
          <Section key={i} title={s.title}>
            {s.body}
          </Section>
        ))}
      </div>
    </Container>
  );
}
