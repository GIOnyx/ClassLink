import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Component & Page Imports
import MainLayout from './components/MainLayout.jsx';
import LandingPage from './pages/LandingPage.jsx'; // This will be our main public page
import EnrollmentPage from './pages/EnrollmentPage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import StudentsListPage from './pages/StudentsListPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import CurriculumPage from './pages/CurriculumPage.jsx';

import './App.css';
import { me, logout as apiLogout } from './services/backend';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 'ADMIN' or 'STUDENT'
  const [shouldOpenProfile, setShouldOpenProfile] = useState(false);

  // On first load, ask the server if there's an active session
  useEffect(() => {
    (async () => {
      try {
        const res = await me();
        if (res.data?.authenticated) {
          setIsLoggedIn(true);
          setRole(res.data?.role || null);
        }
      } catch (e) {
        // not logged in or server unavailable
      }
    })();
  }, []);

  const handleLoginSuccess = async () => {
    // After login, fetch session to know role
    try {
      const res = await me();
      if (res.data?.authenticated) {
        setIsLoggedIn(true);
        const sessionRole = res.data?.role || null;
        setRole(sessionRole);
        setShouldOpenProfile(sessionRole === 'STUDENT');
      }
    } catch {}
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    setIsLoggedIn(false);
    setRole(null);
    setShouldOpenProfile(false);
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Routes>
        {isLoggedIn ? (
          // --- LOGGED-IN ROUTES ---
          <Route
            path="/*"
            element={
              <MainLayout
                onLogout={handleLogout}
                role={role}
                shouldOpenProfile={shouldOpenProfile}
                onProfileRedirectComplete={() => setShouldOpenProfile(false)}
              />
            }
          >
            {/* Default landing after login per role */}
            <Route index element={role === 'ADMIN' ? <AdminPage /> : <EnrollmentPage />} />
            <Route path="admin" element={role === 'ADMIN' ? <AdminPage /> : <Navigate to="/" />} />
            <Route path="admins" element={role === 'ADMIN' ? <StudentPage /> : <Navigate to="/" />} />
            <Route path="students" element={role === 'ADMIN' ? <StudentsListPage /> : <Navigate to="/" />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="curriculum" element={<CurriculumPage role={role} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          // --- PUBLIC (NOT LOGGED-IN) ROUTES ---
          // This is now much simpler. We only have one public view.
          // It handles all paths (/*) and passes the login function down.
          <Route path="/*" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />
        )}
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;