import { Fixture, FDRRating, MatchupRating, Player } from '../types/fantasy';

export interface TeamMatch {
  opponent: string;
  isHome: boolean;
  gameTime: string;
  fdr: number;
}

export type TeamScheduleMap = Record<string, Record<number, TeamMatch | TeamMatch[]>>;

export const TOTAL_GAMEWEEKS = 38;

function asList(value: TeamMatch | TeamMatch[] | undefined): TeamMatch[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function fdrToDifficulty(fdr: number): MatchupRating {
  if (fdr <= 2) return 'EASY';
  if (fdr === 3) return 'NEUTRAL';
  return 'TOUGH';
}

function clampFdr(n: number): FDRRating {
  const v = Math.min(5, Math.max(1, Math.round(n)));
  return v as FDRRating;
}

function scaleForFdr(fdr: number): number {
  if (fdr <= 2) return 1.2;
  if (fdr === 3) return 1.0;
  if (fdr === 4) return 0.8;
  return 0.65;
}

export function generatePlayerFixtures(
  team: string,
  avgPts: number,
  schedules: TeamScheduleMap,
): Record<number, Fixture> {
  const teamSchedule = schedules[team] || {};
  const fixtures: Record<number, Fixture> = {};

  for (let gw = 1; gw <= TOTAL_GAMEWEEKS; gw++) {
    const matches = asList(teamSchedule[gw]);
    if (matches.length === 0) {
      fixtures[gw] = {
        week: gw,
        opponent: 'BGW',
        isHome: true,
        difficulty: 'BYE',
        fdr: 3,
        projectedPoints: 0,
        gameTime: 'Blank',
        isBlankGameweek: true,
      };
      continue;
    }

    const isDouble = matches.length > 1;
    const fdr = clampFdr(
      matches.reduce((sum, m) => sum + (m.fdr || 3), 0) / matches.length,
    );
    const projected = matches.reduce((sum, m) => {
      return sum + Math.round(avgPts * scaleForFdr(m.fdr || 3) * 10) / 10;
    }, 0);

    const oppCodes = matches.map((m) => m.opponent).join('/');
    const allHome = matches.every((m) => m.isHome);
    const allAway = matches.every((m) => !m.isHome);

    fixtures[gw] = {
      week: gw,
      opponent: oppCodes,
      isHome: allHome || (!allAway && matches[0].isHome),
      difficulty: fdrToDifficulty(fdr),
      fdr,
      projectedPoints: Math.round(projected * 10) / 10,
      gameTime: isDouble ? `DGW · ${matches[0].gameTime}` : matches[0].gameTime,
      isDoubleGameweek: isDouble,
    };
  }

  return fixtures;
}

export function hydratePlayer(player: Omit<Player, 'fixtures'> & { fixtures?: Player['fixtures'] }, schedules: TeamScheduleMap): Player {
  return {
    ...player,
    fixtures: generatePlayerFixtures(player.team, player.projectedAvgPts, schedules),
  };
}

export function hydratePlayers(players: Player[], schedules: TeamScheduleMap): Player[] {
  return players.map((p) => hydratePlayer(p, schedules));
}
