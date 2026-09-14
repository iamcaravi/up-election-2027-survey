import "server-only";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./prisma";
import type { FaqCategory } from "./faq-data";
import type { Locale } from "./i18n/LocaleProvider";

// Loads the PUBLISHED public FAQ content (Admin → FAQ manages the FaqItem
// table this reads from), grouped into the same FaqCategory[] shape
// src/lib/faq-data.ts's static array used to provide — so the public page
// and its FAQPage JSON-LD (built from this exact return value) never see an
// unpublished draft question. Takes an optional PrismaClient so tests can
// point it at an ephemeral test database instead of the real one.
//
// FaqItem's primary category/question/answer fields are English (the CMS
// was originally seeded from src/lib/faq-data.ts's English array), with
// optional *Hi counterparts an admin can fill in per item — see
// prisma/schema.prisma's FaqItem doc comment. For locale=hi this prefers
// the Hindi field and falls back to the English primary field whenever an
// item hasn't been translated yet (same fallback rule used everywhere else
// in the i18n system: never show raw translation keys, never show both
// languages at once — one language wins per item, English until an admin
// fills in its Hindi counterpart).
export async function loadPublishedFaqCategories(client: PrismaClient = defaultPrisma, locale: Locale = "en"): Promise<FaqCategory[]> {
  const items = await client.faqItem.findMany({
    where: { published: true },
    orderBy: [{ category: "asc" }, { displayOrder: "asc" }],
  });

  const byCategory = new Map<string, FaqCategory>();
  for (const item of items) {
    const categoryLabel = locale === "hi" && item.categoryLabelHi ? item.categoryLabelHi : item.categoryLabel;
    if (!byCategory.has(item.category)) {
      byCategory.set(item.category, { id: item.category, label: categoryLabel, items: [] });
    }
    const q = locale === "hi" && item.questionHi ? item.questionHi : item.question;
    const a = locale === "hi" && item.answerHi ? item.answerHi : item.answer;
    byCategory.get(item.category)!.items.push({ q, a });
  }
  return [...byCategory.values()];
}
