import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import { RequireAuth, RequireAdmin, GuestOnly } from './components/Guards.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Draws from './pages/Draws.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/draws" element={<RequireAuth><Draws /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="site-footer">בהצלחה לכולן, ובשורות טובות</footer>
    </>
  );
}
