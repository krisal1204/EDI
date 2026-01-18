
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './components/Landing';
import { Guide } from './components/Guide';
import { Workspace } from './components/Workspace';
import { useAppStore } from './store/useAppStore';

function App() {
  const { theme } = useAppStore();

  React.useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Wrapper components to provide navigation context if needed, though components can use hooks directly now.
  // We'll keep it simple and route directly to components.

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/editor" element={<Workspace />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
