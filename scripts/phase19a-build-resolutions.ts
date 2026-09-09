import fs from "node:fs";
import path from "node:path";

type Confidence = "HIGH" | "MEDIUM" | "UNRESOLVED";
type Category = "DUPLICATE_SEAT" | "NAME_CONFLICT" | "NUMBER_0" | "PARTY_MISMATCH";

interface ReviewRow {
  memberId: string;
  name: string;
  constituencyNumberOnSource: number;
  constituencyNameOnSource: string;
  partyRaw: string;
  resolvedConstituency: string | null;
  status: string;
  reason: string;
}

interface Decision {
  constituencyNumber: number;
  constituencyName: string;
  category: Category;
  memberIds: string[];
  selectedMemberId?: string;
  partyShortName?: string;
  resolutionReason: string;
  profileFindings?: Record<string, string>;
  confidence?: Confidence;
}

const OFFICIAL_LISTING = "https://www.upvidhansabhaproceedings.gov.in/en/member-s-information";
const ECI_2022_REPORTS =
  "https://www.eci.gov.in/eci-backend/public/api/download?url=LMAhAK6sOPBp%2FNFF0iRfXbEB1EVSLT41NNLRjYNJJP1KivrUxbfqkDatmHy12e%2FzVx8fLfn2ReU7TfrqYobgItW4eTUyTFD%2BDUyB1G1fBKOuW00SdZqELiEOB05oPhRO74%2F4p%2BuSikD0u7%2BVrCmQyhaJANaxWi%2FXMLUEuMmRVRLJ2%2BdBIBswoUnKE3KB7EMq";
const profileUrl = (memberId: string) =>
  `https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=${memberId}`;

const decisions: Decision[] = [
  { constituencyNumber: 15, constituencyName: "Khatauli", category: "DUPLICATE_SEAT", memberIds: ["25623", "25607"], selectedMemberId: "25623", partyShortName: "RLD", resolutionReason: "Madan Bhaiya is the current member. His official profile says Bi Elected: Yes; Vikram Singh's official profile says Resigned: Yes.", profileFindings: { "25623": "Bi Elected: Yes", "25607": "Resigned: Yes" } },
  { constituencyNumber: 34, constituencyName: "Suar", category: "DUPLICATE_SEAT", memberIds: ["24924", "25546"], selectedMemberId: "24924", partyShortName: "Apna Dal", resolutionReason: "Shafiq Ahmad Ansari is the current member. Abdullah Azam Khan's official profile says Resigned: Yes and gives disqualification as the reason.", profileFindings: { "24924": "Active member profile for Suar", "25546": "Resigned: Yes; reason: Disqualified" } },
  { constituencyNumber: 36, constituencyName: "Bilaspur", category: "NAME_CONFLICT", memberIds: ["25648"], selectedMemberId: "25648", partyShortName: "BJP", resolutionReason: "The source listing attached Baldev Singh Aulakh's Bilaspur row to AC 38. His official profile identifies Bilaspur; the canonical/ECI mapping is AC 36 Bilaspur. This is a source-side number error, not a master-table error." },
  { constituencyNumber: 37, constituencyName: "Rampur", category: "DUPLICATE_SEAT", memberIds: ["25323", "25605"], selectedMemberId: "25323", partyShortName: "BJP", resolutionReason: "Akash Saxena is the current member. His official profile says Bi Elected: Yes; Mohammad Azam Khan's profile says Resigned: Yes and gives disqualification as the reason.", profileFindings: { "25323": "Bi Elected: Yes", "25605": "Resigned: Yes; reason: Disqualified" } },
  { constituencyNumber: 38, constituencyName: "Milak", category: "DUPLICATE_SEAT", memberIds: ["25242"], selectedMemberId: "25242", partyShortName: "BJP", resolutionReason: "Rajbala Singh's official profile identifies Milak. The apparent duplicate arose only because the Bilaspur source row was incorrectly numbered 38; canonical/ECI mapping places Bilaspur at 36 and Milak at 38." },
  { constituencyNumber: 47, constituencyName: "Meerut Cantt.", category: "NAME_CONFLICT", memberIds: ["25301"], selectedMemberId: "25301", partyShortName: "BJP", resolutionReason: "Amit Agrawal's official profile identifies Meerut Cantt. Canonical/ECI mapping places Meerut Cantt. at AC 47; the source listing's AC 48 is a source-side numbering error." },
  { constituencyNumber: 48, constituencyName: "Meerut", category: "NAME_CONFLICT", memberIds: ["25689"], selectedMemberId: "25689", partyShortName: "SP", resolutionReason: "Rafiq Ansari's official profile identifies Meerut. Canonical/ECI mapping places Meerut at AC 48; the source listing's AC 49 is a source-side numbering error." },
  { constituencyNumber: 49, constituencyName: "Meerut South", category: "NAME_CONFLICT", memberIds: ["25491"], selectedMemberId: "25491", partyShortName: "BJP", resolutionReason: "Somendra Singh Tomar's official profile identifies Meerut South. Canonical/ECI mapping places Meerut South at AC 49; the source listing's AC 47 is a source-side numbering error." },
  { constituencyNumber: 52, constituencyName: "Bagpat", category: "NAME_CONFLICT", memberIds: ["25813"], selectedMemberId: "25813", partyShortName: "BJP", resolutionReason: "The official profile identifies Yogesh Dhama with Baghpat. Baghpat/Bagpat is a transliteration/display-name difference; the canonical AC number 52 is unchanged." },
  { constituencyNumber: 56, constituencyName: "Ghaziabad", category: "DUPLICATE_SEAT", memberIds: ["25770", "25527"], selectedMemberId: "25770", partyShortName: "BJP", resolutionReason: "Sanjeev Sharma is the current member on the official profile. Atul Garg's official profile says Resigned: Yes (14 June 2024).", profileFindings: { "25770": "Active member profile for Ghaziabad", "25527": "Resigned: Yes; resignation date 14 June 2024" } },
  { constituencyNumber: 65, constituencyName: "Bulandshahr", category: "DUPLICATE_SEAT", memberIds: ["25589"], selectedMemberId: "25589", partyShortName: "BJP", resolutionReason: "Pradeep Kumar Chaudhary's official profile identifies Bulandshahr. The extra rows grouped under AC 65 are Dadraul members whose source numbers are wrong; they belong to AC 136." },
  { constituencyNumber: 66, constituencyName: "Syana", category: "NAME_CONFLICT", memberIds: ["25513"], selectedMemberId: "25513", partyShortName: "BJP", resolutionReason: "The official profile identifies Devendra Singh Lodhi with Siana. Siana/Syana is a spelling variation; the canonical AC number 66 is unchanged." },
  { constituencyNumber: 71, constituencyName: "Khair", category: "DUPLICATE_SEAT", memberIds: ["25785", "25914"], selectedMemberId: "25785", partyShortName: "BJP", resolutionReason: "Surendra Diler is the current member. Anoop Pradhan Valmiki's official profile says Resigned: Yes (14 June 2024).", profileFindings: { "25785": "Active member profile for Khair", "25914": "Resigned: Yes; resignation date 14 June 2024" } },
  { constituencyNumber: 75, constituencyName: "Koil", category: "NUMBER_0", memberIds: ["25295"], selectedMemberId: "25295", partyShortName: "BJP", resolutionReason: "Anil Parashar's official profile identifies Kol. The ECI/canonical constituency is AC 75 Koil; the source number 0 and Kol/Koil spelling are source-side data issues." },
  { constituencyNumber: 91, constituencyName: "Fatehpur Sikri", category: "NAME_CONFLICT", memberIds: ["25452"], selectedMemberId: "25452", partyShortName: "BJP", resolutionReason: "Babulal's official profile identifies Fatehpur Sikri. Canonical/ECI mapping places it at AC 91; the source listing's AC 240 is swapped with Fatehpur." },
  { constituencyNumber: 101, constituencyName: "Amanpur", category: "NAME_CONFLICT", memberIds: ["25515"], selectedMemberId: "25515", partyShortName: "BJP", resolutionReason: "The official profile identifies Hariom with Amapur. Amapur/Amanpur is a source spelling difference; the canonical AC number 101 is unchanged." },
  { constituencyNumber: 110, constituencyName: "Karhal", category: "DUPLICATE_SEAT", memberIds: ["25617", "25531"], selectedMemberId: "25617", partyShortName: "SP", resolutionReason: "Tej Pratap Singh is the current member. His official profile says Bi Elected: Yes; Akhilesh Yadav's profile says Resigned: Yes (13 June 2024).", profileFindings: { "25617": "Bi Elected: Yes", "25531": "Resigned: Yes; resignation date 13 June 2024" } },
  { constituencyNumber: 115, constituencyName: "Badaun", category: "NAME_CONFLICT", memberIds: ["25674"], selectedMemberId: "25674", partyShortName: "BJP", resolutionReason: "The official profile identifies Mahesh Chandra Gupta with Budaun. Budaun/Badaun is a transliteration difference; the canonical AC number 115 is unchanged." },
  { constituencyNumber: 131, constituencyName: "Katra", category: "NAME_CONFLICT", memberIds: ["25747"], selectedMemberId: "25747", partyShortName: "BJP", resolutionReason: "Veer Vikram Singh's official profile identifies Katra. Canonical/ECI mapping places Katra at AC 131; the source listing's AC 297 is swapped with Katra Bazar." },
  { constituencyNumber: 136, constituencyName: "Dadraul", category: "DUPLICATE_SEAT", memberIds: ["25615", "25562"], selectedMemberId: "25615", partyShortName: "BJP", resolutionReason: "Arvind Kumar Singh is the current Dadraul member. His official profile says Bi Elected: Yes; Manvendra Singh's profile says Dead: Yes. Both source rows were incorrectly numbered 65; canonical/ECI mapping places Dadraul at AC 136.", profileFindings: { "25615": "Bi Elected: Yes", "25562": "Dead: Yes" } },
  { constituencyNumber: 140, constituencyName: "Sri Nagar", category: "NAME_CONFLICT", memberIds: ["25656"], selectedMemberId: "25656", partyShortName: "BJP", resolutionReason: "The official profile identifies Manju Tyagi with Srinagar. Srinagar/Sri Nagar is a spacing difference; the canonical AC number 140 is unchanged." },
  { constituencyNumber: 144, constituencyName: "Mohammdi", category: "NAME_CONFLICT", memberIds: ["25730"], selectedMemberId: "25730", partyShortName: "BJP", resolutionReason: "The official profile identifies Lokendra Pratap Singh with Mohammadi. Mohammadi/Mohammdi is a spelling difference; the canonical AC number 144 is unchanged." },
  { constituencyNumber: 147, constituencyName: "Hargaon", category: "NAME_CONFLICT", memberIds: ["25791"], selectedMemberId: "25791", partyShortName: "BJP", resolutionReason: "The official profile identifies Suresh Rahi with Hargoan. Hargoan/Hargaon is a source spelling difference; the canonical AC number 147 is unchanged." },
  { constituencyNumber: 154, constituencyName: "Sawayazpur", category: "NAME_CONFLICT", memberIds: ["25677"], selectedMemberId: "25677", partyShortName: "BJP", resolutionReason: "The official profile identifies Madhavendra Pratap Singh with Sawaijpur. Sawaijpur/Sawayazpur is a transliteration difference; the canonical AC number 154 is unchanged." },
  { constituencyNumber: 166, constituencyName: "Bhagwantnagar", category: "NAME_CONFLICT", memberIds: ["25330"], selectedMemberId: "25330", partyShortName: "BJP", resolutionReason: "The official profile identifies Ashutosh Shukla with Bhagwant Nagar. This is a spacing difference; the canonical AC number 166 is unchanged." },
  { constituencyNumber: 167, constituencyName: "Purwa", category: "NUMBER_0", memberIds: ["25293"], selectedMemberId: "25293", partyShortName: "BJP", resolutionReason: "Anil Kumar Singh's official profile identifies Purwa; canonical/ECI mapping uniquely places Purwa at AC 167. The source number 0 is a source-side data error." },
  { constituencyNumber: 173, constituencyName: "Lucknow East", category: "DUPLICATE_SEAT", memberIds: ["25616", "25601"], selectedMemberId: "25616", partyShortName: "BJP", resolutionReason: "O.P. Srivastava is the current member. His official profile says Bi Elected: Yes; Ashutosh Tandon's profile says Dead: Yes.", profileFindings: { "25616": "Bi Elected: Yes", "25601": "Dead: Yes" } },
  { constituencyNumber: 227, constituencyName: "Mehroni", category: "NUMBER_0", memberIds: ["25666"], selectedMemberId: "25666", partyShortName: "BJP", resolutionReason: "Manohar Lal's official profile identifies Mehroni; canonical/ECI mapping uniquely places Mehroni at AC 227. The source number 0 is a source-side data error." },
  { constituencyNumber: 240, constituencyName: "Fatehpur", category: "NAME_CONFLICT", memberIds: ["25358"], selectedMemberId: "25358", partyShortName: "SP", resolutionReason: "Chandra Prakash's official profile identifies Fatehpur. Canonical/ECI mapping places it at AC 240; the source listing's AC 91 is swapped with Fatehpur Sikri." },
  { constituencyNumber: 245, constituencyName: "Babaganj", category: "PARTY_MISMATCH", memberIds: ["25741"], selectedMemberId: "25741", partyShortName: "Jansatta Dal Loktantrik Party", resolutionReason: "The official profile identifies Vinod Saroj as the current Babaganj member for Jansatta Dal Loktantrik Party. The user approved creating exactly one canonical Party record for this genuinely separate party, so the previously party-blocked MLA record is now importable." },
  { constituencyNumber: 246, constituencyName: "Kunda", category: "PARTY_MISMATCH", memberIds: ["25687"], selectedMemberId: "25687", partyShortName: "Jansatta Dal Loktantrik Party", resolutionReason: "The official profile identifies Raghuraj Pratap Singh as the current Kunda member for Jansatta Dal Loktantrik Party. The user approved creating exactly one canonical Party record for this genuinely separate party, so the previously party-blocked MLA record is now importable." },
  { constituencyNumber: 255, constituencyName: "Soraon", category: "NUMBER_0", memberIds: ["25356"], selectedMemberId: "25356", partyShortName: "SP", resolutionReason: "Geeta Shastri (Pasi)'s official profile identifies Soranv. Canonical/ECI mapping uniquely places Soraon at AC 255; the source number 0 and spelling difference are source-side data issues." },
  { constituencyNumber: 256, constituencyName: "Phulpur", category: "DUPLICATE_SEAT", memberIds: ["25618", "25920"], selectedMemberId: "25618", partyShortName: "BJP", resolutionReason: "Deepak Patel is the current member. His official profile says Bi Elected: Yes; Praveen Patel's profile says Resigned: Yes (15 June 2024).", profileFindings: { "25618": "Bi Elected: Yes", "25920": "Resigned: Yes; resignation date 15 June 2024" } },
  { constituencyNumber: 261, constituencyName: "Prayagraj West", category: "NAME_CONFLICT", memberIds: ["25915"], selectedMemberId: "25915", partyShortName: "BJP", resolutionReason: "The official profile identifies Siddhartha Nath Singh with Allahabad West. Allahabad was renamed Prayagraj; the canonical AC number 261 is unchanged." },
  { constituencyNumber: 262, constituencyName: "Prayagraj North", category: "NAME_CONFLICT", memberIds: ["25522"], selectedMemberId: "25522", partyShortName: "BJP", resolutionReason: "The official profile identifies Harsh Vardhan Bajpai with Allahabad North. Allahabad was renamed Prayagraj; the canonical AC number 262 is unchanged." },
  { constituencyNumber: 263, constituencyName: "Prayagraj South", category: "NAME_CONFLICT", memberIds: ["25541"], selectedMemberId: "25541", partyShortName: "BJP", resolutionReason: "The official profile identifies Nand Gopal Gupta 'Nandi' with Allahabad South. Allahabad was renamed Prayagraj; the canonical AC number 263 is unchanged." },
  { constituencyNumber: 264, constituencyName: "Bara", category: "PARTY_MISMATCH", memberIds: ["25732"], selectedMemberId: "25732", partyShortName: "Apna Dal", resolutionReason: "The official profile identifies Vachaspati with Bara and labels the party 'Apna Dal'. The existing canonical party is Apna Dal (Soneylal), short name 'Apna Dal'; this is a clear source-label alias, not a new party." },
  { constituencyNumber: 267, constituencyName: "Ram Nagar", category: "NAME_CONFLICT", memberIds: ["25634"], selectedMemberId: "25634", partyShortName: "SP", resolutionReason: "The official profile identifies Fareed Mahfooz Kidwai with Ramnagar. Ramnagar/Ram Nagar is a spacing difference; the canonical AC number 267 is unchanged." },
  { constituencyNumber: 277, constituencyName: "Katehari", category: "DUPLICATE_SEAT", memberIds: ["25619", "25596"], selectedMemberId: "25619", partyShortName: "SP", resolutionReason: "Dharamraj Nishad is the current member. His official profile says Bi Elected: Yes; Lalji Verma's profile says Resigned: Yes (7 June 2024).", profileFindings: { "25619": "Bi Elected: Yes", "25596": "Resigned: Yes; resignation date 7 June 2024" } },
  { constituencyNumber: 279, constituencyName: "Alapur", category: "NAME_CONFLICT", memberIds: ["25498"], selectedMemberId: "25498", partyShortName: "SP", resolutionReason: "The official profile identifies Tribhuwan Dutt with Aalapur. Aalapur/Alapur is a spelling difference; the canonical AC number 279 is unchanged." },
  { constituencyNumber: 292, constituencyName: "Gainsari", category: "DUPLICATE_SEAT", memberIds: ["25201", "25602"], selectedMemberId: "25201", partyShortName: "SP", resolutionReason: "Shiv Pratap Kumar Yadav is the current member. The other official profile, for predecessor Shiv Pratap Yadav, says Dead: Yes.", profileFindings: { "25201": "Active member profile for Gainsari", "25602": "Dead: Yes" } },
  { constituencyNumber: 297, constituencyName: "Katra Bazar", category: "NAME_CONFLICT", memberIds: ["25649"], selectedMemberId: "25649", partyShortName: "BJP", resolutionReason: "Bawan Singh's official profile identifies Katra Bazar. Canonical/ECI mapping places Katra Bazar at AC 297; the source listing's AC 131 is swapped with Katra." },
  { constituencyNumber: 306, constituencyName: "Domariyaganj", category: "NAME_CONFLICT", memberIds: ["25559"], selectedMemberId: "25559", partyShortName: "SP", resolutionReason: "The official profile identifies Syeda Khatoon with Domariaganj. Domariaganj/Domariyaganj is a spelling difference; the canonical AC number 306 is unchanged." },
  { constituencyNumber: 313, constituencyName: "Khalilabad", category: "DUPLICATE_SEAT", memberIds: ["25226", "25432"], selectedMemberId: "25226", partyShortName: "BJP", resolutionReason: "Both official rows and profiles identify the same person, Ankur Tiwari, for the same constituency and party. This is a duplicate profile-record issue, not two competing members; resolve to one candidate identity and retain both profile URLs as provenance.", profileFindings: { "25226": "Ankur Tiwari, Khalilabad, BJP", "25432": "Duplicate official profile for Ankur Tiwari, Khalilabad, BJP" } },
  { constituencyNumber: 314, constituencyName: "Dhanghata", category: "NAME_CONFLICT", memberIds: ["25351"], selectedMemberId: "25351", partyShortName: "BJP", resolutionReason: "The official profile identifies Ganesh Chandra with Ghanghata. Ghanghata/Dhanghata is a source spelling difference; the canonical AC number 314 is unchanged." },
  { constituencyNumber: 320, constituencyName: "Campierganj", category: "NAME_CONFLICT", memberIds: ["25633"], selectedMemberId: "25633", partyShortName: "BJP", resolutionReason: "The official profile identifies Fateh Bahadur with Caimpiyarganj and gives a Campierganj address. This is a transliteration difference; the canonical AC number 320 is unchanged." },
  { constituencyNumber: 343, constituencyName: "Atrauliya", category: "NAME_CONFLICT", memberIds: ["25761"], selectedMemberId: "25761", partyShortName: "SP", resolutionReason: "The official profile identifies Sangram Yadav with Atraulia. Atraulia/Atrauliya is a transliteration difference; the canonical AC number 343 is unchanged." },
  { constituencyNumber: 354, constituencyName: "Ghosi", category: "DUPLICATE_SEAT", memberIds: ["25603", "25597"], resolutionReason: "No current sitting MLA can be imported. Dara Singh Chauhan's official profile says Resigned: Yes; his by-election successor Sudhakar Singh's official profile says Dead: Yes. No authoritative replacement record was found, so the seat is treated as vacant/unresolved.", profileFindings: { "25603": "Dead: Yes", "25597": "Resigned: Yes; resignation date 17 July 2023" }, confidence: "UNRESOLVED" },
  { constituencyNumber: 375, constituencyName: "Ghazipur Sadar", category: "NAME_CONFLICT", memberIds: ["25416"], selectedMemberId: "25416", partyShortName: "SP", resolutionReason: "The official profile identifies Jai Kishan Sahu with Ghazipur. Ghazipur/Ghazipur Sadar is a canonical display-name difference; the AC number 375 is unchanged." },
  { constituencyNumber: 397, constituencyName: "Majhawan", category: "DUPLICATE_SEAT", memberIds: ["24722", "25598"], selectedMemberId: "24722", partyShortName: "BJP", resolutionReason: "Shuchismita Maurya is the current member on the official profile. Vinod Kumar Bind's official profile says Resigned: Yes.", profileFindings: { "24722": "Active member profile for Majhawan", "25598": "Resigned: Yes" } },
];

function cleanName(raw: string): string {
  const honorifics = new Set(["shri", "shrimati", "smt", "dr", "prof", "er", "engineer", "kuwar"]);
  const tokens = raw.replace(/\s+/g, " ").trim().split(" ");
  if (tokens.length > 1 && honorifics.has(tokens[0].toLowerCase().replace(/\./g, ""))) tokens.shift();
  return tokens.join(" ");
}

const workspace = path.resolve(__dirname, "..");
const reviewRows: ReviewRow[] = JSON.parse(
  fs.readFileSync(path.join(workspace, "data", "up", "current-mlas-needs-review.json"), "utf8"),
);
const reviewById = new Map(reviewRows.map((row) => [row.memberId, row]));

const resolutions = decisions.map((decision) => {
  const sourceRecords = decision.memberIds.map((memberId) => {
    const row = reviewById.get(memberId);
    if (!row) throw new Error(`Missing review row for official memberId ${memberId}`);
    return {
      memberId,
      name: row.name.replace(/\s+/g, " ").trim(),
      constituencyNumberOnSource: row.constituencyNumberOnSource,
      constituencyNameOnSource: row.constituencyNameOnSource,
      partyRaw: row.partyRaw,
      profileFinding: decision.profileFindings?.[memberId] ?? "Official profile identifies this member, constituency, and party; profile is not marked resigned or deceased.",
      profileUrl: profileUrl(memberId),
    };
  });
  const selected = decision.selectedMemberId ? reviewById.get(decision.selectedMemberId) : undefined;
  if (decision.selectedMemberId && !selected) throw new Error(`Missing selected member ${decision.selectedMemberId}`);

  const confidence = decision.confidence ?? "HIGH";
  return {
    constituencyNumber: decision.constituencyNumber,
    constituencyName: decision.constituencyName,
    originalProblem: `${decision.category}: ${sourceRecords.map((r) => `member ${r.memberId} was listed as ${r.constituencyNumberOnSource}-${r.constituencyNameOnSource}`).join("; ")}`,
    sourceRecords,
    evidenceChecked: [
      "Official Uttar Pradesh Legislative Assembly individual member profile(s)",
      "Official Uttar Pradesh Legislative Assembly member listing, treated only as a discovery source because it contains stale/duplicate/incorrect rows",
      "Election Commission of India 2022 statistical reports for authoritative constituency number/name mapping where the assembly source number or spelling conflicted",
    ],
    resolvedCandidate:
      confidence === "HIGH" && selected
        ? {
            name: cleanName(selected.name),
            partyShortName: decision.partyShortName,
            status: "INCUMBENT",
            memberId: selected.memberId,
            sourceUrl: profileUrl(selected.memberId),
            verified: false,
          }
        : null,
    resolutionReason: decision.resolutionReason,
    confidence,
    sourceUrls: [...decision.memberIds.map(profileUrl), OFFICIAL_LISTING, ECI_2022_REPORTS],
  };
});

const numbers = resolutions.map((r) => r.constituencyNumber);
if (resolutions.length !== 50 || new Set(numbers).size !== 50) {
  throw new Error(`Expected exactly 50 unique constituency resolutions, got ${resolutions.length}/${new Set(numbers).size}`);
}
if (resolutions.filter((r) => r.confidence === "HIGH").length !== 49) {
  throw new Error("Expected exactly 49 HIGH-confidence resolutions");
}

const outPath = path.join(workspace, "data", "up", "current-mlas-phase19a-resolutions.json");
fs.writeFileSync(outPath, `${JSON.stringify(resolutions, null, 2)}\n`);
console.log(`Wrote ${resolutions.length} resolution records to ${outPath}`);
console.log(`HIGH: ${resolutions.filter((r) => r.confidence === "HIGH").length}`);
console.log(`UNRESOLVED: ${resolutions.filter((r) => r.confidence === "UNRESOLVED").length}`);
