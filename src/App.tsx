import React, { useEffect } from 'react';
import { systemLogger } from './utils/logging/systemLogger';
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlayPage from './pages/PlayPage';
import TrainingPage from './pages/TrainingPage';
import ImplementationPlanPage from './pages/ImplementationPlanPage';
import ManualPage from './pages/ManualPage';
import Navigation from './components/Navigation';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    systemLogger.log('system', 'Application initialized', { timestamp: new Date() }, 'info');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <main className="container mx-auto px-4">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/play" element={<PlayPage />} />
                <Route path="/training" element={<TrainingPage />} />
                <Route path="/implementation" element={<ImplementationPlanPage />} />
                <Route path="/manual" element={<ManualPage />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;