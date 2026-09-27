import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { RajyaPageContent } from "@/components/states/RajyaPageContent";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? {
        title: "राज्य | VoterSurvey.in",
        description:
          "भारत के विभिन्न राज्यों में होने वाले विधानसभा चुनावों से जुड़ी जनता की राय, स्थानीय मुद्दों और विकास से जुड़े महत्वपूर्ण तथ्यों को जानें और सर्वे में भाग लें।",
      }
    : {
        title: "States | VoterSurvey.in",
        description:
          "Explore public opinions, local issues, and developmental facts for assembly elections across Indian states on VoterSurvey.in.",
      };
}

export const revalidate = 60;

export default async function StatesPage() {
  const states = await getStates();
  return <RajyaPageContent states={states} />;
}
