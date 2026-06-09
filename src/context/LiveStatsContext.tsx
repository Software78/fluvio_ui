import { createContext, useContext } from 'react';
import { isMockMode } from '../config';
import { useLiveStats } from '../hooks/useLiveStats';
import { useMockLiveStats } from '../hooks/useMockLiveStats';
import type { LiveStats } from '../api/types';

type LiveStatsContextValue = {
  data: LiveStats | null;
  connected: boolean;
};

const LiveStatsContext = createContext<LiveStatsContextValue | null>(null);

function MockLiveStatsProvider({ children }: { children: React.ReactNode }) {
  const value = useMockLiveStats();
  return (
    <LiveStatsContext.Provider value={value}>
      {children}
    </LiveStatsContext.Provider>
  );
}

function RealLiveStatsProvider({ children }: { children: React.ReactNode }) {
  const value = useLiveStats();
  return (
    <LiveStatsContext.Provider value={value}>
      {children}
    </LiveStatsContext.Provider>
  );
}

export function LiveStatsProvider({ children }: { children: React.ReactNode }) {
  if (isMockMode()) {
    return <MockLiveStatsProvider>{children}</MockLiveStatsProvider>;
  }
  return <RealLiveStatsProvider>{children}</RealLiveStatsProvider>;
}

export function useLiveStatsContext(): LiveStatsContextValue {
  const context = useContext(LiveStatsContext);
  if (!context) {
    throw new Error('useLiveStatsContext must be used within LiveStatsProvider');
  }
  return context;
}
