# Ursus Capital Management — HALO Fund Dashboard

Public portfolio dashboard for the Ursus Capital HALO Fund simulation.

**Strategy:** Heavy Assets, Low Obsolescence (HALO)  
**Structure:** Tiered duration — Strategic Core (1–3yr) / Thematic (3–12mo) / Tactical (1d–3mo)

---

## Updating the Portfolio

Edit `public/data.json` to update positions and NAV. The structure is:

```json
{
  "config": {
    "startingNav": 30000000,
    "inceptionDate": "2026-04-01"
  },
  "navHistory": [
    { "date": "2026-04-01", "nav": 30000000 },
    { "date": "2026-04-07", "nav": 30150000 }
  ],
  "positions": [
    {
      "ticker": "ENB",
      "name": "Enbridge Inc",
      "tier": "Tier 1",
      "sector": "Energy Infrastructure",
      "entryDate": "2026-04-15",
      "entryPrice": 42.50,
      "currentPrice": 43.20,
      "shares": 50000,
      "stopLoss": 34.00,
      "target": 55.00,
      "macroLens": "Inflation Regime",
      "status": "active",
      "notes": "Strategic core — midstream infrastructure play"
    }
  ]
}
```

### Position fields:
- `ticker` — Stock symbol (required)
- `name` — Company name
- `tier` — "Tier 1", "Tier 2", or "Tier 3"
- `sector` — HALO sector: "Energy Infrastructure", "Transport & Logistics", "Industrial Mfg", "Mining & Resources", "Essential Services", "Real Assets", "Other"
- `entryDate` — Date entered (YYYY-MM-DD)
- `entryPrice` — Price at entry (required)
- `currentPrice` — Current market price (required — update weekly)
- `shares` — Number of shares (required)
- `stopLoss` — Stop-loss price level
- `target` — Target price
- `macroLens` — "Dollar Depreciation", "Inflation Regime", "Geopolitical Risk", "Multiple Lenses"
- `status` — "active" or "closed"
- `notes` — Any notes

### Weekly update workflow:
1. After Friday IC, get position prices from IBKR
2. Update `currentPrice` for each active position in `data.json`
3. Add a new NAV entry to `navHistory`
4. Commit and push — site updates automatically

---

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Framework: Vite. No other config needed.
4. Deploy. Your site is live.

Future updates: edit `data.json`, commit, push. Vercel auto-redeploys.

---

*Ursus Capital Management — Simulation Environment — Not Investment Advice*
