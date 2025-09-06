import { useEffect, useState } from "react";
import { supportedLangs, getLang, setLang, t, type Lang } from "@/lib/i18n";

export default function Header() {
  const [lang, setLangState] = useState<Lang>(getLang());
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail) setLangState(detail);
    };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("krishiai:lang", onLang as EventListener);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("krishiai:lang", onLang as EventListener);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-gradient-to-b from-background/80 to-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-md px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21c4.97 0 9-4.03 9-9 0-1.42-.33-2.77-.92-3.97-.22-.45-.82-.51-1.16-.17-2.76 2.76-4.92 2.55-6.92 1.4-2.02-1.16-4.14-1.14-6.93 1.4-.34.33-.93.28-1.15-.17C3.33 9.23 3 10.58 3 12c0 4.97 4.03 9 9 9Z"
                fill="currentColor"
              />
              <path
                d="M7 12s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3Z"
                fill="currentColor"
                opacity=".45"
              />
            </svg>
          </span>
          <span className="font-extrabold text-lg tracking-tight">
            {t("app_name")}
          </span>
        </a>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${online ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}`}
          >
            {online ? t("online") : t("offline")}
          </span>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
          >
            {supportedLangs.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
