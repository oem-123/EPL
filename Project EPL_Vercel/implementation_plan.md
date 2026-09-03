# EPL Fantasy Manager — Implementation Plan

## Overview

Duplicate the **Gridiron Fantasy Pro** NFL app into a new project at `/Users/omo/Documents/Project EPL`, then fully adapt it for the **English Premier League (EPL/FPL)** fantasy experience.

---

## User Review Required

> [!IMPORTANT]
> This is a full project duplication and adaptation. The new EPL app will live in a **separate folder** (`Project EPL`) alongside the NFL app (`Project FPL`). Both projects remain independent and runnable.

> [!IMPORTANT]
> The new EPL app will run on a **different port** (e.g. `http://localhost:3001`) so both apps can be used simultaneously.

---

## Key Differences: NFL → EPL

| Feature | NFL (Project FPL) | EPL (Project EPL) |
|---|---|---|
| **Positions** | QB, RB, WR, TE, K, DST | GK, DEF, MID, FWD |
| **Formation slots** | Dynamic (QB, FLEX, Bench, etc.) | 11 starters + bench (e.g. 4-4-2, 4-3-3, 3-5-2) |
| **Schedule structure** | 18 weeks, 1 game/week per team | 38 matchweeks, potential blank/double gameweeks |
| **Teams** | 32 NFL teams | 20 EPL clubs (2026/27 season) |
| **Players** | 500+ NFL players | 500+ EPL players (by fantasy popularity) |
| **Data source** | nflverse + Sleeper API | FPL API (api.fantasy.premierleague.com) |
| **Scoring** | PPR fantasy (pts/game projection) | FPL-style points (goals, assists, CS, etc.) |
| **Bye weeks** | Yes | No (EPL doesn't have bye weeks — blank/double gameweeks instead) |
| **Difficulty Rating** | Matchup difficulty vs NFL defense | FDR (Fixture Difficulty Rating) like official FPL |
| **Field view** | American football gridiron | Soccer pitch |
| **Branding** | "Gridiron Fantasy Pro" (dark green/amber) | "Premier Fantasy Manager" (purple/gold EPL theme) |

---

## Proposed Changes

### Phase 1 — Project Copy & Setup

#### [NEW] `/Users/omo/Documents/Project EPL/` (entire project)
- Copy all source files from `Project FPL` (excluding `node_modules/`, `dist/`, `.DS_Store`)
- Update `package.json`: rename to `epl-fantasy-manager`, set `"dev": "vite --port 3001"`
- Run `npm install` in the new project directory

---

### Phase 2 — Types & Data Layer

#### [MODIFY] `src/types/fantasy.ts`
- Change `Position` type from `'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST'` → `'GK' | 'DEF' | 'MID' | 'FWD'`
- Rename `byeWeek` → `doubleGameweek?: number` (optional, since EPL uses DGW not bye weeks)
- Add `fdrRating` field to `Fixture` for EPL-style Fixture Difficulty Rating
- Rename `NFLTeamInfo` → `EPLTeamInfo`, update fields (add `shortName`, `badge color`)

#### [NEW] `src/data/eplData.ts`
- All 20 EPL teams (2026/27 season): Man City, Arsenal, Liverpool, Chelsea, Man Utd, Tottenham, Newcastle, Aston Villa, West Ham, Brighton, Fulham, Wolves, Everton, Brentford, Crystal Palace, Nottm Forest, Bournemouth, Ipswich, Leicester, and Southampton (based on 2025/26 promoted clubs)
- Full team color palette (primary/secondary) for each club
- 500+ EPL fantasy players with name, position, team, projected FPL points
- 38 matchweeks of 2026/27 EPL fixtures (seeded with realistic fixture list; to be fetched via FPL API)

#### [NEW] `scripts/fetch_epl_data.py`
- Fetch top players from `https://fantasy.premierleague.com/api/bootstrap-static/`
- Fetch full fixture list from `https://fantasy.premierleague.com/api/fixtures/`
- Generate `src/data/eplData.ts` with teams, players (sorted by total_points/cost), and 38-week schedule

---

### Phase 3 — Component Adaptation

#### [MODIFY] `src/components/SoccerPitch.tsx` *(renamed from GridironField)*
- Replace American football gridiron SVG with a **soccer pitch** (green grass, white lines, center circle, penalty areas)
- Position player tokens based on EPL formation layout (GK at bottom, DEF line, MID line, FWD line)
- Support standard soccer formations: 4-4-2, 4-3-3, 4-5-1, 3-5-2, 5-4-1, 5-3-2, 4-2-3-1
- Color player tokens with their **club primary color**

#### [MODIFY] `src/components/FormationSettingsModal.tsx`
- Replace NFL slot types with EPL positions:
  - GK: always 1
  - DEF: 3–5 players
  - MID: 2–5 players
  - FWD: 1–3 players
  - Bench: 1–4 players
- Add **soccer formation presets**: 4-4-2 (classic), 4-3-3 (attacking), 3-5-2 (wing heavy), 4-2-3-1 (modern), 5-3-2 (defensive), 5-4-1 (ultra-defensive)
- Validate total outfield player count = 10 (+1 GK)

#### [MODIFY] `src/components/AddPlayerModal.tsx`
- Update position filters to `GK`, `DEF`, `MID`, `FWD`
- Update team picker to use 20 EPL club names + colors
- Show FPL price (`£X.Xm`) instead of NFL team code
- Change "bye week" field to "selected gameweek" context

#### [MODIFY] `src/components/SlotAssignModal.tsx`
- Update position pills to GK, DEF, MID, FWD
- Search by player name, club abbreviation, or position

#### [MODIFY] `src/components/UpcomingFixturesMatrix.tsx`
- Update from "18 weeks" → "38 matchweeks"
- Rename "Bye" → "Blank Gameweek" (BGW)
- Show "DGW" badge for double gameweeks
- Position filter pills: GK, DEF, MID, FWD
- FDR coloring (1=Easy Green, 2=Light Green, 3=Amber, 4=Orange, 5=Red) — classic FPL style

#### [MODIFY] `src/components/Navbar.tsx`
- Rename app to **"Premier Fantasy Manager"**
- Change color scheme to **purple/gold** (EPL aesthetic)
- Change "Sync 2026 Sched" → "Sync 2026/27 EPL Fixtures"
- Update week selector to "Matchweek 1-38"
- Change position icons and branding

#### [MODIFY] `src/components/LineupManager.tsx`
- Rename slots to GK, DEF, MID, FWD
- Remove "DST" and "K" references

#### [MODIFY] `src/App.tsx`
- Update localStorage keys to `epl_players_2026_v1`, `epl_slots_2026_v1`
- Update default formation to 4-4-2 (11 starters + 4 bench)
- Update initial slot configuration for EPL positions
- Update app title and branding

#### [MODIFY] `index.html`
- Update title to "Premier Fantasy Manager"
- Update meta description for EPL

#### [MODIFY] `src/index.css`
- Change accent color from emerald green → **purple** (`#7C3AED`) with gold highlights (`#F59E0B`)
- Update gradient overlays and button accents

---

## Verification Plan

### Automated Tests
```bash
cd "/Users/omo/Documents/Project EPL"
npm run build    # TypeScript + Vite build must exit code 0
```

### Manual Verification
- Both apps (`localhost:3000` and `localhost:3001`) run simultaneously without conflicts
- EPL app shows correct 20 EPL teams with club colors
- Soccer pitch renders the 4-4-2 default formation correctly
- Fixtures grid shows 38 matchweeks
- Player preset list includes EPL players with GK/DEF/MID/FWD positions
- FDR difficulty badges use EPL color scale (1–5)
- Formation customizer validates that you always have 11 starters (1 GK + 10 outfield)

---

## Open Questions

> [!NOTE]
> The FPL API (`fantasy.premierleague.com/api/bootstrap-static/`) is public and free — it provides official EPL player data, FDR ratings, and fixture lists for the current season. The script will pull live data when you run `npm run update-data`.

> [!NOTE]
> The 2026/27 EPL promoted/relegated clubs are not yet confirmed (the 2025/26 season is still in progress). I'll seed the initial squad list with the 20 most likely clubs and note that running the data fetch script will update them to the real 2026/27 season clubs once the FPL API is updated.
