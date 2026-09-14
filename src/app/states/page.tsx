import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { StatesGrid } from "@/components/states/StatesGrid";
import { StatesLandingBreadcrumb } from "@/components/states/StatesLandingBreadcrumb";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? { title: "राज्य", description: "इंडिया इलेक्शन सर्वे प्लेटफ़ॉर्म पर हर राज्य को देखें।" }
    : { title: "States", description: "Browse every state on the India Election Survey platform." };
}

export const revalidate = 60;

export default async function StatesPage() {
  const states = await getStates();

  return (
    <Container className="py-14">
      <StatesLandingBreadcrumb />
      <StatesGrid states={states} />
    </Container>
  );
}
