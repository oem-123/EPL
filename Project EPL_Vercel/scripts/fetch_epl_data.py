#!/usr/bin/env python3
"""
Fetch EPL data from the official Fantasy Premier League API and regenerate
src/data/eplData.ts with live teams, squads, and 38-GW fixtures.

Usage:
    npm run update-data
"""

from __future__ import annotations

import json
import os
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_FILE = os.path.join(SCRIPT_DIR, "../src/data/eplData.ts")

TEAM_COLORS = {
    "Arsenal": {"primary": "#EF0107", "secondary": "#FFFFFF"},
    "Aston Villa": {"primary": "#95BFE5", "secondary": "#670E36"},
    "Bournemouth": {"primary": "#DA291C", "secondary": "#000000"},
    "Brentford": {"primary": "#E30613", "secondary": "#FBB800"},
    "Brighton": {"primary": "#0057B8", "secondary": "#FFCD00"},
    "Chelsea": {"primary": "#034694", "secondary": "#FFFFFF"},
    "Coventry City": {"primary": "#77B6EA", "secondary": "#0A1F44"},
    "Crystal Palace": {"primary": "#1B458F", "secondary": "#C4122E"},
    "Everton": {"primary": "#003399", "secondary": "#FFFFFF"},
    "Fulham": {"primary": "#FFFFFF", "secondary": "#CC0000"},
    "Hull City": {"primary": "#F5A81C", "secondary": "#000000"},
    "Ipswich": {"primary": "#0000FF", "secondary": "#FFFFFF"},
    "Ipswich Town": {"primary": "#0000FF", "secondary": "#FFFFFF"},
    "Leeds": {"primary": "#FFCD00", "secondary": "#1D428A"},
    "Leeds United": {"primary": "#FFCD00", "secondary": "#1D428A"},
    "Leicester": {"primary": "#003090", "secondary": "#FDBE11"},
    "Leicester City": {"primary": "#003090", "secondary": "#FDBE11"},
    "Liverpool": {"primary": "#C8102E", "secondary": "#00B2A9"},
    "Man City": {"primary": "#6CABDD", "secondary": "#1C2C5B"},
    "Manchester City": {"primary": "#6CABDD", "secondary": "#1C2C5B"},
    "Man Utd": {"primary": "#DA291C", "secondary": "#FBE122"},
    "Manchester United": {"primary": "#DA291C", "secondary": "#FBE122"},
    "Newcastle": {"primary": "#241F20", "secondary": "#FFFFFF"},
    "Newcastle United": {"primary": "#241F20", "secondary": "#FFFFFF"},
    "Nott'm Forest": {"primary": "#DD0000", "secondary": "#FFFFFF"},
    "Nottingham Forest": {"primary": "#DD0000", "secondary": "#FFFFFF"},
    "Southampton": {"primary": "#D71920", "secondary": "#FFC20E"},
    "Spurs": {"primary": "#132257", "secondary": "#FFFFFF"},
    "Tottenham Hotspur": {"primary": "#132257", "secondary": "#FFFFFF"},
    "Sunderland": {"primary": "#EB172B", "secondary": "#FFFFFF"},
    "West Ham": {"primary": "#7A263A", "secondary": "#1BB1E7"},
    "West Ham United": {"primary": "#7A263A", "secondary": "#1BB1E7"},
    "Wolves": {"primary": "#FDB913", "secondary": "#231F20"},
    "Wolverhampton Wanderers": {"primary": "#FDB913", "secondary": "#231F20"},
}


def fetch(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PremierFantasyManager)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def colors_for(name: str, short_name: str):
    return (
        TEAM_COLORS.get(name)
        or TEAM_COLORS.get(short_name)
        or {"primary": "#334155", "secondary": "#FFFFFF"}
    )


def format_kickoff(kickoff: str) -> str:
    if not kickoff:
        return "TBC"
    try:
        dt = datetime.fromisoformat(kickoff.replace("Z", "+00:00"))
        return dt.strftime("%a %H:%M")
    except Exception:
        return "TBC"


def projected_avg(p: dict) -> float:
    try:
        ppg = float(p.get("points_per_game") or 0)
    except (TypeError, ValueError):
        ppg = 0.0
    try:
        ep = float(p.get("ep_next") or p.get("ep_this") or 0)
    except (TypeError, ValueError):
        ep = 0.0
    if ppg > 0:
        return round(ppg, 1)
    if ep > 0:
        return round(ep, 1)
    price = (p.get("now_cost") or 45) / 10.0
    return round(max(2.0, price * 0.55), 1)


print("Fetching FPL bootstrap-static (2026/27)...")
data = fetch("https://fantasy.premierleague.com/api/bootstrap-static/")

teams = {}
for t in data["teams"]:
    colors = colors_for(t["name"], t["short_name"])
    teams[t["id"]] = {
        "code": t["short_name"],
        "name": t["name"],
        "shortName": t["short_name"],
        "primaryColor": colors["primary"],
        "secondaryColor": colors["secondary"],
    }

print(f"  {len(teams)} clubs: " + ", ".join(sorted(v["code"] for v in teams.values())))

print("Fetching fixtures...")
fixtures_raw = fetch("https://fantasy.premierleague.com/api/fixtures/")

team_schedule = defaultdict(lambda: defaultdict(list))
for fx in fixtures_raw:
    gw = fx.get("event")
    if not gw:
        continue
    home_id = fx["team_h"]
    away_id = fx["team_a"]
    home_code = teams.get(home_id, {}).get("code", "???")
    away_code = teams.get(away_id, {}).get("code", "???")
    game_time = format_kickoff(fx.get("kickoff_time") or "")
    team_schedule[home_id][gw].append({
        "opponent": away_code,
        "isHome": True,
        "gameTime": game_time,
        "fdr": int(fx.get("team_h_difficulty") or 3),
    })
    team_schedule[away_id][gw].append({
        "opponent": home_code,
        "isHome": False,
        "gameTime": game_time,
        "fdr": int(fx.get("team_a_difficulty") or 3),
    })

print(f"  Fixtures loaded for {len(team_schedule)} teams")

pos_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
players_raw = sorted(
    data["elements"],
    key=lambda x: (
        -(x.get("total_points") or 0),
        -float(x.get("selected_by_percent") or 0),
        -(x.get("now_cost") or 0),
    ),
)

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
lines = []
lines.append("// AUTO-GENERATED BY scripts/fetch_epl_data.py — do not edit by hand.")
lines.append("// Refresh with: npm run update-data")
lines.append("import { EPLTeamInfo, Player } from '../types/fantasy';")
lines.append("import { TeamScheduleMap, generatePlayerFixtures } from '../lib/fixtures';")
lines.append("")
lines.append(f"export const DATA_UPDATED_AT = {json.dumps(now)};")
lines.append("")

teams_dict = {v["code"]: v for v in teams.values()}
lines.append("export const EPL_TEAMS: Record<string, EPLTeamInfo> = " + json.dumps(teams_dict, indent=2) + ";")
lines.append("")

lines.append("export const TEAM_SCHEDULES: TeamScheduleMap = {")
for tid in sorted(teams.keys()):
    code = teams[tid]["code"]
    wk_map = team_schedule.get(tid, {})
    lines.append(f"  {json.dumps(code)}: {{")
    for gw in range(1, 39):
        matches = wk_map.get(gw, [])
        if not matches:
            continue
        payload = matches[0] if len(matches) == 1 else matches
        lines.append(f"    {gw}: {json.dumps(payload)},")
    lines.append("  },")
lines.append("};")
lines.append("")

lines.append("const RAW_PLAYERS: Omit<Player, 'fixtures'>[] = [")
for p in players_raw:
    team_id = p.get("team")
    team_code = teams.get(team_id, {}).get("code", "???")
    pos = pos_map.get(p.get("element_type", 3), "MID")
    name = p.get("web_name") or p.get("second_name") or "Unknown"
    price = round((p.get("now_cost") or 50) / 10.0, 1)
    avg_pts = projected_avg(p)
    pid = f"fpl_{p['id']}"
    lines.append(
        "  {"
        f"id:{json.dumps(pid)},"
        f"name:{json.dumps(name)},"
        f"position:{json.dumps(pos)},"
        f"team:{json.dumps(team_code)},"
        f"price:{price},"
        f"projectedAvgPts:{avg_pts}"
        "},"
    )
lines.append("];")
lines.append("")
lines.append("export const INITIAL_PRESET_PLAYERS: Player[] = RAW_PLAYERS.map((p) => ({")
lines.append("  ...p,")
lines.append("  fixtures: generatePlayerFixtures(p.team, p.projectedAvgPts, TEAM_SCHEDULES),")
lines.append("}));")
lines.append("")

os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
with open(OUT_FILE, "w") as f:
    f.write("\n".join(lines) + "\n")

print(f"\nDone! Wrote {len(players_raw)} players + 38 GWs to {OUT_FILE}")
print(f"Timestamp: {now}")
