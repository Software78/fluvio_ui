import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/Toast";
import { LiveStatsProvider, useLiveStatsContext } from "./context/LiveStatsContext";
import { Dashboard } from "./pages/Dashboard";
import { JobDetail } from "./pages/JobDetail";
import { Jobs } from "./pages/Jobs";
import { Queues } from "./pages/Queues";

// Configure React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Renders the primary routes wrapped in the live telemetry header shell.
 */
function AppContent() {
  const { data, connected } = useLiveStatsContext();
  const workersOnline = data?.workers_online ?? 0;

  return (
    <Shell connected={connected} workersOnline={workersOnline}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/queues" element={<Queues />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LiveStatsProvider>
          <AppContent />
        </LiveStatsProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
