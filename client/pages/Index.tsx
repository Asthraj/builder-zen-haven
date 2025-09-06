import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getLang, setLang as setLangGlobal, t, type Lang } from "@/lib/i18n";
import RecommendationCard, { type Recommendation } from "@/components/app/RecommendationCard";

// Simple heuristic engine to simulate model output
function recommend(input: FarmInput): Recommendation[] {
  const { soil, rainfall, temp, ph, irrigation, previousCrop, budget } = input;
  const crops = [
    {
      crop: "Wheat",
      baseYield: 3.2,
      needs: { rainfall: [300, 900], temp: [10, 25], ph: [6, 7.5], soils: ["loam", "clay"] },
      price: 22000,
    },
    {
      crop: "Rice",
      baseYield: 4.5,
      needs: { rainfall: [800, 2000], temp: [20, 35], ph: [5.5, 7.0], soils: ["clay", "silty"] },
      price: 19000,
    },
    {
      crop: "Maize",
      baseYield: 5.0,
      needs: { rainfall: [400, 1200], temp: [18, 32], ph: [5.8, 7.2], soils: ["loam", "sandy"] },
      price: 17500,
    },
    {
      crop: "Chickpea",
      baseYield: 1.8,
      needs: { rainfall: [250, 1000], temp: [10, 30], ph: [6.0, 8.0], soils: ["sandy", "loam"] },
      price: 55000,
    },
    {
      crop: "Mustard",
      baseYield: 1.4,
      needs: { rainfall: [300, 900], temp: [10, 25], ph: [6.0, 7.5], soils: ["loam", "sandy"] },
      price: 45000,
    },
  ];

  function scoreRange(val: number, [min, max]: [number, number]) {
    if (val < min) return Math.max(0, 1 - (min - val) / (min || 1));
    if (val > max) return Math.max(0, 1 - (val - max) / (max || 1));
    return 1;
  }

  return crops
    .map((c) => {
      const sRain = scoreRange(rainfall, c.needs.rainfall as [number, number]);
      const sTemp = scoreRange(temp, c.needs.temp as [number, number]);
      const sPh = scoreRange(ph, c.needs.ph as [number, number]);
      const sSoil = c.needs.soils.includes(soil) ? 1 : 0.6;
      const sIrr = irrigation ? 1 : c.crop === "Rice" ? 0.6 : 0.9;
      const fit = 0.35 * sRain + 0.25 * sTemp + 0.2 * sPh + 0.1 * sSoil + 0.1 * sIrr;
      const yieldAdj = c.baseYield * (0.7 + 0.6 * fit);
      const profitPerHa = yieldAdj * c.price * 0.001 * (budget > 0 ? Math.min(1.1, 0.9 + budget / 100000) : 1);
      const rotationBonus = previousCrop && previousCrop !== c.crop ? 1.08 : 1;
      const sustainability = Math.round(60 + 40 * (fit * (irrigation ? 0.95 : 1) * (c.crop === "Rice" ? 0.9 : 1)));
      const reason = `${soil} soil, ${rainfall}mm rain, ${temp}°C, pH ${ph.toFixed(1)} → good fit`;
      return {
        crop: c.crop,
        yieldTPerHa: Number(yieldAdj.toFixed(2)) * rotationBonus,
        profitPerHa: profitPerHa * rotationBonus,
        sustainability: Math.max(0, Math.min(100, sustainability)),
        reason,
      } as Recommendation;
    })
    .sort((a, b) => b.profitPerHa - a.profitPerHa)
    .slice(0, 3);
}

// Types
type FarmInput = {
  soil: "loam" | "clay" | "sandy" | "silty";
  rainfall: number;
  temp: number;
  ph: number;
  acreage: number;
  irrigation: boolean;
  budget: number;
  previousCrop: string;
};

type Msg = { role: "user" | "ai"; text: string };

export default function Index() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [input, setInput] = useState("\");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [form, setForm] = useState<FarmInput>({
    soil: "loam",
    rainfall: 700,
    temp: 26,
    ph: 6.8,
    acreage: 1,
    irrigation: true,
    budget: 40000,
    previousCrop: "Wheat",
  });

  const recs = useMemo(() => recommend(form), [form]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail) setLang(detail);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("krishiai:lang", onLang as EventListener);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const saved = localStorage.getItem("krishiai_state");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.form) setForm(s.form);
        if (s.messages) setMessages(s.messages);
      } catch {}
    }
    return () => {
      window.removeEventListener("krishiai:lang", onLang as EventListener);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("krishiai_state", JSON.stringify({ form, messages }));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [form, messages]);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const langCfg = lang === "hi" ? "hi-IN" : "en-IN";
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(langCfg));
    if (voice) utter.voice = voice;
    utter.lang = langCfg;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }

  function aiRespond(prompt: string) {
    // Very simple rule-based response
    const top = recs[0];
    const answer = lang === "hi"
      ? `आपके डाटा के अनुसार ${top.crop} उपयुक्त है। अनुमानित उत्पादन ${top.yieldTPerHa.toFixed(1)} टन/हे., मुनाफ़ा ₹${Math.round(top.profitPerHa).toLocaleString()} प्रति हेक्टेयर और सस्टेनेबिलिटी ${top.sustainability}% है।`
      : `Based on your data, ${top.crop} looks best. Estimated yield ${top.yieldTPerHa.toFixed(1)} t/ha, profit ₹${Math.round(top.profitPerHa).toLocaleString()} per ha, and sustainability ${top.sustainability}%.`;
    return answer + (imageUrl ? (lang === "hi" ? " आपने एक छवि भेजी है, हम पत्ती/मिट्टी स्वास्थ्य भी जाँचेंगे।" : " You shared an image; we'll also assess leaf/soil health.") : "");
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: Msg = { role: "user", text };
    const aiMsg: Msg = { role: "ai", text: aiRespond(text) };
    setMessages((m) => [...m, userMsg, aiMsg]);
    setInput("\");
    speak(aiMsg.text);
  }

  function startListen() {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || "";
      setInput((v) => (v ? v + " " : "") + text);
    };
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.start();
  }

  return (
    <main>
      <section className="bg-gradient-to-b from-emerald-50 to-transparent px-4 pt-6 pb-3">
        <div className="mx-auto max-w-screen-md">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t("tagline")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "hi"
              ? "एप्प ऑफलाइन में भी चलता है। अपनी भाषा चुनें, डाटा भरें या सवाल पूछें, और व्यक्तिगत फसल सलाह ���ाएँ।"
              : "Works offline. Choose language, enter data or ask questions, and get personalized crop advice."}
          </p>
          {imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border bg-card p-2">
              <img src={imageUrl} alt="preview" className="h-40 w-full rounded-lg object-cover" />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-screen-md px-4 grid gap-4">
        {/* Data form */}
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t("enter_data")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Select
              label={t("soil_type")}
              value={form.soil}
              onChange={(v) => setForm((f) => ({ ...f, soil: v as FarmInput["soil"] }))}
              options={[
                { label: "Loam", value: "loam" },
                { label: "Clay", value: "clay" },
                { label: "Sandy", value: "sandy" },
                { label: "Silty", value: "silty" },
              ]}
            />
            <Number label={t("rainfall")} value={form.rainfall} min={0} max={4000} onChange={(v) => setForm((f) => ({ ...f, rainfall: v }))} />
            <Number label={t("temperature")} value={form.temp} min={-5} max={55} onChange={(v) => setForm((f) => ({ ...f, temp: v }))} />
            <Number label={t("ph")} value={form.ph} step={0.1} min={3} max={10} onChange={(v) => setForm((f) => ({ ...f, ph: v }))} />
            <Number label={t("acreage")} value={form.acreage} step={0.1} min={0} max={1000} onChange={(v) => setForm((f) => ({ ...f, acreage: v }))} />
            <Number label={t("budget")} value={form.budget} step={500} min={0} max={500000} onChange={(v) => setForm((f) => ({ ...f, budget: v }))} />
            <Toggle
              label={t("irrigation")}
              value={form.irrigation}
              onChange={(v) => setForm((f) => ({ ...f, irrigation: v }))}
            />
            <Text label={t("previous_crop")} value={form.previousCrop} onChange={(v) => setForm((f) => ({ ...f, previousCrop: v }))} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{t("upload_image")}</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                className="block w-full cursor-pointer rounded-md border bg-background text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t("chat_with_ai")}</h2>
          <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border bg-background p-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {lang === "hi" ? "नमस्ते! खेती से जुड़े सवाल पूछें या नीचे बोलें/लिखें।" : "Hello! Ask any farming question or speak/type below."}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("mb-2 flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={startListen}
              className={cn("inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80", listening && "ring-2 ring-ring")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 12a7 7 0 1 1-14 0" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M12 19v3" stroke="currentColor" strokeWidth="2"/></svg>
              {listening ? t("stop") : t("speak")}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("enter_message")}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={send} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90">
              {t("send")}
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t("recommendations")}</h2>
          <div className="mt-3 grid gap-3">
            {recs.map((r, i) => (
              <RecommendationCard key={r.crop + i} rec={r} />
            ))}
          </div>
        </div>
      </section>

      <div className="h-8" />
    </main>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Number({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(true)}
          className={cn("flex-1 rounded-md border px-3 py-2 text-sm", value ? "bg-primary text-primary-foreground" : "bg-background")}
        >
          ✓
        </button>
        <button
          onClick={() => onChange(false)}
          className={cn("flex-1 rounded-md border px-3 py-2 text-sm", !value ? "bg-primary text-primary-foreground" : "bg-background")}
        >
          ✗
        </button>
      </div>
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}