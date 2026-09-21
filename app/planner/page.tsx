"use client";

import Link from "next/link";
import { useState } from "react";

type Leg = {
  id: string;
  kind: "CE" | "PE";
  strike: number;
  premium: number;
  qty: number;
};

const newLeg = (spot: number, kind: "CE" | "PE" = "CE"): Leg => ({
  id: Math.random().toString(36).slice(2),
  kind,
  strike: spot,
  premium: 100,
  qty: 1,
});

export default function Planner() {
  const [spot, setSpot] = useState(23400);
  const [legs, setLegs] = useState<Leg[]>([
    { id: "1", kind: "CE", strike: 23500, premium: 150, qty: 2 },
    { id: "2", kind: "PE", strike: 23900, premium: 400, qty: 1 },
  ]);

  const payoffAt = (expirySpot: number) =>
    legs.reduce((sum, leg) => {
      const intrinsic =
        leg.kind === "CE"
          ? Math.max(0, expirySpot - leg.strike)
          : Math.max(0, leg.strike - expirySpot);
      return sum + (intrinsic - leg.premium) * leg.qty;
    }, 0);

  const points = 80;
  const lo = spot * 0.92;
  const hi = spot * 1.08;
  const step = (hi - lo) / points;

  const curve = Array.from({ length: points + 1 }, (_, i) => {
    const s = lo + i * step;
    return { s, pnl: payoffAt(s) };
  });

  const investment = legs.reduce(
    (s, l) => s + (l.qty > 0 ? l.premium * l.qty : 0),
    0
  );
  const maxProfit = Math.max(...curve.map((c) => c.pnl));
  const maxLoss = Math.min(...curve.map((c) => c.pnl));
  const breakevens = curve
    .map((c, i) => {
      if (i === 0) return null;
      const prev = curve[i - 1];
      if (prev.pnl === 0) return prev.s.toFixed(0);
      if (prev.pnl * c.pnl < 0) return ((prev.s + c.s) / 2).toFixed(0);
      return null;
    })
    .filter(Boolean) as string[];

  const updateLeg = (id: string, patch: Partial<Leg>) =>
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Trade Planner</h1>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to dashboard
          </Link>
        </div>

        <p className="text-xs text-gray-500 mb-6">
          Simulate hedge payoff at expiry. Based on Transcript 1 logic.
        </p>

        <div className="mb-6">
          <label className="block text-xs text-gray-400 uppercase mb-1">
            Current Spot
          </label>
          <input
            type="number"
            value={spot}
            onChange={(e) => setSpot(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-40"
          />
        </div>

        <h2 className="text-xl font-semibold mb-3">Legs</h2>
        <div className="space-y-2 mb-4">
          {legs.map((leg) => (
            <div
              key={leg.id}
              className="flex flex-wrap gap-2 items-center border border-gray-800 rounded p-2"
            >
              <select
                value={leg.kind}
                onChange={(e) =>
                  updateLeg(leg.id, { kind: e.target.value as "CE" | "PE" })
                }
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1"
              >
                <option value="CE">CE</option>
                <option value="PE">PE</option>
              </select>
              <input
                type="number"
                placeholder="Strike"
                value={leg.strike}
                onChange={(e) =>
                  updateLeg(leg.id, { strike: Number(e.target.value) })
                }
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 w-28"
              />
              <input
                type="number"
                placeholder="Premium"
                value={leg.premium}
                onChange={(e) =>
                  updateLeg(leg.id, { premium: Number(e.target.value) })
                }
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 w-28"
              />
              <input
                type="number"
                placeholder="Qty"
                value={leg.qty}
                onChange={(e) =>
                  updateLeg(leg.id, { qty: Number(e.target.value) })
                }
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 w-20"
              />
              <button
                onClick={() =>
                  setLegs((prev) => prev.filter((l) => l.id !== leg.id))
                }
                className="text-red-400 hover:text-red-300 text-sm ml-auto"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setLegs((prev) => [...prev, newLeg(spot, "CE")])}
            className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-sm"
          >
            + CE leg
          </button>
          <button
            onClick={() => setLegs((prev) => [...prev, newLeg(spot, "PE")])}
            className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-1 text-sm"
          >
            + PE leg
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Metric label="Investment" value={`Rs ${investment.toFixed(0)}`} />
          <Metric
            label="Max Profit"
            value={`Rs ${maxProfit.toFixed(0)}`}
            color="text-green-400"
          />
          <Metric
            label="Max Loss"
            value={`Rs ${maxLoss.toFixed(0)}`}
            color="text-red-400"
          />
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Breakeven(s): {breakevens.length ? breakevens.join(", ") : "none"}
        </p>

        <div className="border border-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Payoff at Expiry</h3>
          <PayoffChart curve={curve} spot={spot} />
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  color = "",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function PayoffChart({
  curve,
  spot,
}: {
  curve: { s: number; pnl: number }[];
  spot: number;
}) {
  const w = 800;
  const h = 260;
  const xs = curve.map((c) => c.s);
  const ys = curve.map((c) => c.pnl);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const px = (x: number) => ((x - minX) / rangeX) * w;
  const py = (y: number) => h - ((y - minY) / rangeY) * h;

  const path = ys
    .map(
      (y, i) =>
        `${i === 0 ? "M" : "L"}${px(xs[i]).toFixed(1)},${py(y).toFixed(1)}`
    )
    .join(" ");

  const zeroY = py(0);
  const spotX = px(spot);

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-64">
        <line
          x1="0"
          y1={zeroY}
          x2={w}
          y2={zeroY}
          stroke="#444"
          strokeDasharray="4 4"
        />
        <line
          x1={spotX}
          y1="0"
          x2={spotX}
          y2={h}
          stroke="#3498db"
          strokeDasharray="2 4"
          opacity="0.5"
        />
        <path d={path} stroke="#f1c40f" fill="none" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-xs mt-2">
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ backgroundColor: "#f1c40f" }}
          />
          <span className="text-gray-400">PnL at expiry</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ backgroundColor: "#3498db" }}
          />
          <span className="text-gray-400">Spot = {spot}</span>
        </div>
      </div>
    </div>
  );
}