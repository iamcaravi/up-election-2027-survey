import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteBranding } from "@/lib/site-branding";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

const LAST_UPDATED = "14 September 2026";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("disclaimer", locale);
  return applySeoOverride(buildPageMetadata({ title: base.title, description: base.description, path: base.path }), base.path);
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-bold text-foreground">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function buildCopy(locale: Locale, contactEmail: string) {
  const regulatoryParagraph = {
    hi: (
      <p>
        यदि भारत निर्वाचन आयोग, संबंधित राज्य निर्वाचन आयोग, या कोई अन्य सक्षम सांविधिक प्राधिकरण इस वेबसाइट या
        इसकी सामग्री से संबंधित किसी लागू चुनाव कानून, विनियमन, निर्देश, सूचना, प्रतिबंध, या चिंता के बारे में
        VoterSurvey.in से संपर्क करता है, तो मंच ऐसे संचार के लिए एक उचित माध्यम प्रदान करेगा और लागू कानून और
        निर्देशों के अनुसार मामले को संबोधित करने में सहयोग करेगा। नियामक संचार{" "}
        <a href={`mailto:${contactEmail}`} className="font-semibold text-accent hover:underline">
          {contactEmail}
        </a>{" "}
        पर भेजे जा सकते हैं।
      </p>
    ),
    en: (
      <p>
        If the Election Commission of India, the concerned State Election Commission, or another competent
        statutory authority communicates with VoterSurvey.in regarding any applicable election law, regulation,
        direction, notice, restriction, or concern relating to this website or its content, the platform will
        provide a reasonable channel for such communication and will cooperate in addressing the matter in
        accordance with applicable law and directions. Regulatory communications may be sent to{" "}
        <a href={`mailto:${contactEmail}`} className="font-semibold text-accent hover:underline">
          {contactEmail}
        </a>
        .
      </p>
    ),
  }[locale];

  const copy: Record<
    Locale,
    {
      breadcrumbLegal: string;
      breadcrumbDisclaimer: string;
      heading: string;
      effective: string;
      sections: { title: string; body: React.ReactNode }[];
      footerBefore: string;
      footerLink: string;
    }
  > = {
    hi: {
      breadcrumbLegal: "कानूनी",
      breadcrumbDisclaimer: "अस्वीकरण",
      heading: "अस्वीकरण",
      effective: `प्रभावी / अंतिम अपडेट: ${LAST_UPDATED}`,
      sections: [
        {
          title: "इस मंच की प्रकृति",
          body: (
            <p>
              VoterSurvey.in एक स्वतंत्र, स्वैच्छिक राय/सर्वे मंच है। यह केवल सूचनात्मक और सांख्यिकीय उद्देश्यों के
              लिए सार्वजनिक-राय सर्वे प्रतिक्रियाएं एकत्र करता है।
            </p>
          ),
        },
        {
          title: "भारत निर्वाचन आयोग नहीं",
          body: (
            <p>
              VoterSurvey.in <strong>भारत निर्वाचन आयोग (ECI)</strong> नहीं है और जब तक स्पष्ट रूप से न कहा जाए,{" "}
              <strong>भारत निर्वाचन आयोग या किसी राज्य निर्वाचन आयोग से संबद्ध, संचालित, अनुमोदित, या आधिकारिक रूप से जुड़ा नहीं है</strong>।
              VoterSurvey.in किसी भी राजनीतिक दल या उम्मीदवार से भी संबद्ध नहीं है।
            </p>
          ),
        },
        {
          title: "सर्वे परिणाम चुनाव परिणाम नहीं हैं",
          body: (
            <>
              <p>
                इस मंच पर दिखाए गए सर्वे परिणाम <strong>आधिकारिक चुनाव परिणाम नहीं हैं</strong> और अंतिम चुनाव
                परिणाम की कोई गारंटी, भविष्यवाणी, या प्रतिनिधित्व नहीं हैं। परिणाम केवल इस मंच के माध्यम से प्राप्त
                प्रतिक्रियाओं पर आधारित हैं।
              </p>
              <p>
                डेटा नमूनाकरण सीमाओं, प्रतिक्रिया पूर्वाग्रह, अपूर्ण भागीदारी, और अन्य सांख्यिकीय सीमाओं के अधीन हो
                सकता है। पार्टी समर्थन और मुद्दा प्रतिशत को <strong>सर्वे प्रतिक्रियाओं</strong> के रूप में समझा जाना
                चाहिए, वास्तव में डाले गए वोटों के रूप में नहीं। उपयोगकर्ताओं को इस मंच को आधिकारिक चुनाव सूचना स्रोत
                नहीं मानना चाहिए — आधिकारिक जानकारी कहां मिलेगी, इसके लिए नीचे §6 देखें।
              </p>
            </>
          ),
        },
        { title: "नियामक सहयोग", body: regulatoryParagraph },
        {
          title: "चुनाव-अवधि प्रतिबंध",
          body: (
            <p>
              विशिष्ट चुनाव, अधिकार क्षेत्र, और समय के आधार पर चुनाव-अवधि प्रतिबंध — जिनमें राय सर्वेक्षण, एग्जिट
              पोल, और चुनाव-संबंधी सामग्री के प्रकाशन से संबंधित लागू प्रतिबंध शामिल हैं — लागू हो सकते हैं।
              प्रासंगिक होने पर उपयोगकर्ताओं को आधिकारिक निर्देशों और लागू कानून का संदर्भ लेना चाहिए। ऐसे प्रतिबंधों
              की अवधि के दौरान, इस मंच पर नए परिणामों का प्रकाशन रोका या समायोजित किया जा सकता है।
            </p>
          ),
        },
        {
          title: "आधिकारिक जानकारी कहां मिलेगी",
          body: (
            <p>
              आधिकारिक चुनाव जानकारी, कार्यक्रम, और परिणामों के लिए कृपया भारत निर्वाचन आयोग (
              <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
                eci.gov.in
              </a>
              ) और संबंधित राज्य निर्वाचन आयोग के आधिकारिक चैनलों का संदर्भ लें।
            </p>
          ),
        },
        {
          title: "उम्मीदवार जानकारी",
          body: (
            <p>
              उम्मीदवार स्थिति लेबल (घोषित, संभावित, संभावित दावेदार, वर्तमान विधायक, ऐतिहासिक) सूचीबद्ध करने के समय
              सार्वजनिक रूप से उपलब्ध जानकारी को दर्शाते हैं और बदल सकते हैं। ये किसी भी पार्टी या भारत निर्वाचन आयोग
              द्वारा आधिकारिक नामांकन का बयान नहीं हैं।
            </p>
          ),
        },
        {
          title: "कोई कानूनी अनुमोदन या प्राधिकरण का दावा नहीं",
          body: (
            <p>
              VoterSurvey.in भारत निर्वाचन आयोग या किसी राज्य निर्वाचन आयोग द्वारा कानूनी रूप से
              &quot;स्वीकृत&quot;, &quot;प्रमाणित&quot;, &quot;पंजीकृत&quot;, या &quot;अधिकृत&quot; होने का दावा नहीं
              करता।
            </p>
          ),
        },
      ],
      footerBefore: "इस अस्वीकरण के बारे में प्रश्न ",
      footerLink: "हमसे संपर्क करें",
    },
    en: {
      breadcrumbLegal: "Legal",
      breadcrumbDisclaimer: "Disclaimer",
      heading: "Disclaimer",
      effective: `Effective / last updated: ${LAST_UPDATED}`,
      sections: [
        {
          title: "Nature of this platform",
          body: (
            <p>
              VoterSurvey.in is an independent, voluntary opinion/survey platform. It collects public-opinion survey
              responses for informational and statistical purposes only.
            </p>
          ),
        },
        {
          title: "Not the Election Commission of India",
          body: (
            <p>
              VoterSurvey.in is <strong>not</strong> the Election Commission of India (ECI) and is{" "}
              <strong>
                not affiliated with, operated by, endorsed by, or officially associated with the Election Commission
                of India or any State Election Commission
              </strong>{" "}
              unless explicitly stated otherwise. VoterSurvey.in is also not affiliated with any political party or
              candidate.
            </p>
          ),
        },
        {
          title: "Survey results are not election results",
          body: (
            <>
              <p>
                Survey results shown on this platform are <strong>not official election results</strong> and are not
                a guarantee, prediction, or representation of the final election outcome. Results are based solely
                on responses received through this platform.
              </p>
              <p>
                Data may be subject to sampling limitations, response bias, incomplete participation, and other
                statistical limitations. Party support and issue percentages should be interpreted as{" "}
                <strong>survey responses</strong>, not votes actually cast. Users should not treat this platform as
                an official election information source — see §6 below for where to find official information.
              </p>
            </>
          ),
        },
        { title: "Regulatory cooperation", body: regulatoryParagraph },
        {
          title: "Election-period restrictions",
          body: (
            <p>
              Election-period restrictions — including applicable restrictions concerning opinion polls, exit polls,
              and the publication of election-related material — may apply depending on the specific election,
              jurisdiction, and timing. Users should refer to official instructions and applicable law where
              relevant. During any period where such restrictions apply, publication of new results on this platform
              may be paused or adjusted accordingly.
            </p>
          ),
        },
        {
          title: "Where to find official information",
          body: (
            <p>
              For official election information, schedules, and results, please refer to the Election Commission of
              India (
              <a href="https://eci.gov.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
                eci.gov.in
              </a>
              ) and the relevant State Election Commission&apos;s official channels.
            </p>
          ),
        },
        {
          title: "Candidate information",
          body: (
            <p>
              Candidate status labels (Declared, Likely, Potential Contender, Incumbent, Historical) reflect
              publicly available information at the time of listing and can change. They are not a statement of
              official nomination by any party or the Election Commission.
            </p>
          ),
        },
        {
          title: "No legal endorsement or authorization claimed",
          body: (
            <p>
              VoterSurvey.in does not claim to be legally &quot;approved&quot;, &quot;certified&quot;,
              &quot;registered&quot;, or &quot;authorized&quot; by the Election Commission of India or any State
              Election Commission.
            </p>
          ),
        },
      ],
      footerBefore: "Questions about this disclaimer can be sent to ",
      footerLink: "Contact Us",
    },
  };

  return copy[locale];
}

export default async function DisclaimerPage() {
  const [locale, { contactEmail }] = await Promise.all([getServerLocale(), getSiteBranding()]);
  const c = buildCopy(locale, contactEmail);

  return (
    <Container className="max-w-3xl py-14">
      <Breadcrumb items={[{ label: c.breadcrumbLegal }, { label: c.breadcrumbDisclaimer }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.breadcrumbLegal}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{c.heading}</h1>
      <p className="mt-2 text-xs text-muted">{c.effective}</p>

      <div className="mt-8 space-y-8">
        {c.sections.map((s, i) => (
          <Section key={i} n={i + 1} title={s.title}>
            {s.body}
          </Section>
        ))}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted">
        {c.footerBefore}
        <Link href="/contact" className="font-semibold text-accent hover:underline">
          {c.footerLink}
        </Link>
        .
      </p>
    </Container>
  );
}
