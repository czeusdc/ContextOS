import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/lib/store';
import { WorkflowRuntimeProvider } from '@/context/WorkflowRuntimeContext';
import { Shell } from '@/components/layout/Shell';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { Landing } from '@/pages/Landing';
import { UploadPage } from '@/pages/Upload';
import { AnalysisPage } from '@/pages/Analysis';
import { GraphDashboard } from '@/pages/Graph';
import { ExecuteConsole } from '@/pages/Execute';
import { SecurityDashboard } from '@/pages/Security';
import { ReportPage } from '@/pages/Report';
import { LogoShot } from '@/pages/LogoShot';

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <WorkflowRuntimeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/logo-shot" element={<LogoShot />} />
              <Route element={<Shell />}>
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/graph" element={<GraphDashboard />} />
                <Route path="/execute" element={<ExecuteConsole />} />
                <Route path="/security" element={<SecurityDashboard />} />
                <Route path="/report" element={<ReportPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="bottom-right" theme="dark" />
        </WorkflowRuntimeProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

