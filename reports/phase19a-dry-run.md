# PHASE 19A DRY RUN

Generated: 2026-09-09T17:39:52.734Z

Database writes: **none** (`runMlaImport(..., { commit: false })`)

## Summary

- Previously imported: 353
- Newly resolvable at HIGH confidence: 49
- Still unresolved: 1
- Total potential coverage after an approved import: 402 / 403
- Importer result: 49 create, 0 update, 0 unchanged, 0 needs review
- Protected 353 Candidate mappings unchanged during dry run: true
- All database counts unchanged during dry run: true
- Existing INCUMBENT-linked SurveyOption rows: 0

## Database safety counts (before and after are identical)

```json
{
  "states": 1,
  "elections": 1,
  "districts": 75,
  "constituencies": 403,
  "surveys": 403,
  "surveyQuestions": 2821,
  "surveyOptions": 18941,
  "candidates": 353,
  "surveyResponses": 0
}
```

## Proposed HIGH-confidence records

| AC | Constituency | MLA | Party | Status | Confidence | Evidence | Official profile |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15 | Khatauli | Madan Bhaiya | RLD | INCUMBENT | HIGH | Madan Bhaiya is the current member. His official profile says Bi Elected: Yes; Vikram Singh's official profile says Resigned: Yes. | [member 25623](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25623) |
| 34 | Suar | Shafiq Ahmad Ansari | Apna Dal | INCUMBENT | HIGH | Shafiq Ahmad Ansari is the current member. Abdullah Azam Khan's official profile says Resigned: Yes and gives disqualification as the reason. | [member 24924](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=24924) |
| 36 | Bilaspur | Baldev Singh Aulakh | BJP | INCUMBENT | HIGH | The source listing attached Baldev Singh Aulakh's Bilaspur row to AC 38. His official profile identifies Bilaspur; the canonical/ECI mapping is AC 36 Bilaspur. This is a source-side number error, not a master-table error. | [member 25648](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25648) |
| 37 | Rampur | Akash Saxsena (Hani) | BJP | INCUMBENT | HIGH | Akash Saxena is the current member. His official profile says Bi Elected: Yes; Mohammad Azam Khan's profile says Resigned: Yes and gives disqualification as the reason. | [member 25323](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25323) |
| 38 | Milak | Rajbala Singh | BJP | INCUMBENT | HIGH | Rajbala Singh's official profile identifies Milak. The apparent duplicate arose only because the Bilaspur source row was incorrectly numbered 38; canonical/ECI mapping places Bilaspur at 36 and Milak at 38. | [member 25242](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25242) |
| 47 | Meerut Cantt. | Amit Agrawal | BJP | INCUMBENT | HIGH | Amit Agrawal's official profile identifies Meerut Cantt. Canonical/ECI mapping places Meerut Cantt. at AC 47; the source listing's AC 48 is a source-side numbering error. | [member 25301](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25301) |
| 48 | Meerut | Rafiq Ansari | SP | INCUMBENT | HIGH | Rafiq Ansari's official profile identifies Meerut. Canonical/ECI mapping places Meerut at AC 48; the source listing's AC 49 is a source-side numbering error. | [member 25689](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25689) |
| 49 | Meerut South | Somendra Singh Tomar | BJP | INCUMBENT | HIGH | Somendra Singh Tomar's official profile identifies Meerut South. Canonical/ECI mapping places Meerut South at AC 49; the source listing's AC 47 is a source-side numbering error. | [member 25491](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25491) |
| 52 | Bagpat | Yogesh Dhama | BJP | INCUMBENT | HIGH | The official profile identifies Yogesh Dhama with Baghpat. Baghpat/Bagpat is a transliteration/display-name difference; the canonical AC number 52 is unchanged. | [member 25813](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25813) |
| 56 | Ghaziabad | Sanjeev Sharma | BJP | INCUMBENT | HIGH | Sanjeev Sharma is the current member on the official profile. Atul Garg's official profile says Resigned: Yes (14 June 2024). | [member 25770](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25770) |
| 65 | Bulandshahr | Pradeep Kumar Chaudhary | BJP | INCUMBENT | HIGH | Pradeep Kumar Chaudhary's official profile identifies Bulandshahr. The extra rows grouped under AC 65 are Dadraul members whose source numbers are wrong; they belong to AC 136. | [member 25589](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25589) |
| 66 | Syana | Devendra Singh Lodhi | BJP | INCUMBENT | HIGH | The official profile identifies Devendra Singh Lodhi with Siana. Siana/Syana is a spelling variation; the canonical AC number 66 is unchanged. | [member 25513](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25513) |
| 71 | Khair | Surendra diler | BJP | INCUMBENT | HIGH | Surendra Diler is the current member. Anoop Pradhan Valmiki's official profile says Resigned: Yes (14 June 2024). | [member 25785](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25785) |
| 75 | Koil | Anil Parashar | BJP | INCUMBENT | HIGH | Anil Parashar's official profile identifies Kol. The ECI/canonical constituency is AC 75 Koil; the source number 0 and Kol/Koil spelling are source-side data issues. | [member 25295](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25295) |
| 91 | Fatehpur Sikri | Babulal | BJP | INCUMBENT | HIGH | Babulal's official profile identifies Fatehpur Sikri. Canonical/ECI mapping places it at AC 91; the source listing's AC 240 is swapped with Fatehpur. | [member 25452](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25452) |
| 101 | Amanpur | Hariom | BJP | INCUMBENT | HIGH | The official profile identifies Hariom with Amapur. Amapur/Amanpur is a source spelling difference; the canonical AC number 101 is unchanged. | [member 25515](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25515) |
| 110 | Karhal | Tej Pratap Singh | SP | INCUMBENT | HIGH | Tej Pratap Singh is the current member. His official profile says Bi Elected: Yes; Akhilesh Yadav's profile says Resigned: Yes (13 June 2024). | [member 25617](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25617) |
| 115 | Badaun | Mahesh Chandra Gupta | BJP | INCUMBENT | HIGH | The official profile identifies Mahesh Chandra Gupta with Budaun. Budaun/Badaun is a transliteration difference; the canonical AC number 115 is unchanged. | [member 25674](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25674) |
| 131 | Katra | Veer Vikram Singh | BJP | INCUMBENT | HIGH | Veer Vikram Singh's official profile identifies Katra. Canonical/ECI mapping places Katra at AC 131; the source listing's AC 297 is swapped with Katra Bazar. | [member 25747](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25747) |
| 136 | Dadraul | Arvind Kumar Singh | BJP | INCUMBENT | HIGH | Arvind Kumar Singh is the current Dadraul member. His official profile says Bi Elected: Yes; Manvendra Singh's profile says Dead: Yes. Both source rows were incorrectly numbered 65; canonical/ECI mapping places Dadraul at AC 136. | [member 25615](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25615) |
| 140 | Sri Nagar | Manju Tyagi | BJP | INCUMBENT | HIGH | The official profile identifies Manju Tyagi with Srinagar. Srinagar/Sri Nagar is a spacing difference; the canonical AC number 140 is unchanged. | [member 25656](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25656) |
| 144 | Mohammdi | Lokendra Pratap Singh | BJP | INCUMBENT | HIGH | The official profile identifies Lokendra Pratap Singh with Mohammadi. Mohammadi/Mohammdi is a spelling difference; the canonical AC number 144 is unchanged. | [member 25730](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25730) |
| 147 | Hargaon | Suresh Rahi | BJP | INCUMBENT | HIGH | The official profile identifies Suresh Rahi with Hargoan. Hargoan/Hargaon is a source spelling difference; the canonical AC number 147 is unchanged. | [member 25791](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25791) |
| 154 | Sawayazpur | Madhavendra Pratap Singh | BJP | INCUMBENT | HIGH | The official profile identifies Madhavendra Pratap Singh with Sawaijpur. Sawaijpur/Sawayazpur is a transliteration difference; the canonical AC number 154 is unchanged. | [member 25677](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25677) |
| 166 | Bhagwantnagar | Ashutosh Shukla | BJP | INCUMBENT | HIGH | The official profile identifies Ashutosh Shukla with Bhagwant Nagar. This is a spacing difference; the canonical AC number 166 is unchanged. | [member 25330](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25330) |
| 167 | Purwa | Anil Kumar Singh | BJP | INCUMBENT | HIGH | Anil Kumar Singh's official profile identifies Purwa; canonical/ECI mapping uniquely places Purwa at AC 167. The source number 0 is a source-side data error. | [member 25293](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25293) |
| 173 | Lucknow East | O.P. Srivastava | BJP | INCUMBENT | HIGH | O.P. Srivastava is the current member. His official profile says Bi Elected: Yes; Ashutosh Tandon's profile says Dead: Yes. | [member 25616](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25616) |
| 227 | Mehroni | Manohar Lal | BJP | INCUMBENT | HIGH | Manohar Lal's official profile identifies Mehroni; canonical/ECI mapping uniquely places Mehroni at AC 227. The source number 0 is a source-side data error. | [member 25666](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25666) |
| 240 | Fatehpur | Chandra Prakash | SP | INCUMBENT | HIGH | Chandra Prakash's official profile identifies Fatehpur. Canonical/ECI mapping places it at AC 240; the source listing's AC 91 is swapped with Fatehpur Sikri. | [member 25358](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25358) |
| 245 | Babaganj | Vinod Saroj | Jansatta Dal Loktantrik Party | INCUMBENT | HIGH | The official profile identifies Vinod Saroj as the current Babaganj member for Jansatta Dal Loktantrik Party. The approved import creates one canonical Party record for this genuinely separate party. | [member 25741](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25741) |
| 246 | Kunda | Raghuraj Pratap Singh | Jansatta Dal Loktantrik Party | INCUMBENT | HIGH | The official profile identifies Raghuraj Pratap Singh as the current Kunda member for Jansatta Dal Loktantrik Party. The approved import uses the same single canonical Party record. | [member 25687](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25687) |
| 255 | Soraon | Geeta Shastri (Pasi) | SP | INCUMBENT | HIGH | Geeta Shastri (Pasi)'s official profile identifies Soranv. Canonical/ECI mapping uniquely places Soraon at AC 255; the source number 0 and spelling difference are source-side data issues. | [member 25356](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25356) |
| 256 | Phulpur | Deepak Patel | BJP | INCUMBENT | HIGH | Deepak Patel is the current member. His official profile says Bi Elected: Yes; Praveen Patel's profile says Resigned: Yes (15 June 2024). | [member 25618](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25618) |
| 261 | Prayagraj West | Siddhartha Nath Singh | BJP | INCUMBENT | HIGH | The official profile identifies Siddhartha Nath Singh with Allahabad West. Allahabad was renamed Prayagraj; the canonical AC number 261 is unchanged. | [member 25915](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25915) |
| 262 | Prayagraj North | Harsh Vardhan Bajpai | BJP | INCUMBENT | HIGH | The official profile identifies Harsh Vardhan Bajpai with Allahabad North. Allahabad was renamed Prayagraj; the canonical AC number 262 is unchanged. | [member 25522](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25522) |
| 263 | Prayagraj South | Nand Gopal Gupta "Nandi" | BJP | INCUMBENT | HIGH | The official profile identifies Nand Gopal Gupta 'Nandi' with Allahabad South. Allahabad was renamed Prayagraj; the canonical AC number 263 is unchanged. | [member 25541](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25541) |
| 264 | Bara | Vachaspati | Apna Dal | INCUMBENT | HIGH | The official profile identifies Vachaspati with Bara and labels the party 'Apna Dal'. The existing canonical party is Apna Dal (Soneylal), short name 'Apna Dal'; this is a clear source-label alias, not a new party. | [member 25732](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25732) |
| 267 | Ram Nagar | Fareed Mahfooz Kidwai | SP | INCUMBENT | HIGH | The official profile identifies Fareed Mahfooz Kidwai with Ramnagar. Ramnagar/Ram Nagar is a spacing difference; the canonical AC number 267 is unchanged. | [member 25634](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25634) |
| 277 | Katehari | Dharamraj Nishad | SP | INCUMBENT | HIGH | Dharamraj Nishad is the current member. His official profile says Bi Elected: Yes; Lalji Verma's profile says Resigned: Yes (7 June 2024). | [member 25619](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25619) |
| 279 | Alapur | Tribhuwan Dutt | SP | INCUMBENT | HIGH | The official profile identifies Tribhuwan Dutt with Aalapur. Aalapur/Alapur is a spelling difference; the canonical AC number 279 is unchanged. | [member 25498](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25498) |
| 292 | Gainsari | Shiv Pratap Kumar Yadav | SP | INCUMBENT | HIGH | Shiv Pratap Kumar Yadav is the current member. The other official profile, for predecessor Shiv Pratap Yadav, says Dead: Yes. | [member 25201](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25201) |
| 297 | Katra Bazar | Bawan Singh | BJP | INCUMBENT | HIGH | Bawan Singh's official profile identifies Katra Bazar. Canonical/ECI mapping places Katra Bazar at AC 297; the source listing's AC 131 is swapped with Katra. | [member 25649](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25649) |
| 306 | Domariyaganj | Syeda Khatoon | SP | INCUMBENT | HIGH | The official profile identifies Syeda Khatoon with Domariaganj. Domariaganj/Domariyaganj is a spelling difference; the canonical AC number 306 is unchanged. | [member 25559](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25559) |
| 313 | Khalilabad | Ankur Tiwari | BJP | INCUMBENT | HIGH | Both official rows and profiles identify the same person, Ankur Tiwari, for the same constituency and party. This is a duplicate profile-record issue, not two competing members; resolve to one candidate identity and retain both profile URLs as provenance. | [member 25226](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25226) |
| 314 | Dhanghata | Ganesh Chandra | BJP | INCUMBENT | HIGH | The official profile identifies Ganesh Chandra with Ghanghata. Ghanghata/Dhanghata is a source spelling difference; the canonical AC number 314 is unchanged. | [member 25351](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25351) |
| 320 | Campierganj | Fateh Bahadur | BJP | INCUMBENT | HIGH | The official profile identifies Fateh Bahadur with Caimpiyarganj and gives a Campierganj address. This is a transliteration difference; the canonical AC number 320 is unchanged. | [member 25633](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25633) |
| 343 | Atrauliya | Sangram Yadav | SP | INCUMBENT | HIGH | The official profile identifies Sangram Yadav with Atraulia. Atraulia/Atrauliya is a transliteration difference; the canonical AC number 343 is unchanged. | [member 25761](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25761) |
| 375 | Ghazipur Sadar | Jai Kishan Sahu | SP | INCUMBENT | HIGH | The official profile identifies Jai Kishan Sahu with Ghazipur. Ghazipur/Ghazipur Sadar is a canonical display-name difference; the AC number 375 is unchanged. | [member 25416](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25416) |
| 397 | Majhawan | Shuchismita Maurya | BJP | INCUMBENT | HIGH | Shuchismita Maurya is the current member on the official profile. Vinod Kumar Bind's official profile says Resigned: Yes. | [member 24722](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=24722) |

## Unresolved records

| AC | Constituency | Confidence | Exact reason | Official evidence |
| --- | --- | --- | --- | --- |
| 354 | Ghosi | UNRESOLVED | No current sitting MLA can be imported. Dara Singh Chauhan's official profile says Resigned: Yes; his by-election successor Sudhakar Singh's official profile says Dead: Yes. No authoritative replacement record was found, so the seat is treated as vacant/unresolved. | [profile 1](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25603), [profile 2](https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=25597) |

## Scope and safety notes

- The protected 353-row dataset was not modified.
- The Candidate table and every non-candidate table were unchanged.
- The dry-run made no Party or Constituency write. The subsequently approved write created exactly one canonical Jansatta Dal Loktantrik Party record and did not edit constituency master data.
- Every proposed record is `INCUMBENT` and `verified: false`; no 2027 candidacy is inferred.
- The source listing's wrong numbers for Bilaspur, the Meerut trio, Fatehpur/Fatehpur Sikri, Katra/Katra Bazar, and Dadraul are treated as source-side errors. The canonical master numbering agrees with the ECI mapping and must not be changed.
- Chhanbey/Rinki Kol is already within the protected 353 and was not re-imported or changed.
- The scope was subsequently expanded and explicitly approved as 47 + Babaganj + Kunda = 49. See `phase19a-final-report.md` for the completed import audit.
