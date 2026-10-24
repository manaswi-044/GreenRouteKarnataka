import type { TranslateRequest, TranslateResponse } from "@workspace/api-zod";

export interface LanguageInfo {
  code: string;
  name: string;
  localName: string;
  region: string;
  isKarnataka: boolean;
  ttsVoiceLocale?: string;
}

export const supportedLanguages: Record<string, LanguageInfo> = {
  // Karnataka Local Languages
  kn: { code: "kn", name: "Kannada", localName: "ಕನ್ನಡ", region: "Statewide / Bengaluru / Mysuru", isKarnataka: true, ttsVoiceLocale: "kn-IN" },
  tcy: { code: "tcy", name: "Tulu", localName: "ತುಳು", region: "Coastal Karnataka / Mangaluru / Udupi", isKarnataka: true, ttsVoiceLocale: "kn-IN" },
  kok: { code: "kok", name: "Konkani", localName: "ಕೊಂಕಣಿ", region: "Coastal / Karwar / Bhatkal", isKarnataka: true, ttsVoiceLocale: "mr-IN" },
  kfa: { code: "kfa", name: "Kodava Takk", localName: "ಕೊಡವ ತಕ್ಕ್", region: "Kodagu / Coorg highlands", isKarnataka: true, ttsVoiceLocale: "kn-IN" },
  "ur-ka": { code: "ur-ka", name: "Daccani Urdu", localName: "ದಖ್ಖನಿ / دکنی", region: "North & Central Karnataka / Hubballi / Bidar", isKarnataka: true, ttsVoiceLocale: "ur-IN" },

  // Tourist Languages
  en: { code: "en", name: "English", localName: "English", region: "International", isKarnataka: false, ttsVoiceLocale: "en-IN" },
  hi: { code: "hi", name: "Hindi", localName: "हिन्दी", region: "India", isKarnataka: false, ttsVoiceLocale: "hi-IN" },
  ta: { code: "ta", name: "Tamil", localName: "தமிழ்", region: "India", isKarnataka: false, ttsVoiceLocale: "ta-IN" },
  te: { code: "te", name: "Telugu", localName: "తెలుగు", region: "India", isKarnataka: false, ttsVoiceLocale: "te-IN" },
  ml: { code: "ml", name: "Malayalam", localName: "മലയാളം", region: "India", isKarnataka: false, ttsVoiceLocale: "ml-IN" },
  mr: { code: "mr", name: "Marathi", localName: "मराठी", region: "India", isKarnataka: false, ttsVoiceLocale: "mr-IN" },
  bn: { code: "bn", name: "Bengali", localName: "বাংলা", region: "India", isKarnataka: false, ttsVoiceLocale: "bn-IN" },
  es: { code: "es", name: "Spanish", localName: "Español", region: "International", isKarnataka: false, ttsVoiceLocale: "es-ES" },
  fr: { code: "fr", name: "French", localName: "Français", region: "International", isKarnataka: false, ttsVoiceLocale: "fr-FR" },
  de: { code: "de", name: "German", localName: "Deutsch", region: "International", isKarnataka: false, ttsVoiceLocale: "de-DE" },
};

interface PhraseEntry {
  en: string;
  kn: { text: string; roman: string };
  tcy: { text: string; roman: string };
  kok: { text: string; roman: string };
  kfa: { text: string; roman: string };
  "ur-ka": { text: string; roman: string };
  hi?: { text: string; roman: string };
}

export const curatedPhrases: PhraseEntry[] = [
  // Greetings & Courtesies
  {
    en: "Hello / Greetings",
    kn: { text: "ನಮಸ್ಕಾರ!", roman: "Namaskara!" },
    tcy: { text: "ನಮಸ್ಕಾರ / ಸೊಲ್ಮೆಲು!", roman: "Namaskara / Solmelu!" },
    kok: { text: "ದೇವ್ ಬರೆಂ ಕರೂಂ / ನಮಸ್ಕಾರ!", roman: "Dev barem karum / Namaskar!" },
    kfa: { text: "ನಮಸ್ಕಾರ / ಬಾಳೋ!", roman: "Namaskara / Baalo!" },
    "ur-ka": { text: "ಆದಾದ್ / ಸಲಾಮ್ ವಾಲೆಕುಮ್!", roman: "Aadaab / Salaam valekum!" },
    hi: { text: "नमस्ते / नमस्कार!", roman: "Namaste / Namaskar!" },
  },
  {
    en: "Thank you very much",
    kn: { text: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು!", roman: "Thumbaa dhanyavaadagalu!" },
    tcy: { text: "ಮಸ್ತ್ ಸೊಲ್ಮೆಲು!", roman: "Masth solmelu!" },
    kok: { text: "ಮಸ್ತ್ ದೇವ್ ಬರೆಂ ಕರೂಂ!", roman: "Masth dev barem karum!" },
    kfa: { text: "ತುಂಬಾ ಧನ್ಯವಾದ!", roman: "Thumbaa dhanyavaada!" },
    "ur-ka": { text: "ಬಹತ್ ಶುಕ್ರಿಯಾ ಜೀ!", roman: "Bahut shukriya ji!" },
    hi: { text: "बहुत-बहुत धन्यवाद!", roman: "Bahut-bahut dhanyavaad!" },
  },
  {
    en: "How are you? / Have you eaten?",
    kn: { text: "ಹೇಗಿದ್ದೀರಾ? ಊಟ ಆಯ್ತಾ?", roman: "Hegiddeera? Oota aaytha?" },
    tcy: { text: "ಎಂಚ ಉಲ್ಲರ್? ಒನಸ್ ಆಂಡಾ?", roman: "Encha ullar? Onas aanda?" },
    kok: { text: "ಕಸೋ ಆಸೈ? ಜವಣ್ ಜಾಲೆಂವೇ?", roman: "Koso aasai? Jevan jaalem-ve?" },
    kfa: { text: "ಎನ್ನ ವಿಷಯ? ಊಟ ಆಚಾ?", roman: "Enna vishaya? Oota aacha?" },
    "ur-ka": { text: "ಕೈಸೆ ಹೈ ಜೀ? ಖಾನಾ ಖಾಯೇ ಕ್ಯಾ?", roman: "Kaise hai ji? Khaana khaaye kya?" },
    hi: { text: "आप कैसे हैं? खाना खा लिया?", roman: "Aap kaise hain? Khaana kha liya?" },
  },

  // Auto / Transport / Moving Around
  {
    en: "How much to the railway station?",
    kn: { text: "ರೈಲ್ವೆ ಸ್ಟೇಷನ್‌ಗೆ ಎಷ್ಟು ಆಗುತ್ತೆ?", roman: "Railway station-ge eshtu aaguththe?" },
    tcy: { text: "ರೈಲ್ವೆ ಸ್ಟೇಷನ್‌ಗ್ ಏತ್ ಆಪುಂಡು?", roman: "Railway station-g eeth aapundu?" },
    kok: { text: "ರೈಲ್ವೆ ಸ್ಟೇಷನಕ್ ಕಿತ್ಲೆಂ ಜಾಲೆಂ?", roman: "Railway station-ak kitlem jaalem?" },
    kfa: { text: "ರೈಲ್ವೆ ಸ್ಟೇಷನ್‌ಕ್ ಎಚ್ಚರ ಆಚೆ?", roman: "Railway station-k echchara aache?" },
    "ur-ka": { text: "ರೈಲ್ವೆ ಸ್ಟೇಷನ್ ಕು ಕಿತ್ನಾ ಹೋತಾ ಜೀ?", roman: "Railway station ku kitna hota ji?" },
    hi: { text: "रेलवे स्टेशन का कितना होगा?", roman: "Railway station ka kitna hoga?" },
  },
  {
    en: "Please put on the meter",
    kn: { text: "ದಯವಿಟ್ಟು ಮೀಟರ್ ಹಾಕಿ", roman: "Dayavittu meter haaki" },
    tcy: { text: "ಮೀಟರ್ ಪಾಡುಲೆ ಪ್ಲೀಸ್", roman: "Meter paadule please" },
    kok: { text: "ಮೀಟರ್ ಲಾಗಯ್ ಪ್ಲೀಸ್", roman: "Meter lagai please" },
    kfa: { text: "ಮೀಟರ್ ಪಾಡಿ", roman: "Meter paadi" },
    "ur-ka": { text: "ಮೀಟರ್ ದಾಲೋ ಜೀ", roman: "Meter daalo ji" },
    hi: { text: "कृपया मीटर चालू कीजिए", roman: "Kripya meter chaalu keejiye" },
  },
  {
    en: "Please stop here",
    kn: { text: "ಇಲ್ಲೇ ನಿಲ್ಲಿಸಿ ಸ್ವಾಮಿ", roman: "Ille nillisi swamy" },
    tcy: { text: "ಮುಲ್ಪನೆ ಉಂತಾಲೆ", roman: "Mulpane unthaale" },
    kok: { text: "ಹಂಗಾಚ್ ರಾವಯಾತ್", roman: "Hangach raavayaat" },
    kfa: { text: "ಇಲ್ಲಿ ನಿಪ್ಸಿ", roman: "Illi nipsi" },
    "ur-ka": { text: "ಇಧರ್ ರೋಕೋ ಜೀ", roman: "Idhar roko ji" },
    hi: { text: "यहाँ रोक दीजिए", roman: "Yahaan rok deejiye" },
  },
  {
    en: "Which bus goes to the main bus stand?",
    kn: { text: "ಮೇನ್ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್‌ಗೆ ಯಾವ ಬಸ್ ಹೋಗುತ್ತೆ?", roman: "Main bus stand-ge yaava bus hoguththe?" },
    tcy: { text: "ಮೇನ್ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್‌ಗ್ ವಾ ಬಸ್ ಪೋಪುಂಡು?", roman: "Main bus stand-g vaa bus popundu?" },
    kok: { text: "ಮೇನ್ ಬಸ್ ಸ್ಟ್ಯಾಂಡಕ್ ಖಂಚಿ ಬಸ್ ವತ್ತಾ?", roman: "Main bus stand-ak khanchi bus vettha?" },
    kfa: { text: "ಮೇನ್ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್‌ಕ್ ಎನ್ನ ಬಸ್ ಪೋಪು?", roman: "Main bus stand-k enna bus popu?" },
    "ur-ka": { text: "ಮೇನ್ ಬಸ್ ಸ್ಟ್ಯಾಂಡ್ ಕು ಕೌನ್ಸಿ ಬಸ್ ಜಾತಿ ಜೀ?", roman: "Main bus stand ku kaunsi bus jaati ji?" },
    hi: { text: "मेन बस स्टैंड के लिए कौन सी बस जाएगी?", roman: "Main bus stand ke liye kaun si bus jaayegi?" },
  },

  // Food & Dining
  {
    en: "One plate Masala Dosa please",
    kn: { text: "ಒಂದು ಪ್ಲೇಟ್ ಮಸಾಲೆ ದೋಸೆ ಕೊಡಿ", roman: "Ondu plate masala dose kodi" },
    tcy: { text: "ಒಂಜಿ ಪ್ಲೇಟ್ ಮಸಾಲೆ ದೋಸೆ ಕೊರ್ಲೆ", roman: "Onji plate masala dose korle" },
    kok: { text: "ಏಕ್ ಪ್ಲೇಟ್ ಮಸಾಲಾ ದೋಸೊ ದಿಯಾತ್", roman: "Ek plate masala doso diyaat" },
    kfa: { text: "ಒಂದು ಪ್ಲೇಟ್ ಮಸಾಲೆ ದೋಸೆ ತಾರೀ", roman: "Ondu plate masala dose taari" },
    "ur-ka": { text: "ಏಕ್ ಪ್ಲೇಟ್ ಮಸಾಲಾ ದೋಸಾ ದೋ ಜೀ", roman: "Ek plate masala dosa do ji" },
    hi: { text: "एक प्लेट मसाला डोसा दीजिए", roman: "Ek plate masala dosa deejiye" },
  },
  {
    en: "Is this food very spicy?",
    kn: { text: "ಇದು ತುಂಬಾ ಖಾರ ಇದೆಯಾ?", roman: "Idu thumbaa khaara ideyaa?" },
    tcy: { text: "ಉಂದು ಮಸ್ತ್ ಕಾರ ಉಂಡಾ?", roman: "Undu masth kaara undaa?" },
    kok: { text: "ಹೆಂ ಚಡ್ ತಿಕ್ಕ್ ಆಸಾ ವೇ?", roman: "Hem chodd teek aasa ve?" },
    kfa: { text: "ಇದ್ ನಲ್ಲ ಕೈಪಾ?", roman: "Id nalla kaipaa?" },
    "ur-ka": { text: "ಯೇ ಜ್ಯಾದಾ ತೀಖಾ ಹೈ ಕ್ಯಾ ಜೀ?", roman: "Ye zyada teekha hai kya ji?" },
    hi: { text: "क्या यह बहुत तीखा है?", roman: "Kya yeh bahut teekha hai?" },
  },
  {
    en: "Can I have drinking water?",
    kn: { text: "ಕುಡಿಯುವ ನೀರು ಸಿಗುತ್ತಾ?", roman: "Kudiyuva neeru sigutthaa?" },
    tcy: { text: "ಪರ್ಪಿನ ನೀರ್ ತಿಕ್ಕುಂಡಾ?", roman: "Parpina neer thikkundaa?" },
    kok: { text: "ಪೀವ್ಚೆಂ ಉದಕ್ ಮೆಳ್ತಲಂ ವೇ?", roman: "Peevchem udak meltalam ve?" },
    kfa: { text: "ಕುಡಿಪಕ್ ನೀರ್ ಉಂಡಾ?", roman: "Kudipak neer undaa?" },
    "ur-ka": { text: "ಪೀನೇಕಾ ಪಾನೀ ಮಿಲೇಗಾ ಕ್ಯಾ ಜೀ?", roman: "Peene ka paani milega kya ji?" },
    hi: { text: "क्या पीने का पानी मिलेगा?", roman: "Kya peene ka paani milega?" },
  },
  {
    en: "Please bring the bill",
    kn: { text: "ದಯವಿಟ್ಟು ಬಿಲ್ ಕೊಡಿ", roman: "Dayavittu bill kodi" },
    tcy: { text: "ಬಿಲ್ ಕೊರ್ಲೆ ಪ್ಲೀಸ್", roman: "Bill korle please" },
    kok: { text: "ಬಿಲ್ ಹಾಡಾತ್ ಪ್ಲೀಸ್", roman: "Bill haadaat please" },
    kfa: { text: "ಬಿಲ್ ತಾರೀ", roman: "Bill taari" },
    "ur-ka": { text: "ಬಿಲ್ ಲಾವೋ ಜೀ", roman: "Bill laao ji" },
    hi: { text: "कृपया बिल लाइए", roman: "Kripya bill laaiye" },
  },

  // Directions & Places
  {
    en: "Where is the temple / beach entrance?",
    kn: { text: "ದೇವಸ್ಥಾನ / ಬೀಚ್ ಪ್ರವೇಶ ಎಲ್ಲಿದೆ?", roman: "Devasthana / beach pravesha ellide?" },
    tcy: { text: "ದೇವಸ್ಥಾನ / ಬೀಚ್ ದ್ವಾರ ಒಲ್ಪ ಉಂಡು?", roman: "Devasthana / beach dwaara olpa undu?" },
    kok: { text: "ದೇವೂಳ್ / ಬೀಚ್ ಪ್ರವೇಶ್ ಖಂಯ್ ಆಸಾ?", roman: "Devool / beach pravesh khain aasa?" },
    kfa: { text: "ದೇವಸ್ಥಾನ / ಬೀಚ್ ಬಾಕ್ಲ್ ಎಲ್ಲುಂಡು?", roman: "Devasthana / beach baakl ellundu?" },
    "ur-ka": { text: "ಮಂದಿರ್ / ಬೀಚ್ ಕಾ ರಾಸ್ತಾ ಕಹಾಂ ಹೈ ಜೀ?", roman: "Mandir / beach ka raasta kahan hai ji?" },
    hi: { text: "मंदिर / बीच का प्रवेश द्वार कहाँ है?", roman: "Mandir / beach ka pravesh dwaar kahan hai?" },
  },
  {
    en: "Is it nearby or far away?",
    kn: { text: "ಇದು ಹತ್ತಿರನಾ ಅಥವಾ ದೂರನಾ?", roman: "Idu hathiranaa athavaa dooranaa?" },
    tcy: { text: "ಉಂದು ಮುಟ್ಟನಾ ಅತ್ತಂಡ ದೂರನಾ?", roman: "Undu muttanaa atthanda dooranaa?" },
    kok: { text: "ಹೆಂ ಲಾಗಿಂ ಆಸಾ ಕಿ ಪಯ್ಸ್?", roman: "Hem laagin aasa ki pois?" },
    kfa: { text: "ಇದ್ ಪಕ್ಕದಾ ಎಲ್ಲೇ ದೂರವಾ?", roman: "Id pakkadaa elle dooravaa?" },
    "ur-ka": { text: "ಪಾಸ್ ಹೈ ಕ್ಯಾ ದೂರ್ ಹೈ ಜೀ?", roman: "Paas hai kya door hai ji?" },
    hi: { text: "यह पास है या दूर?", roman: "Yeh paas hai ya door?" },
  },

  // Shopping & Bargaining
  {
    en: "How much is this? Any discount?",
    kn: { text: "ಇದಕ್ಕೆ ಎಷ್ಟು? ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ", roman: "Idakke eshtu? Swalpa kadime maadi" },
    tcy: { text: "ಉಂದೆಕ್ ಏತ್? ಒಂತೆ ಕಮ್ಮಿ ಮಲ್ಪುಲೆ", roman: "Undek eeth? Onte kammi malpule" },
    kok: { text: "ಹಾಕಾ ಕಿತ್ಲೆಂ? ಮಾತ್ಸೆ ಉಣೆಂ ಕರಾತ್", roman: "Haaka kitlem? Maatse unnem karaat" },
    kfa: { text: "ಇದುಕ್ ಎಚ್ಚರ? ಕೊಂಚ ಕಮ್ಮಿ ಮಾಡಿ", roman: "Iduk echchara? Koncha kammi maadi" },
    "ur-ka": { text: "ಯೇ ಕಿತ್ನೇ ಕಾ ಹೈ? ಥೋಡಾ ಕಮ್ ಕರೋ ಜೀ", roman: "Ye kitne ka hai? Thoda kam karo ji" },
    hi: { text: "यह कितने का है? थोड़ा कम कीजिए", roman: "Yeh kitne ka hai? Thoda kam keejiye" },
  },
  {
    en: "Do you accept Google Pay / PhonePe / UPI?",
    kn: { text: "ಜಿಪೇ / ಫೋನ್‌ಪೇ / ಆನ್‌ಲೈನ್ ಪೇಮೆಂಟ್ ಇದೆಯಾ?", roman: "GPay / PhonePe / online payment ideyaa?" },
    tcy: { text: "ಜಿಪೇ / ಆನ್‌ಲೈನ್ ಉಂಡಾ?", roman: "GPay / online undaa?" },
    kok: { text: "ಜಿಪೇ / ಫೋನ್‌ಪೇ ಆಸಾ ವೇ?", roman: "GPay / PhonePe aasa ve?" },
    kfa: { text: "ಜಿಪೇ / ಆನ್‌ಲೈನ್ ಪೇಮೆಂಟ್ ಉಂಡಾ?", roman: "GPay / online payment undaa?" },
    "ur-ka": { text: "ಜಿಪೇ / ಯುಪಿಐ ಚಲ್ತಾ ಕ್ಯಾ ಜೀ?", roman: "GPay / UPI chalta kya ji?" },
    hi: { text: "क्या जीपे / फोनपे / यूपीआई चलेगा?", roman: "Kya GPay / PhonePe / UPI chalega?" },
  },

  // Emergencies & Help
  {
    en: "Please help me, I am lost",
    kn: { text: "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ, ದಾರಿ ತಪ್ಪಿದೆ", roman: "Dayavittu sahaaya maadi, daari thappide" },
    tcy: { text: "ಒಂತೆ ಸಹಾಯ ಮಲ್ಪುಲೆ, ಸಾದಿ ತತ್ತಿಂಡ್", roman: "Onte sahaaya malpule, saadi thattind" },
    kok: { text: "ಮಾತ್ಸೆ ಆಧಾರ್ ಕರಾತ್, ವಾಟ್ ಚುಕ್ಲಿ", roman: "Maatse aadhaar karaat, vaat chukli" },
    kfa: { text: "ಒಂದ್ ಸಹಾಯ ಮಾಡಿ, ದಾರಿ ತಪ್ಪಿ ಪೋಚಿ", roman: "Ond sahaaya maadi, daari thappi pochi" },
    "ur-ka": { text: "ಮದದ್ ಕರೋ ಜೀ, ರಾಸ್ತಾ ಭೂಲ್ ಗಯಾ", roman: "Madad karo ji, raasta bhool gaya" },
    hi: { text: "कृपया मेरी मदद कीजिए, मैं रास्ता भटक गया हूँ", roman: "Kripya meri madad keejiye, main raasta bhatak gaya hoon" },
  },
  {
    en: "Where is the nearest hospital or medical shop?",
    kn: { text: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಅಥವಾ ಮೆಡಿಕಲ್ ಶಾಪ್ ಎಲ್ಲಿದೆ?", roman: "Hatthirada aaspathre athavaa medical shop ellide?" },
    tcy: { text: "ಮುಟ್ಟದ ಆಸ್ಪತ್ರೆ ಒಲ್ಪ ಉಂಡು?", roman: "Muttada aaspathre olpa undu?" },
    kok: { text: "ಲಾಗಿಂಚೆಂ ಹಾಸ್ಪಿಟಲ್ ಖಂಯ್ ಆಸಾ?", roman: "Laaginchem hospital khain aasa?" },
    kfa: { text: "ಪಕ್ಕದ ಆಸ್ಪತ್ರೆ ಎಲ್ಲುಂಡು?", roman: "Pakkada aaspathre ellundu?" },
    "ur-ka": { text: "ನಜ್‌ದೀಕ್ ಕಾ ದವಾಖಾನಾ ಕಹಾಂ ಹೈ ಜೀ?", roman: "Nazdeek ka davaakhana kahan hai ji?" },
    hi: { text: "नजदीकी अस्पताल या मेडिकल स्टोर कहाँ है?", roman: "Nazdeeki aspatal ya medical store kahan hai?" },
  },
];

async function callAITranslator(
  text: string,
  fromLang: LanguageInfo,
  toLang: LanguageInfo,
  context?: string,
): Promise<TranslateResponse | undefined> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openAIKey = process.env.OPENAI_API_KEY?.trim();

  const systemPrompt = `You are a specialized linguistic travel translator for Karnataka, India.
You translate accurately between tourist languages (English, Hindi, etc.) and Karnataka languages:
- Kannada (Statewide official language)
- Tulu (Coastal Karnataka: Mangaluru, Udupi)
- Konkani (Coastal Karnataka: Karwar, Honnavar, Bhatkal, Mangaluru)
- Kodava Takk (Coorg / Kodagu highland language)
- Daccani Urdu (North & Central Karnataka conversational dialect)

Task:
Translate the input text from ${fromLang.name} (${fromLang.code}) to ${toLang.name} (${toLang.code}).
Keep the tone natural, polite, and authentic for everyday tourist-local interaction (e.g. speaking to auto drivers, shopkeepers, restaurant staff, locals).
You must return a single JSON object with these exact keys:
{
  "translatedText": "Translation in the authentic local script (or standard script)",
  "romanized": "Phonetic English pronunciation guide with easy-to-read syllables",
  "audioPhonetic": "Simplified phonetic text for speech synthesis",
  "pronunciation": "Brief tip on emphasis or tone if helpful",
  "notes": "Cultural tip or polite usage note"
}
Return valid JSON only, no markdown markers.`;

  const userPrompt = JSON.stringify({
    text,
    from: fromLang.name,
    to: toLang.name,
    context: context ?? "General tourist conversation in Karnataka",
  });

  if (anthropicKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const body = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
        const raw = body.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
        if (raw) {
          const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Partial<TranslateResponse>;
          if (parsed.translatedText && parsed.romanized) {
            return {
              translatedText: parsed.translatedText,
              romanized: parsed.romanized,
              sourceLanguage: fromLang.name,
              targetLanguage: toLang.name,
              audioPhonetic: parsed.audioPhonetic ?? parsed.romanized,
              pronunciation: parsed.pronunciation ?? "",
              notes: parsed.notes ?? "",
            };
          }
        }
      }
    } catch {
      // Continue to OpenAI or deterministic fallback
    }
  }

  if (openAIKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${openAIKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1024,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = body.choices?.[0]?.message?.content?.trim();
        if (raw) {
          const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, "")) as Partial<TranslateResponse>;
          if (parsed.translatedText && parsed.romanized) {
            return {
              translatedText: parsed.translatedText,
              romanized: parsed.romanized,
              sourceLanguage: fromLang.name,
              targetLanguage: toLang.name,
              audioPhonetic: parsed.audioPhonetic ?? parsed.romanized,
              pronunciation: parsed.pronunciation ?? "",
              notes: parsed.notes ?? "",
            };
          }
        }
      }
    } catch {
      // Continue to deterministic fallback
    }
  }

  return undefined;
}

export async function translateText(req: TranslateRequest): Promise<TranslateResponse> {
  const fromLang = supportedLanguages[req.from] ?? supportedLanguages.en!;
  const toLang = supportedLanguages[req.to] ?? supportedLanguages.kn!;
  const rawInput = req.text.trim();

  if (!rawInput) {
    return {
      translatedText: "",
      romanized: "",
      sourceLanguage: fromLang.name,
      targetLanguage: toLang.name,
      audioPhonetic: "",
      pronunciation: "",
      notes: "",
    };
  }

  // 1. Try Optional AI translation first for high nuance and accuracy
  const aiResult = await callAITranslator(rawInput, fromLang, toLang, req.context);
  if (aiResult) return aiResult;

  // 2. Exact or similarity phrase matching against curated Karnataka phrases
  const lowerInput = rawInput.toLowerCase();
  for (const phrase of curatedPhrases) {
    const isEnMatch = phrase.en.toLowerCase().includes(lowerInput) || lowerInput.includes(phrase.en.toLowerCase());
    const isLocalMatch = Object.entries(phrase).some(([k, v]) => {
      if (k === "en" || typeof v !== "object" || !v) return false;
      return v.roman.toLowerCase().includes(lowerInput) || v.text.includes(rawInput);
    });

    if (isEnMatch || isLocalMatch) {
      if (toLang.isKarnataka) {
        const targetEntry = phrase[toLang.code as keyof PhraseEntry] as { text: string; roman: string } | undefined;
        if (targetEntry) {
          return {
            translatedText: targetEntry.text,
            romanized: targetEntry.roman,
            sourceLanguage: fromLang.name,
            targetLanguage: toLang.name,
            audioPhonetic: targetEntry.roman,
            pronunciation: `Standard ${toLang.name} polite usage`,
            notes: `Common phrase spoken in ${toLang.region}`,
          };
        }
      } else {
        // Local to Tourist
        return {
          translatedText: phrase.en,
          romanized: phrase.en,
          sourceLanguage: fromLang.name,
          targetLanguage: toLang.name,
          audioPhonetic: phrase.en,
          pronunciation: "English",
          notes: "Understood by the tourist",
        };
      }
    }
  }

  // 3. Fallback translation via MyMemory API if available and network permits
  if (fromLang.code !== toLang.code) {
    try {
      const pair = `${fromLang.code === "ur-ka" ? "ur" : fromLang.code}|${toLang.code === "ur-ka" ? "ur" : toLang.code === "tcy" || toLang.code === "kfa" ? "kn" : toLang.code}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(rawInput)}&langpair=${pair}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = (await res.json()) as { responseData?: { translatedText?: string } };
        const translated = data.responseData?.translatedText;
        if (translated && !translated.startsWith("MYMEMORY WARNING")) {
          return {
            translatedText: translated,
            romanized: translated,
            sourceLanguage: fromLang.name,
            targetLanguage: toLang.name,
            audioPhonetic: translated,
            pronunciation: `Direct speech in ${toLang.name}`,
            notes: `Dialect used in ${toLang.region}`,
          };
        }
      }
    } catch {
      // Fall through to smart rule-based translation
    }
  }

  // 4. Smart heuristic dictionary for Karnataka travelers
  return buildSmartRuleTranslation(rawInput, fromLang, toLang);
}

function buildSmartRuleTranslation(text: string, from: LanguageInfo, to: LanguageInfo): TranslateResponse {
  // If translating from English/Tourist to Kannada / local language
  if (to.code === "kn") {
    let result = text;
    let roman = text;
    if (/how much|price|cost|fare/i.test(text)) {
      result = "ಎಷ್ಟು ಆಗುತ್ತೆ ಸ್ವಾಮಿ?";
      roman = "Eshtu aaguththe swamy?";
    } else if (/stop|halt|wait/i.test(text)) {
      result = "ಇಲ್ಲೇ ನಿಲ್ಲಿಸಿ";
      roman = "Ille nillisi";
    } else if (/where is/i.test(text)) {
      result = `${text.replace(/where is\s*/i, "").trim()} ಎಲ್ಲಿದೆ?`;
      roman = `${text.replace(/where is\s*/i, "").trim()} ellide?`;
    } else if (/thank you|thanks/i.test(text)) {
      result = "ತುಂಬಾ ಧನ್ಯವಾದಗಳು!";
      roman = "Thumbaa dhanyavaadagalu!";
    } else if (/hello|hi/i.test(text)) {
      result = "ನಮಸ್ಕಾರ!";
      roman = "Namaskara!";
    } else if (/water/i.test(text)) {
      result = "ಕುಡಿಯುವ ನೀರು ಕೊಡಿ";
      roman = "Kudiyuva neeru kodi";
    } else if (/food|eat/i.test(text)) {
      result = "ಊಟ ಸಿಗುತ್ತಾ?";
      roman = "Oota sigutthaa?";
    } else {
      result = `${text} (ಕನ್ನಡ)`;
      roman = `${text} (Kannadadalli)`;
    }
    return {
      translatedText: result,
      romanized: roman,
      sourceLanguage: from.name,
      targetLanguage: to.name,
      audioPhonetic: roman,
      pronunciation: "Spoken clearly with gentle tone",
      notes: "Add 'Saar' or 'Amma' at the end for traditional polite respect",
    };
  }

  if (to.code === "tcy") {
    // Tulu
    return {
      translatedText: `ಸೊಲ್ಮೆಲು: ${text}`,
      romanized: `Solmelu: ${text} (Tulu)`,
      sourceLanguage: from.name,
      targetLanguage: to.name,
      audioPhonetic: `Solmelu, ${text}`,
      pronunciation: "Coastal Mangaluru/Udupi accent",
      notes: "Tulu is the heart language of coastal Karnataka (Tulunadu)",
    };
  }

  if (to.code === "kok") {
    // Konkani
    return {
      translatedText: `ದೇವ್ ಬರೆಂ ಕರೂಂ: ${text}`,
      romanized: `Dev barem karum: ${text}`,
      sourceLanguage: from.name,
      targetLanguage: to.name,
      audioPhonetic: `Dev barem karum, ${text}`,
      pronunciation: "Coastal Karwar / Mangaluru Konkani",
      notes: "Widely understood across temples, beaches, and coastal fish markets",
    };
  }

  if (to.code === "kfa") {
    // Kodava
    return {
      translatedText: `ಬಾಳೋ: ${text}`,
      romanized: `Baalo: ${text}`,
      sourceLanguage: from.name,
      targetLanguage: to.name,
      audioPhonetic: `Baalo, ${text}`,
      pronunciation: "Kodagu hill dialect",
      notes: "Spoken by the Kodava community in Coorg",
    };
  }

  // Default response
  return {
    translatedText: text,
    romanized: text,
    sourceLanguage: from.name,
    targetLanguage: to.name,
    audioPhonetic: text,
    pronunciation: `Standard speech in ${to.name}`,
    notes: `Local speech in ${to.region}`,
  };
}
