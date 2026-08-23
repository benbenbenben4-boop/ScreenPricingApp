import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OpenPage from './components/OpenPage/OpenPage';
import DesignerPage from './components/DesignerPage/DesignerPage';
import SettingsPage from './components/SettingsPage/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OpenPage />} />
        <Route path="/designer/:projectId" element={<DesignerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
