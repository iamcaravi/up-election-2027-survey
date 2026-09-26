import "server-only";

import upCurrentMlasData from "../../data/up/current-mlas.json";
import { prisma } from "./prisma";

export interface CurrentMlaInfo {
  name: string | null;
  nameHindi: string | null;
  party: string | null;
  partyHindi: string | null;
  partyShortName: string | null;
  constituencyName: string;
  constituencyNumber?: number;
  photoUrl: string | null;
  isVerified: boolean;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

interface RawRepoMlaRecord {
  name: string;
  nameHindi?: string | null;
  constituencyNumber: number;
  constituencyName: string;
  stateSlug: string;
  partyShortName: string;
  status: string;
  sourceName: string;
  sourceUrl: string;
  verified?: boolean;
  photoUrl?: string | null;
}

let cachedUpMlas: Map<number, RawRepoMlaRecord> | null = null;
const cachedPartyByShortName = new Map<string, any>();

function getUpRepoMlas(): Map<number, RawRepoMlaRecord> {
  if (cachedUpMlas) return cachedUpMlas;
  const map = new Map<number, RawRepoMlaRecord>();
  try {
    const records = upCurrentMlasData as unknown as RawRepoMlaRecord[];
    for (const record of records) {
      if (record.verified && record.constituencyNumber) {
        map.set(record.constituencyNumber, record);
      }
    }
  } catch (error) {
    console.error("Failed to load bundled data/up/current-mlas.json:", error);
  }
  cachedUpMlas = map;
  return map;
}

export async function getCurrentMlaForConstituency(
  constituencyIdOrObject:
    | string
    | {
        id: string;
        number: number;
        name: string;
        slug: string;
        stateId?: string;
        state?: { slug: string; name: string };
        currentMlaName?: string | null;
        currentMlaParty?: string | null;
      },
  electionId?: string
): Promise<CurrentMlaInfo | null> {
  let constituency: {
    id: string;
    number: number;
    name: string;
    slug: string;
    state: { slug: string; name: string };
    currentMlaName?: string | null;
    currentMlaParty?: string | null;
  } | null = null;

  if (typeof constituencyIdOrObject === "string") {
    const found = await prisma.constituency.findUnique({
      where: { id: constituencyIdOrObject },
      include: { state: { select: { slug: true, name: true } } },
    });
    if (!found) return null;
    constituency = found;
  } else {
    if (constituencyIdOrObject.state) {
      constituency = {
        id: constituencyIdOrObject.id,
        number: constituencyIdOrObject.number,
        name: constituencyIdOrObject.name,
        slug: constituencyIdOrObject.slug,
        state: constituencyIdOrObject.state,
        currentMlaName: constituencyIdOrObject.currentMlaName,
        currentMlaParty: constituencyIdOrObject.currentMlaParty,
      };
    } else {
      const found = await prisma.constituency.findUnique({
        where: { id: constituencyIdOrObject.id },
        include: { state: { select: { slug: true, name: true } } },
      });
      if (!found) return null;
      constituency = found;
    }
  }

  // 1. Check database Candidate table for verified sitting MLA (status: "INCUMBENT")
  const dbCandidate = await prisma.candidate.findFirst({
    where: {
      constituencyId: constituency.id,
      status: "INCUMBENT",
      isActive: true,
      electionId: electionId ? electionId : undefined,
    },
    include: {
      party: true,
    },
    orderBy: { verified: "desc" },
  });

  if (dbCandidate && dbCandidate.verified) {
    return {
      name: dbCandidate.name,
      nameHindi: dbCandidate.nameHindi,
      party: dbCandidate.party?.nameEnglish ?? dbCandidate.party?.shortName ?? null,
      partyHindi: dbCandidate.party?.nameHindi ?? null,
      partyShortName: dbCandidate.party?.shortName ?? null,
      constituencyName: constituency.name,
      constituencyNumber: constituency.number,
      photoUrl: dbCandidate.photoVerified && dbCandidate.photoUrl ? dbCandidate.photoUrl : null,
      isVerified: true,
      sourceName: dbCandidate.sourceNotes ?? null,
      sourceUrl: dbCandidate.sourceUrls ? JSON.parse(dbCandidate.sourceUrls)[0] ?? null : null,
    };
  }

  // 2. Check repository verified dataset (data/up/current-mlas.json)
  if (constituency.state.slug === "uttar-pradesh") {
    const upMlas = getUpRepoMlas();
    const repoMla = upMlas.get(constituency.number);
    if (repoMla && repoMla.verified) {
      // Resolve party details if possible from database (cached in memory)
      let party = cachedPartyByShortName.get(repoMla.partyShortName);
      if (party === undefined) {
        party = await prisma.party.findFirst({
          where: { shortName: repoMla.partyShortName },
        });
        cachedPartyByShortName.set(repoMla.partyShortName, party);
      }

      return {
        name: repoMla.name,
        nameHindi: repoMla.nameHindi ?? null,
        party: party?.nameEnglish ?? repoMla.partyShortName,
        partyHindi: party?.nameHindi ?? null,
        partyShortName: repoMla.partyShortName,
        constituencyName: constituency.name,
        constituencyNumber: constituency.number,
        photoUrl: repoMla.photoUrl ?? null,
        isVerified: true,
        sourceName: repoMla.sourceName,
        sourceUrl: repoMla.sourceUrl,
      };
    }
  }

  // 3. Check Constituency fields (currentMlaName / currentMlaParty)
  if (constituency.currentMlaName?.trim()) {
    return {
      name: constituency.currentMlaName.trim(),
      nameHindi: null,
      party: constituency.currentMlaParty?.trim() ?? null,
      partyHindi: null,
      partyShortName: constituency.currentMlaParty?.trim() ?? null,
      constituencyName: constituency.name,
      constituencyNumber: constituency.number,
      photoUrl: null,
      isVerified: true,
    };
  }

  // 4. Record unavailable / unverified
  return {
    name: null,
    nameHindi: null,
    party: null,
    partyHindi: null,
    partyShortName: null,
    constituencyName: constituency.name,
    constituencyNumber: constituency.number,
    photoUrl: null,
    isVerified: false,
  };
}
