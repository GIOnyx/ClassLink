import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Component & Page Imports
import MainLayout from './components/MainLayout.jsx';
import LandingPage from './pages/LandingPage.jsx'; // This will be our main public page
import EnrollmentPage from './pages/EnrollmentPage.jsx';
import FacultyPage from './pages/FacultyPage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import CoursePage from './pages/CoursePage.jsx';
import AccountPage from './pages/AccountPage.jsx';

import './App.css';
import { me, logout as apiLogout } from './services/backend';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On first load, ask the server if there's an active session
  useEffect(() => {
    (async () => {
      try {
        const res = await me();
        if (res.data?.authenticated) setIsLoggedIn(true);
      } catch (e) {
        // not logged in or server unavailable
      }
    })();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {isLoggedIn ? (
          // --- LOGGED-IN ROUTES ---
          <Route path="/*" element={<MainLayout onLogout={handleLogout} />}>
            <Route index element={<EnrollmentPage />} />
            <Route path="faculty" element={<FacultyPage />} />
            <Route path="student" element={<StudentPage />} />
            <Route path="course" element={<CoursePage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          // --- PUBLIC (NOT LOGGED-IN) ROUTES ---
          // This is now much simpler. We only have one public view.
          // It handles all paths (/*) and passes the login function down.
          <Route path="/*" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;