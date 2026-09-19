export interface StateAssemblyVisualConfig {
  slug: string;
  nameEnglish: string;
  nameHindi: string;
  assemblyNameEnglish: string;
  assemblyNameHindi: string;
  assemblyImage?: string; // High-resolution authentic photo asset
}

export const STATE_ASSEMBLY_CONFIGS: Record<string, StateAssemblyVisualConfig> = {
  "uttar-pradesh": {
    slug: "uttar-pradesh",
    nameEnglish: "Uttar Pradesh",
    nameHindi: "उत्तर प्रदेश",
    assemblyNameEnglish: "Uttar Pradesh Vidhan Sabha (Vidhan Bhavan, Lucknow)",
    assemblyNameHindi: "उत्तर प्रदेश विधान भवन, लखनऊ",
    assemblyImage: "/images/survey/assembly-uttar-pradesh.png",
  },
  punjab: {
    slug: "punjab",
    nameEnglish: "Punjab",
    nameHindi: "पंजाब",
    assemblyNameEnglish: "Punjab Vidhan Sabha (Chandigarh)",
    assemblyNameHindi: "पंजाब विधान सभा, चंडीगढ़",
  },
  gujarat: {
    slug: "gujarat",
    nameEnglish: "Gujarat",
    nameHindi: "गुजरात",
    assemblyNameEnglish: "Gujarat Legislative Assembly (Vithalbhai Patel Bhavan, Gandhinagar)",
    assemblyNameHindi: "गुजरात विधान सभा (विठ्ठलभाई पटेल भवन), गांधीनगर",
  },
  maharashtra: {
    slug: "maharashtra",
    nameEnglish: "Maharashtra",
    nameHindi: "महाराष्ट्र",
    assemblyNameEnglish: "Maharashtra Vidhan Bhavan (Mumbai)",
    assemblyNameHindi: "महाराष्ट्र विधान भवन, मुंबई",
  },
  uttarakhand: {
    slug: "uttarakhand",
    nameEnglish: "Uttarakhand",
    nameHindi: "उत्तराखंड",
    assemblyNameEnglish: "Uttarakhand Vidhan Sabha (Dehradun)",
    assemblyNameHindi: "उत्तराखंड विधान सभा, देहरादून",
  },
  "himachal-pradesh": {
    slug: "himachal-pradesh",
    nameEnglish: "Himachal Pradesh",
    nameHindi: "हिमाचल प्रदेश",
    assemblyNameEnglish: "Himachal Pradesh Vidhan Sabha (Shimla)",
    assemblyNameHindi: "हिमाचल प्रदेश विधान सभा, शिमला",
  },
  bihar: {
    slug: "bihar",
    nameEnglish: "Bihar",
    nameHindi: "बिहार",
    assemblyNameEnglish: "Bihar Vidhan Sabha (Patna)",
    assemblyNameHindi: "बिहार विधान सभा, पटना",
  },
  rajasthan: {
    slug: "rajasthan",
    nameEnglish: "Rajasthan",
    nameHindi: "राजस्थान",
    assemblyNameEnglish: "Rajasthan Legislative Assembly (Jaipur)",
    assemblyNameHindi: "राजस्थान विधान सभा, जयपुर",
  },
  "west-bengal": {
    slug: "west-bengal",
    nameEnglish: "West Bengal",
    nameHindi: "पश्चिम बंगाल",
    assemblyNameEnglish: "West Bengal Legislative Assembly (Kolkata)",
    assemblyNameHindi: "पश्चिम बंगाल विधान सभा, कोलकाता",
  },
  goa: {
    slug: "goa",
    nameEnglish: "Goa",
    nameHindi: "गोवा",
    assemblyNameEnglish: "Goa Legislative Assembly (Porvorim)",
    assemblyNameHindi: "गोवा विधान सभा, पोरवोरिम",
  },
  manipur: {
    slug: "manipur",
    nameEnglish: "Manipur",
    nameHindi: "मणिपुर",
    assemblyNameEnglish: "Manipur Legislative Assembly (Imphal)",
    assemblyNameHindi: "मणिपुर विधान सभा, इंफाल",
  },
};

export function getStateAssemblyConfig(stateSlug?: string): StateAssemblyVisualConfig | undefined {
  if (!stateSlug) return undefined;
  return STATE_ASSEMBLY_CONFIGS[stateSlug.toLowerCase().trim()];
}
