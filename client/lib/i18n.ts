export type Lang = "en" | "hi";

const STORAGE_KEY = "krishiai_lang";

export const supportedLangs: { code: Lang; label: string; locale: string }[] = [
  { code: "en", label: "English", locale: "en-IN" },
  { code: "hi", label: "हिंदी", locale: "hi-IN" },
];

export function getLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored && supportedLangs.some((l) => l.code === stored)) return stored;
  const sys = navigator.language?.toLowerCase().startsWith("hi") ? "hi" : "en";
  return sys as Lang;
}

export function setLang(lang: Lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent("krishiai:lang", { detail: lang }));
}

export const t = (key: keyof typeof messages) => messages[key][getLang()];

export const messages = {
  app_name: { en: "KrishiAI", hi: "कृषिAI" },
  tagline: {
    en: "AI-powered crop advisor for higher income and sustainable farming",
    hi: "एआई आधारित फसल सलाहकार – आय बढ़ाएँ और टिकाऊ खेती करें",
  },
  enter_data: { en: "Enter Farm Data", hi: "खेत का डाटा भरें" },
  chat_with_ai: { en: "Ask KrishiAI", hi: "कृषिAI से पूछें" },
  speak: { en: "Speak", hi: "बोलें" },
  stop: { en: "Stop", hi: "रोकें" },
  send: { en: "Send", hi: "भेजें" },
  upload_image: { en: "Leaf/Soil Image", hi: "पत्ती/मिट्टी की फोटो" },
  recommendations: { en: "Recommendations", hi: "सुझाव" },
  offline: { en: "Offline", hi: "ऑफलाइन" },
  online: { en: "Online", hi: "ऑनलाइन" },
  sync: { en: "Sync", hi: "सिंक" },
  soil_type: { en: "Soil Type", hi: "मिट्टी का प्रकार" },
  rainfall: { en: "Rainfall (mm)", hi: "वर्षा (मिमी)" },
  temperature: { en: "Temperature (°C)", hi: "तापमान (°C)" },
  ph: { en: "Soil pH", hi: "मिट्टी का pH" },
  acreage: { en: "Acreage (ha)", hi: "क्षेत्रफल (हे.)" },
  irrigation: { en: "Irrigation", hi: "सिंचाई" },
  budget: { en: "Budget (₹/ha)", hi: "बजट (₹/हे.)" },
  previous_crop: { en: "Previous Crop", hi: "पिछली फसल" },
  yes: { en: "Yes", hi: "हाँ" },
  no: { en: "No", hi: "नहीं" },
  enter_message: { en: "Type your question…", hi: "अपना सवाल लिखें…" },
  yield: { en: "Yield", hi: "उत्पादन" },
  profit: { en: "Profit", hi: "मुनाफ़ा" },
  sustainability: { en: "Sustainability", hi: "सस्टेनेबिलिटी" },
  crop_suggestion: { en: "Crop suggestion", hi: "फसल सुझाव" },
};
