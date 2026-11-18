import { Chart, type ChartSpec } from "ztd-charts";
import { validateSpec } from "ztd-charts/spec";

export default function ChartView({ spec, darkMode }: { spec: Record<string, unknown>; darkMode: boolean }) {
  const data = spec.data;
  const inline = Array.isArray(data) || (data && typeof data === "object" && !("url" in data)
    && (("values" in data && Array.isArray(data.values)) || ("csv" in data && typeof data.csv === "string")));
  if (!inline) throw new Error("Chart data must be inline");
  const result = validateSpec(spec, { lang: "ko" });
  if (result.errors.length) throw new Error("Invalid chart spec");
  const options = spec.options as { locale?: unknown } | undefined;
  return <Chart spec={spec as unknown as ChartSpec} theme={darkMode ? "dark" : "light"}
    locale={typeof options?.locale === "string" ? options.locale : "ko-KR"} />;
}
