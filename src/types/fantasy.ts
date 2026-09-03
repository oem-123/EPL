export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export type LineupSlotId = string;

export type MatchupRating = 'EASY' | 'NEUTRAL' | 'TOUGH' | 'BYE';

// FDR: 1 = Very easy, 2 = Easy, 3 = Medium, 4 = Hard, 5 = Very Hard
export type FDRRating = 1 | 2 | 3 | 4 | 5;

export interface Fixture {
  week: number;
  opponent: string;
  isHome: boolean;
  difficulty: MatchupRating;
  fdr: FDRRating;
  projectedPoints: number;
  gameTime?: string;
  isDoubleGameweek?: boolean;
  isBlankGameweek?: boolean;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: string;
  price: number;
  projectedAvgPts: number;
  isCustom?: boolean;
  fixtures: Record<number, Fixture>;
  notes?: string;
  avatarUrl?: string;
}

export interface SlotConfiguration {
  id: LineupSlotId;
  label: string;
  allowedPositions: Position[];
  isStarter: boolean;
  playerId: string | null;
}

export interface CustomPlayerPayload {
  name: string;
  position: Position;
  team: string;
  price: number;
  projectedAvgPts: number;
  notes?: string;
}

export interface EPLTeamInfo {
  code: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}
