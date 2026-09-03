import React, { createContext, useContext } from 'react';
import { EPLTeamInfo } from '../types/fantasy';
import { EPL_TEAMS } from '../data/eplData';

interface CatalogContextValue {
  teams: Record<string, EPLTeamInfo>;
}

const CatalogContext = createContext<CatalogContextValue>({ teams: EPL_TEAMS });

export const CatalogProvider: React.FC<{ teams: Record<string, EPLTeamInfo>; children: React.ReactNode }> = ({
  teams,
  children,
}) => <CatalogContext.Provider value={{ teams }}>{children}</CatalogContext.Provider>;

export function useEplTeams(): Record<string, EPLTeamInfo> {
  return useContext(CatalogContext).teams;
}
