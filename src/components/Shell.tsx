import React from 'react';
import { NavLink } from 'react-router-dom';
import { Terminal } from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  connected: boolean;
  workersOnline?: number;
}

export const Shell: React.FC<ShellProps> = ({ children, connected, workersOnline = 0 }) => {
  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex flex-col font-mono select-none">
      {/* Top Navbar */}
      <header className="border-b border-darkBorder bg-[#08080a] h-12 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 text-accent font-semibold tracking-tight text-sm">
            <Terminal size={16} />
            <span>FLUVIO</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Jobs
            </NavLink>
            <NavLink
              to="/workers"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Workers
            </NavLink>
            <NavLink
              to="/queues"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Queues
            </NavLink>
            <NavLink
              to="/dead"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Dead Letter
            </NavLink>
            <NavLink
              to="/periodic"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Periodic
            </NavLink>
            <NavLink
              to="/workflows"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Workflows
            </NavLink>
            <NavLink
              to="/concurrency"
              className={({ isActive }) =>
                `text-xs px-3 py-1.5 border rounded-[4px] transition-all duration-150 ${
                  isActive
                    ? 'border-darkBorder bg-darkSurface text-textPrimary font-medium'
                    : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-darkSurface/30'
                }`
              }
            >
              Concurrency
            </NavLink>
          </nav>
        </div>

        {/* Live SSE Status and Workers Online */}
        <div className="flex items-center gap-5">
          <div className="text-[11px] text-textMuted font-mono">
            workers_online: <span className="text-textPrimary font-bold">{workersOnline}</span>
          </div>
          
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0f0f11] border border-darkBorder rounded-[4px]">
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              connected ? 'bg-accent pulse-indicator' : 'bg-[#6b6b72]'
            }`} />
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              connected ? 'text-accent' : 'text-textMuted'
            }`}>
              {connected ? '● Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col justify-start">
        {children}
      </main>
    </div>
  );
};
