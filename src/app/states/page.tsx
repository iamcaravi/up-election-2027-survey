import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { StatesGrid } from "@/components/states/StatesGrid";
import { StatesLandingBreadcrumb } from "@/components/states/StatesLandingBreadcrumb";

export const metadata: Metadata = {
  title: "States",
  description: "Browse every state on the India Election Survey platform.",
};

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
