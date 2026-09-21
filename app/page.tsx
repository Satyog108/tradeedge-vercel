import Link from "next/link";
import { supabase, OISnapshot } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AVAILABLE_INDICES = ["NIFTY", "BANKNIFTY", "FINNIFTY"];

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ index?: string }>;
}) {
  const params = await searchParams;
  const selectedIndex = AVAILABLE_INDICES.includes(params.index ?? "")
    ? params.index!
    : "NIFTY";

  const { data: latestArr, error: err1 } = await supabase
    .from("oi_snapshots")
    .select("*")
    .eq("index_name", selectedIndex)
    .order("ts", { ascending: false })
    .limit(1);

  if (err1) console.error("QUERY 1 ERROR:", err1);

  const latest = (latestArr?.[0] as OISnapshot) ?? null;

  const { data: history, error: err2 } = await supabase
    .from("oi_snapshots")
    .select("ts, max_pain, spot")
    .eq("index_name", selectedIndex)
    .order("ts", { ascending: false })
    .limit(100);

  if (err2) console.error("QUERY 2 ERROR:", err2);

  const hist = (history ?? []).slice().reverse();

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">TradeEdge Dashboard</h1>
          <Link
            href={`/planner?index=${selectedIndex}`}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Open Trade Planner →
          </Link>
        </div>

        {/* Index selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {AVAILABLE_INDICES.map((idx) => (
            <Link
              key={idx}
              href={`/?index=${idx}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                idx === selectedIndex
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {idx}
            </Link>
          ))}
        </div>

        {!latest ? (
          <div className="border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400">
              No data yet for <b>{selectedIndex}</b>. Make sure your local
              Streamlit writer is running.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Hint: index name must match <code>index_name</code> in Supabase.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-6">
              Latest snapshot: {latest.ts} | {selectedIndex}
            </p>

            {/* Top metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Metric label="Spot" value={Number(latest.spot).toFixed(2)} />
              <Metric
                label="Max Pain"
                value={String(latest.max_pain ?? "-")}
              />
              <Metric
                label="PCR"
                value={Number(latest.pcr || 0).toFixed(3)}
              />
              <Metric
                label="Expiry Zone"
                value={`${latest.range_low ?? "-"} – ${latest.range_high ?? "-"}`}
              />
            </div>

            {/* Top walls */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-red-400">
                  Top Resistance (CALL OI)
                </h3>
                <div className="text-sm text-gray-300">
                  {latest.top_res_strike ?? "—"} —{" "}
                  {latest.top_res_oi?.toLocaleString() ?? "—"}
                </div>
              </div>
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-green-400">
                  Top Support (PUT OI)
                </h3>
                <div className="text-sm text-gray-300">
                  {latest.top_sup_strike ?? "—"} —{" "}
                  {latest.top_sup_oi?.toLocaleString() ?? "—"}
                </div>
              </div>
            </div>

            {/* History chart */}
            <div className="border border-gray-800 rounded-lg p-4 mb-8">
              <h2 className="text-xl font-semibold mb-3">
                Max Pain Migration ({hist.length} snapshots)
              </h2>
              {hist.length > 0 ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">
                    Latest spot:{" "}
                    {Number(hist[hist.length - 1]?.spot).toFixed(2)} | Latest
                    Max Pain: {hist[hist.length - 1]?.max_pain}
                  </p>
                  <MiniLineChart
                    xs={hist.map((h) => new Date(h.ts).getTime())}
                    series={[
                      {
                        color: "#e74c3c",
                        label: "Max Pain",
                        ys: hist.map((h) => Number(h.max_pain)),
                      },
                      {
                        color: "#3498db",
                        label: "Spot",
                        ys: hist.map((h) => Number(h.spot)),
                      },
                    ]}
                  />
                </>
              ) : (
                <p className="text-gray-500 text-sm">Loading history…</p>
              )}
            </div>

            {/* Delta chart */}
            {hist.length > 0 && (
              <div className="border border-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">
                  Max Pain − Spot (movement)
                </h2>
                <MiniLineChart
                  xs={hist.map((h) => new Date(h.ts).getTime())}
                  series={[
                    {
                      color: "#9b59b6",
                      label: "Max Pain − Spot",
                      ys: hist.map(
                        (h) => Number(h.max_pain) - Number(h.spot)
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </>
        )}

        <footer className="mt-12 text-xs text-gray-600 text-center">
          TradeEdge • Read-only dashboard • Data from Supabase
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function MiniLineChart({
  xs,
  series,
}: {
  xs: number[];
  series: { color: string; label: string; ys: number[] }[];
}) {
  if (!xs.length) return null;
  const w = 800;
  const h = 220;
  const allY = series.flatMap((s) => s.ys).filter((y) => !isNaN(y));
  if (!allY.length) return null;
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;
  const minX = xs[0];
  const maxX = xs[xs.length - 1];
  const rangeX = maxX - minX || 1;

  const path = (ys: number[]) =>
    ys
      .map((y, i) => {
        const px = ((xs[i] - minX) / rangeX) * w;
        const py = h - ((y - minY) / rangeY) * h;
        return `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
        {series.map((s, i) => (
          <path
            key={i}
            d={path(s.ys)}
            stroke={s.color}
            fill="none"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="flex gap-4 text-xs mt-2">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-gray-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}