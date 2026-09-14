import "server-only";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import type { FaqCategory } from "./faq-data";

// Loads the PUBLISHED public FAQ content (Admin → FAQ manages the FaqItem
// table this reads from), grouped into the same FaqCategory[] shape
// src/lib/faq-data.ts's static array used to provide — so the public page
// and its FAQPage JSON-LD (built from this exact return value) never see an
// unpublished draft question. Takes an optional PrismaClient so tests can
// point it at an ephemeral test database instead of the real one.
export async function loadPublishedFaqCategories(client: PrismaClient = defaultPrisma): Promise<FaqCategory[]> {
  const items = await client.faqItem.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  });

  const byCategory = new Map<string, FaqCategory>();
  for (const item of items) {
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, { id: item.category, label: item.categoryLabel, items: [] });
    }
    byCategory.get(item.category)!.items.push({ q: item.question, a: item.answer });
  }
  return [...byCategory.values()];
}
