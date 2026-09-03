import { EPLTeamInfo, Player, Position } from '../types/fantasy';
import { TeamMatch, TeamScheduleMap, hydratePlayers } from './fixtures';

export interface FplCatalog {
  updatedAt: string;
  teams: Record<string, EPLTeamInfo>;
  schedules: TeamScheduleMap;
  players: Player[];
}

const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  Arsenal: { primary: '#EF0107', secondary: '#FFFFFF' },
  'Aston Villa': { primary: '#95BFE5', secondary: '#670E36' },
  Bournemouth: { primary: '#DA291C', secondary: '#000000' },
  Brentford: { primary: '#E30613', secondary: '#FBB800' },
  Brighton: { primary: '#0057B8', secondary: '#FFCD00' },
  Chelsea: { primary: '#034694', secondary: '#FFFFFF' },
  'Coventry City': { primary: '#77B6EA', secondary: '#0A1F44' },
  'Crystal Palace': { primary: '#1B458F', secondary: '#C4122E' },
  Everton: { primary: '#003399', secondary: '#FFFFFF' },
  Fulham: { primary: '#FFFFFF', secondary: '#CC0000' },
  'Hull City': { primary: '#F5A81C', secondary: '#000000' },
  Ipswich: { primary: '#0000FF', secondary: '#FFFFFF' },
  'Ipswich Town': { primary: '#0000FF', secondary: '#FFFFFF' },
  Leeds: { primary: '#FFCD00', secondary: '#1D428A' },
  'Leeds United': { primary: '#FFCD00', secondary: '#1D428A' },
  Liverpool: { primary: '#C8102E', secondary: '#00B2A9' },
  'Man City': { primary: '#6CABDD', secondary: '#1C2C5B' },
  'Man Utd': { primary: '#DA291C', secondary: '#FBE122' },
  Newcastle: { primary: '#241F20', secondary: '#FFFFFF' },
  "Nott'm Forest": { primary: '#DD0000', secondary: '#FFFFFF' },
  Spurs: { primary: '#132257', secondary: '#FFFFFF' },
  Sunderland: { primary: '#EB172B', secondary: '#FFFFFF' },
};

const POS_MAP: Record<number, Position> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

function bootstrapUrls(): string[] {
  return [
    '/fpl-api/bootstrap-static/',
    'https://fantasy.premierleague.com/api/bootstrap-static/',
  ];
}

function fixtureUrls(): string[] {
  return [
    '/fpl-api/fixtures/',
    'https://fantasy.premierleague.com/api/fixtures/',
  ];
}

async function fetchJson(urls: string[]): Promise<any> {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error('Unable to reach the FPL API');
}

function colorsFor(name: string, shortName: string) {
  return TEAM_COLORS[name] || TEAM_COLORS[shortName] || { primary: '#334155', secondary: '#FFFFFF' };
}

function formatKickoff(kickoff?: string): string {
  if (!kickoff) return 'TBC';
  const dt = new Date(kickoff);
  if (Number.isNaN(dt.getTime())) return 'TBC';
  return dt.toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

function projectedAvg(p: any): number {
  const ppg = Number(p.points_per_game || 0);
  const ep = Number(p.ep_next || p.ep_this || 0);
  if (ppg > 0) return Math.round(ppg * 10) / 10;
  if (ep > 0) return Math.round(ep * 10) / 10;
  const price = (p.now_cost || 45) / 10;
  return Math.round(Math.max(2, price * 0.55) * 10) / 10;
}

export function parseFplPayload(bootstrap: any, fixturesRaw: any[]): FplCatalog {
  const teams: Record<string, EPLTeamInfo> = {};
  const byId: Record<number, EPLTeamInfo> = {};

  for (const t of bootstrap.teams || []) {
    const colors = colorsFor(t.name, t.short_name);
    const info: EPLTeamInfo = {
      code: t.short_name,
      name: t.name,
      shortName: t.short_name,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
    };
    teams[info.code] = info;
    byId[t.id] = info;
  }

  const schedules: TeamScheduleMap = {};
  for (const fx of fixturesRaw) {
    const gw = fx.event;
    if (!gw) continue;
    const home = byId[fx.team_h];
    const away = byId[fx.team_a];
    if (!home || !away) continue;
    const gameTime = formatKickoff(fx.kickoff_time);
    const homeMatch: TeamMatch = {
      opponent: away.code,
      isHome: true,
      gameTime,
      fdr: fx.team_h_difficulty || 3,
    };
    const awayMatch: TeamMatch = {
      opponent: home.code,
      isHome: false,
      gameTime,
      fdr: fx.team_a_difficulty || 3,
    };
    if (!schedules[home.code]) schedules[home.code] = {};
    if (!schedules[away.code]) schedules[away.code] = {};
    const existingH = schedules[home.code][gw];
    const existingA = schedules[away.code][gw];
    schedules[home.code][gw] = existingH
      ? (Array.isArray(existingH) ? [...existingH, homeMatch] : [existingH, homeMatch])
      : homeMatch;
    schedules[away.code][gw] = existingA
      ? (Array.isArray(existingA) ? [...existingA, awayMatch] : [existingA, awayMatch])
      : awayMatch;
  }

  const rawPlayers: Player[] = (bootstrap.elements || [])
    .slice()
    .sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0))
    .map((p: any) => {
      const team = byId[p.team];
      return {
        id: `fpl_${p.id}`,
        name: p.web_name || p.second_name || 'Unknown',
        position: POS_MAP[p.element_type] || 'MID',
        team: team?.code || '???',
        price: Math.round((p.now_cost || 50) / 10 * 10) / 10,
        projectedAvgPts: projectedAvg(p),
        fixtures: {},
      };
    });

  return {
    updatedAt: new Date().toISOString(),
    teams,
    schedules,
    players: hydratePlayers(rawPlayers, schedules),
  };
}

export async function fetchLiveFplCatalog(): Promise<FplCatalog> {
  const [bootstrap, fixtures] = await Promise.all([
    fetchJson(bootstrapUrls()),
    fetchJson(fixtureUrls()),
  ]);
  return parseFplPayload(bootstrap, fixtures);
}

export function mergeSquadWithCatalog(squad: Player[], catalog: FplCatalog): Player[] {
  return squad.map((player) => {
    const live = catalog.players.find((p) => p.id === player.id)
      || catalog.players.find((p) => p.name === player.name && p.team === player.team);
    if (live) {
      return {
        ...player,
        name: live.name,
        position: live.position,
        team: live.team,
        price: live.price,
        projectedAvgPts: live.projectedAvgPts,
        fixtures: live.fixtures,
      };
    }
    return {
      ...player,
      fixtures: hydratePlayers([player], catalog.schedules)[0].fixtures,
    };
  });
}
