import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ToastProvider } from "./components/Toast";
import { LiveStatsProvider, useLiveStatsContext } from "./context/LiveStatsContext";
import { getWorkers } from "./api/workers";
import { Dashboard } from "./pages/Dashboard";
import { DeadLetter } from "./pages/DeadLetter";
import { JobDetail } from "./pages/JobDetail";
import { Jobs } from "./pages/Jobs";
import { Periodic } from "./pages/Periodic";
import { Queues } from "./pages/Queues";
import { Workers } from "./pages/Workers";
import { Workflows } from "./pages/Workflows";
import { WorkflowDetail } from "./pages/WorkflowDetail";
import { Concurrency } from "./pages/Concurrency";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  const { connected } = useLiveStatsContext();

  const { data: workers } = useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
    refetchInterval: 10000,
    retry: 1,
  });

  const workersOnline = workers?.length ?? 0;

  return (
    <Shell connected={connected} workersOnline={workersOnline}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/queues" element={<Queues />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/dead" element={<DeadLetter />} />
        <Route path="/periodic" element={<Periodic />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/:id" element={<WorkflowDetail />} />
        <Route path="/concurrency" element={<Concurrency />} />
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
