import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TrainingPage } from './pages';
import { PlayPage } from './pages';
import { AnalysisPage } from './pages';
import { SettingsPage } from './pages';
import { Toaster } from './ui/toaster';
import { ThemeProvider } from './ui/theme-provider';
import { initTensorFlow } from './utils';
import { systemLogger } from './logger';

const App: React.FC = () => {
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        const tfInitialized = await initTensorFlow();
        systemLogger.log('app', 'TensorFlow initialization:', { success: tfInitialized });
      } catch (error) {
        systemLogger.error('app', 'Failed to initialize TensorFlow:', { error });
      }
    };

    initializeApp();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<PlayPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
