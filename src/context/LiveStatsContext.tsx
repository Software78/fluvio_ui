import { createContext, useContext } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';
import type { LiveStats } from '../api/types';

type LiveStatsContextValue = {
  data: LiveStats | null;
  connected: boolean;
};

const LiveStatsContext = createContext<LiveStatsContextValue | null>(null);

export function LiveStatsProvider({ children }: { children: React.ReactNode }) {
  const value = useLiveStats();
  return (
    <LiveStatsContext.Provider value={value}>
      {children}
    </LiveStatsContext.Provider>
  );
}

export function useLiveStatsContext(): LiveStatsContextValue {
  const context = useContext(LiveStatsContext);
  if (!context) {
    throw new Error('useLiveStatsContext must be used within LiveStatsProvider');
  }
  return context;
}
