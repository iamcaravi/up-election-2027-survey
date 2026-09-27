export const UP_CONSTITUENCY_HINDI_NAMES: Record<string, string> = {
  // Gonda district
  "colonelganj": "कर्नलगंज",
  "gonda": "गोंडा",
  "tarabganj": "तरबगंज",
  "mankapur": "मनकापुर",
  "gaura": "गौरा",
  "mehnaun": "मेहनौन",
  "katra-bazar": "कटरा बाजार",

  // Aligarh district
  "atrauli": "अतरौली",
  "khair": "खैर",
  "barauli": "बरौली",
  "koil": "कोल",
  "aligarh": "अलीगढ़",
  "iglas": "इगलास",


  // Lucknow district
  "lucknow-cantt": "लखनऊ कैंट",
  "lucknow-central": "लखनऊ मध्य",
  "lucknow-east": "लखनऊ पूर्व",
  "lucknow-north": "लखनऊ उत्तर",
  "lucknow-west": "लखनऊ पश्चिम",
  "sarojini-nagar": "सरोजिनी नगर",
  "bakshi-ka-talab": "बख्शी का तालाब",
  "malihabad": "मलिहाबाद",
  "mohanlalganj": "मोहनलालगंज",

  // Ayodhya / Faizabad
  "ayodhya": "अयोध्या",
  "bikapur": "बिकापुर",
  "rudauli": "रूदौली",
  "goshainganj": "गोशाईंगंज",
  "milkipur": "मिल्कीपुर",

  // Varanasi
  "varanasi-cantt": "वाराणसी कैंट",
  "varanasi-north": "वाराणसी उत्तर",
  "varanasi-south": "वाराणसी दक्षिण",
  "ajagara": "अजगरा",
  "shivpur": "शिवपुर",
  "rohania": "रोहनिया",
  "sevapuri": "सेवापुरी",
  "pindra": "पिंडरा",

  // Gorakhpur
  "gorakhpur-urban": "गोरखपुर नगर",
  "gorakhpur-rural": "गोरखपुर ग्रामीण",
  "campiyarganj": "कैंपियरगंज",
  "pipraich": "पिपराइच",
  "sahjanwa": "सहजनवा",
  "khajani": "खजनी",
  "chauri-chaura": "चौरी-चौरा",
  "bansgaon": "बांसगांव",
  "chillupar": "चिल्लूपार",

  // Prayagraj
  "allahabad-north": "इलाहाबाद उत्तर",
  "allahabad-south": "इलाहाबाद दक्षिण",
  "allahabad-west": "इलाहाबाद पश्चिम",
  "phaphamau": "फाफामऊ",
  "soraon": "सोरांव",
  "phulpur": "फूलपुर",
  "pratappur": "प्रतापपुर",
  "handia": "हंडिया",
  "meja": "मेजा",
  "karachhana": "करछना",
  "bara": "बारा",
  "koraon": "कोरांव",
};

export function getConstituencyDisplayName(slug: string, fallbackName: string, locale: string): string {
  if (locale === "hi") {
    const normalized = slug.toLowerCase().trim();
    return UP_CONSTITUENCY_HINDI_NAMES[normalized] || fallbackName;
  }
  return fallbackName;
}
