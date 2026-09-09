import type hi from "./hi";

const en: typeof hi = {
  common: {
    siteName: "India Election Survey",
    loading: "Loading...",
    error: "Something went wrong.",
    retry: "Try again",
    skip: "Skip",
    next: "Continue",
    back: "Back",
    submit: "Submit",
    viewAll: "View all",
    search: "Search district, constituency or candidate...",
    optional: "Optional",
    preferNotToSay: "Prefer not to say",
  },
  nav: {
    home: "Home",
    districts: "States",
    results: "Survey Results",
    methodology: "Methodology",
    admin: "Admin",
  },
  hero: {
    title1: "India Elections",
    title2: "What does the public mood say?",
    subtitle: "Your platform for understanding elections, voters, candidates and public opinion — state by state.",
    ctaPrimary: "Find Your Assembly",
    ctaSecondary: "Take the Survey",
  },
  stats: {
    constituencies: "Assembly Constituencies",
    districts: "Districts",
    responses: "Survey Responses",
    activeSurveys: "Active Surveys",
  },
  map: {
    titleSuffix: "Map",
    subtitle: "Click a district to explore",
    surveyLeader: "Current Survey Leader",
    notWinner: "This is not an official election result",
  },
  district: {
    constituencies: "Constituencies",
    totalResponses: "Total Responses",
    activeSurveys: "Active Surveys",
    viewConstituency: "View Constituency",
    currentMla: "Current MLA",
  },
  constituency: {
    heading: "Who do you want to see as your MLA?",
    reserved: "Reserved",
    unreserved: "Unreserved",
    result2022: "2022 Result",
    takeSurvey: "Take the Survey",
    viewResults: "View Results",
  },
  candidate: {
    declared: "Declared Candidate",
    likely: "Likely Candidate",
    possible: "Potential Contender",
    incumbent: "Incumbent MLA",
    historical: "Historical Candidate",
    notVerified: "Not verified",
  },
  vote: {
    question: "Who do you want to see as your MLA from your constituency in 2027?",
    other: "Other",
    continue: "Continue",
  },
  demographics: {
    title: "Want to tell us about yourself?",
    subtitle: "This information is optional and used only for anonymous aggregate survey analysis.",
    age: "Age group",
    gender: "Gender",
    socialCategory: "Social category",
    religion: "Religion",
  },
  completion: {
    recorded: "Your response has been recorded.",
    cta: "See the public mood",
    ctaButton: "Live Survey Results",
  },
  results: {
    totalResponses: "Total valid responses",
    lastUpdated: "Last updated",
    surveyLeader: "Survey Leader",
    surveyLeaderNote: "currently leads among survey respondents.",
    insufficientData: "Not enough responses yet to show a reliable survey comparison.",
    methodologyLink: "View methodology",
  },
  analytics: {
    candidatePreference: "Candidate Preference",
    partyPreference: "Party Preference",
    topIssues: "Top Issues",
    insufficientGroup: "Insufficient responses to display this breakdown.",
    among: "Among survey respondents",
  },
  disclaimer:
    "This platform presents results from voluntary online survey responses. Survey results are not official election results and may not represent the views of the entire electorate.",
};

export default en;
