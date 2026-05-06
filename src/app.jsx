import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ── DESIGN TOKENS ── */
const C = {
  navy: "#1B2A4A", navyLight: "#243558",
  gold: "#C5A55A", goldMuted: "rgba(197,165,90,0.15)", goldBorder: "rgba(197,165,90,0.3)",
  dark: "#0D1117", card: "#131920", border: "rgba(197,165,90,0.12)",
  text: "#E8E6E1", textMuted: "#8B8D8F", textDim: "#555759",
  green: "#4ADE80", greenDim: "rgba(74,222,128,0.15)",
  red: "#F87171", redDim: "rgba(248,113,113,0.15)",
  tier1: "#C5A55A", tier2: "#6BB8E0", tier3: "#A78BFA", cash: "#3F4247",
};
const TIERS = { "Tier 1": C.tier1, "Tier 2": C.tier2, "Tier 3": C.tier3, Cash: C.cash };

/* ── FORMATTERS ── */
const fmt = (n) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};
const pct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const pctPlain = (n) => `${n.toFixed(1)}%`;

/* ── MAIN ── */
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load portfolio data");
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const calc = useMemo(() => {
    if (!data) return null;
    const { config, navHistory, positions } = data;
    const active = positions.filter((p) => p.status === "active");
    const totalInvested = active.reduce((s, p) => s + p.shares * p.currentPrice, 0);
    const totalCost = active.reduce((s, p) => s + p.shares * p.entryPrice, 0);
    const totalPnl = totalInvested - totalCost;
    const latestNav = navHistory.length > 0 ? navHistory[navHistory.length - 1].nav : config.startingNav;
    const cashValue = latestNav - totalInvested;
    const cashPct = latestNav > 0 ? (cashValue / latestNav) * 100 : 100;

    const tierAlloc = { "Tier 1": 0, "Tier 2": 0, "Tier 3": 0 };
    active.forEach((p) => { tierAlloc[p.tier] += (p.shares * p.currentPrice) / latestNav * 100; });

    const tierPieData = [
      ...Object.entries(tierAlloc).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: +value.toFixed(1) })),
      { name: "Cash", value: +cashPct.toFixed(1) },
    ];

    const sectorAlloc = {};
    active.forEach((p) => {
      const key = p.sector || "Other";
      sectorAlloc[key] = (sectorAlloc[key] || 0) + (p.shares * p.currentPrice) / latestNav * 100;
    });

    const peakNav = navHistory.length > 0 ? Math.max(...navHistory.map((h) => h.nav)) : config.startingNav;
    const drawdown = ((latestNav - peakNav) / peakNav) * 100;
    const grossExposure = latestNav > 0 ? (totalInvested / latestNav) * 100 : 0;
    const ytdReturn = ((latestNav - config.startingNav) / config.startingNav) * 100;

    return {
      active, totalPnl, latestNav, cashPct, tierAlloc, tierPieData,
      sectorAlloc, drawdown, grossExposure, ytdReturn,
      positionCount: active.length, config, navHistory,
    };
  }, [data]);

  if (loading) return (
    <div style={{ background: C.dark, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.gold, letterSpacing: 2, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>LOADING PORTFOLIO...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: C.dark, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.red, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
    </div>
  );

  const {
    active, totalPnl, latestNav, cashPct, tierAlloc, tierPieData,
    sectorAlloc, drawdown, grossExposure, ytdReturn,
    positionCount, config, navHistory,
  } = calc;

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
    if (value < 3) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill={C.dark} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 600 }}>{value}%</text>;
  };

  const s = {
    page: { minHeight: "100vh", background: C.dark, color: C.text, fontFamily: "'DM Sans', sans-serif" },
    header: { padding: "28px 32px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
    logoArea: { display: "flex", alignItems: "center", gap: 14 },
    logoMark: { width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.gold, letterSpacing: 1 },
    grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "20px 32px" },
    metric: { background: C.card, borderRadius: 10, padding: "16px 18px", border: `1px solid ${C.border}` },
    metricLabel: { fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px", fontWeight: 500 },
    metricValue: { fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: -0.5 },
    section: { padding: "0 32px 24px" },
    sectionTitle: { fontSize: 13, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1.5, margin: "24px 0 14px", fontWeight: 500 },
    card: { background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" },
    twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 32px 24px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "10px 14px", color: C.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${C.border}`, fontWeight: 500 },
    td: { padding: "10px 14px", borderBottom: `1px solid ${C.border}`, color: C.text },
    tierBadge: (tier) => ({
      display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      background: tier === "Tier 1" ? C.goldMuted : tier === "Tier 2" ? "rgba(107,184,224,0.15)" : "rgba(167,139,250,0.15)",
      color: TIERS[tier] || C.textMuted,
    }),
    footer: { padding: "20px 32px", borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 11, color: C.textDim, letterSpacing: 0.3 },
  };

  const lastUpdated = navHistory.length > 0 ? navHistory[navHistory.length - 1].date : config.inceptionDate;

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logoArea}>
          <div style={s.logoMark}>UC</div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: C.text, letterSpacing: 0.5, margin: 0 }}>Ursus Capital Management</p>
            <p style={{ fontSize: 12, color: C.gold, letterSpacing: 2, textTransform: "uppercase", margin: "2px 0 0", fontWeight: 500 }}>HALO Fund</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: C.textDim }}>Last updated: {lastUpdated}</p>
      </div>

      {/* KPIs */}
      <div style={s.grid}>
        <div style={s.metric}>
          <p style={s.metricLabel}>Net Asset Value</p>
          <p style={{ ...s.metricValue, color: C.text }}>{fmt(latestNav)}</p>
        </div>
        <div style={s.metric}>
          <p style={s.metricLabel}>YTD Return</p>
          <p style={{ ...s.metricValue, color: ytdReturn >= 0 ? C.green : C.red }}>{pct(ytdReturn)}</p>
        </div>
        <div style={s.metric}>
          <p style={s.metricLabel}>Positions</p>
          <p style={{ ...s.metricValue, color: C.text }}>{positionCount}</p>
        </div>
        <div style={s.metric}>
          <p style={s.metricLabel}>Unrealized P&L</p>
          <p style={{ ...s.metricValue, color: totalPnl >= 0 ? C.green : C.red }}>{totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)}</p>
        </div>
      </div>

      {/* TIER ALLOCATION + NAV CHART */}
      <div style={s.twoCol}>
        <div style={s.card}>
          <div style={{ padding: "16px 20px 0" }}>
            <p style={{ ...s.sectionTitle, margin: "0 0 4px" }}>Tier Allocation</p>
          </div>
          <div style={{ padding: "12px 20px 20px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 180, height: 180, flexShrink: 0 }}>
              {tierPieData.some((d) => d.name !== "Cash" && d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tierPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value"
                      label={renderPieLabel} labelLine={false} stroke={C.card} strokeWidth={2}>
                      {tierPieData.map((e) => <Cell key={e.name} fill={TIERS[e.name] || C.textDim} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}`, borderRadius: "50%" }}>
                  <span style={{ fontSize: 12, color: C.textDim }}>100% Cash</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              {[
                { label: "Tier 1 — Strategic Core", color: C.tier1, value: tierAlloc["Tier 1"], range: "40–60%" },
                { label: "Tier 2 — Thematic", color: C.tier2, value: tierAlloc["Tier 2"], range: "25–35%" },
                { label: "Tier 3 — Tactical", color: C.tier3, value: tierAlloc["Tier 3"], range: "10–20%" },
                { label: "Cash", color: C.cash, value: cashPct, range: "≥10%" },
              ].map((t) => (
                <div key={t.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color }} />
                      <span style={{ fontSize: 12, color: C.text }}>{t.label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{pctPlain(t.value)}</span>
                  </div>
                  <div style={{ height: 4, background: C.dark, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(t.value, 100)}%`, background: t.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 10, color: C.textDim }}>Target: {t.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={{ padding: "16px 20px 0" }}>
            <p style={{ ...s.sectionTitle, margin: "0 0 4px" }}>NAV Over Time</p>
          </div>
          <div style={{ padding: "12px 20px 20px", height: 220 }}>
            {navHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={navHistory}>
                  <defs>
                    <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.gold} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C.gold} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textDim }} tickLine={false} axisLine={{ stroke: C.border }} />
                  <YAxis tick={{ fontSize: 10, fill: C.textDim }} tickLine={false} axisLine={{ stroke: C.border }}
                    tickFormatter={(v) => `$${(v / 1e6).toFixed(0)}M`} domain={["dataMin - 500000", "dataMax + 500000"]} />
                  <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }}
                    formatter={(v) => [fmt(v), "NAV"]} labelStyle={{ color: C.textMuted }} />
                  <Area type="monotone" dataKey="nav" stroke={C.gold} strokeWidth={2} fill="url(#navGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px dashed ${C.border}`, borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 4px" }}>NAV chart requires 2+ data points</p>
                <p style={{ fontSize: 11, color: C.textDim, margin: 0 }}>Add weekly NAV entries to data.json</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RISK DASHBOARD */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Risk Dashboard</p>
        <div style={{ ...s.card, padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
            {[
              { label: "Gross Exposure", value: pctPlain(grossExposure), limit: "150% max", ok: grossExposure <= 150 },
              { label: "Cash Reserve", value: pctPlain(cashPct), limit: "≥10% min", ok: cashPct >= 10 },
              { label: "Drawdown", value: pct(drawdown), limit: "L1: 5% / L2: 10% / L3: 15%", ok: drawdown > -5 },
              { label: "Largest Position", value: active.length > 0 ? pctPlain(Math.max(...active.map((p) => (p.shares * p.currentPrice / latestNav) * 100))) : "—", limit: "T1: 15% / T2: 10% / T3: 5%", ok: true },
              { label: "Tier Balance", value: tierAlloc["Tier 3"] > tierAlloc["Tier 1"] && positionCount > 0 ? "WARNING" : "OK", limit: "T3 must not exceed T1", ok: !(tierAlloc["Tier 3"] > tierAlloc["Tier 1"] && positionCount > 0) },
            ].map((r) => (
              <div key={r.label}>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>{r.label}</p>
                <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px", color: r.ok ? C.text : C.red }}>{r.value}</p>
                <p style={{ fontSize: 10, color: C.textDim, margin: 0 }}>{r.limit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POSITIONS TABLE */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Active Positions</p>
        <div style={s.card}>
          {active.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Ticker</th><th style={s.th}>Name</th><th style={s.th}>Tier</th>
                    <th style={s.th}>Sector</th><th style={{ ...s.th, textAlign: "right" }}>Allocation</th>
                    <th style={{ ...s.th, textAlign: "right" }}>Entry</th><th style={{ ...s.th, textAlign: "right" }}>Current</th>
                    <th style={{ ...s.th, textAlign: "right" }}>P&L</th><th style={{ ...s.th, textAlign: "right" }}>Return</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((p, i) => {
                    const pnl = (p.currentPrice - p.entryPrice) * p.shares;
                    const ret = ((p.currentPrice - p.entryPrice) / p.entryPrice) * 100;
                    const alloc = (p.shares * p.currentPrice / latestNav) * 100;
                    return (
                      <tr key={i}>
                        <td style={{ ...s.td, fontWeight: 600, color: C.gold }}>{p.ticker}</td>
                        <td style={s.td}>{p.name || "—"}</td>
                        <td style={s.td}><span style={s.tierBadge(p.tier)}>{p.tier}</span></td>
                        <td style={{ ...s.td, fontSize: 12, color: C.textMuted }}>{p.sector}</td>
                        <td style={{ ...s.td, textAlign: "right" }}>{pctPlain(alloc)}</td>
                        <td style={{ ...s.td, textAlign: "right" }}>${p.entryPrice.toFixed(2)}</td>
                        <td style={{ ...s.td, textAlign: "right" }}>${p.currentPrice.toFixed(2)}</td>
                        <td style={{ ...s.td, textAlign: "right", color: pnl >= 0 ? C.green : C.red }}>{pnl >= 0 ? "+" : ""}{fmt(pnl)}</td>
                        <td style={{ ...s.td, textAlign: "right" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: ret >= 0 ? C.greenDim : C.redDim, color: ret >= 0 ? C.green : C.red }}>{pct(ret)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ color: C.textDim, fontSize: 14, margin: "0 0 6px" }}>No active positions</p>
              <p style={{ color: C.textDim, fontSize: 12, margin: 0 }}>Awaiting first capital deployment</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTOR BREAKDOWN */}
      {Object.keys(sectorAlloc).length > 0 && (
        <div style={s.section}>
          <p style={s.sectionTitle}>HALO Sector Exposure</p>
          <div style={{ ...s.card, padding: "16px 20px" }}>
            {Object.entries(sectorAlloc).sort((a, b) => b[1] - a[1]).map(([sector, alloc]) => (
              <div key={sector} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: C.text }}>{sector}</span>
                  <span style={{ fontSize: 12, color: alloc > 30 ? C.red : C.textMuted, fontWeight: 500 }}>{pctPlain(alloc)}{alloc > 30 ? " ⚠" : ""}</span>
                </div>
                <div style={{ height: 6, background: C.dark, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(alloc, 100)}%`, background: alloc > 30 ? C.red : C.gold, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={s.footer}>
        <p style={{ margin: 0 }}>Ursus Capital Management — HALO Fund — Simulation Environment — Not Investment Advice</p>
        <p style={{ margin: "4px 0 0" }}>Heavy Assets, Low Obsolescence — Tiered Duration Strategy</p>
      </div>
    </div>
  );
}
