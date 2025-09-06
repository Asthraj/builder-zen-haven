import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export type Recommendation = {
  crop: string;
  yieldTPerHa: number;
  profitPerHa: number;
  sustainability: number; // 0..100
  reason: string;
};

export default function RecommendationCard({
  rec,
  className,
}: {
  rec: Recommendation;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{rec.crop}</h3>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          {t("crop_suggestion")}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {rec.reason}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <Stat label={t("yield")} value={`${rec.yieldTPerHa.toFixed(1)} t/ha`} />
        <Stat
          label={t("profit")}
          value={`₹${Math.round(rec.profitPerHa).toLocaleString()}/ha`}
        />
        <div className="rounded-lg bg-secondary p-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {t("sustainability")}
          </div>
          <div className="mt-1 flex items-center justify-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded bg-muted">
              <div
                className="h-2 bg-primary"
                style={{ width: `${rec.sustainability}%` }}
              />
            </div>
            <span className="text-sm font-semibold">{rec.sustainability}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
