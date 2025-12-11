import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Component & Page Imports
import MainLayout from './components/MainLayout.jsx';

// Lazily-loaded pages to enable code splitting (admin and heavy routes)
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const EnrollmentPage = lazy(() => import('./pages/EnrollmentPage.jsx'));
const StudentPage = lazy(() => import('./pages/StudentPage.jsx'));
const StudentsListPage = lazy(() => import('./pages/StudentsListPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage.jsx'));

import './App.css';
import { me, logout as apiLogout } from './services/backend';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 'ADMIN' or 'STUDENT'
  const [pendingPasswordReset, setPendingPasswordReset] = useState(null);
  const pendingResetMetaRef = useRef('');

  const refreshSession = useCallback(async () => {
    try {
      const res = await me();
      if (res.data?.authenticated) {
        const mustReset = Boolean(res.data?.mustChangePassword) && res.data?.userType === 'student';
        if (mustReset) {
          setPendingPasswordReset((prev) => {
            const defaultOldPassword = pendingResetMetaRef.current || prev?.defaultOldPassword || '';
            return {
              firstName: res.data?.firstName || prev?.firstName || '',
              lastName: res.data?.lastName || prev?.lastName || '',
              defaultOldPassword
            };
          });
          setIsLoggedIn(false);
          setRole(null);
          return;
        }
        pendingResetMetaRef.current = '';
        setPendingPasswordReset(null);
        setIsLoggedIn(true);
        const sessionRole = res.data?.role || null;
        setRole(sessionRole);
      } else {
        pendingResetMetaRef.current = '';
        setPendingPasswordReset(null);
        setIsLoggedIn(false);
        setRole(null);
      }
    } catch (e) {
      pendingResetMetaRef.current = '';
      setPendingPasswordReset(null);
      setIsLoggedIn(false);
      setRole(null);
    }

    
  }, []);

  // On first load, ask the server if there's an active session
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleLoginSuccess = async (loginPayload = {}, meta = {}) => {
    if (loginPayload?.mustChangePassword) {
      pendingResetMetaRef.current = meta?.password || '';
      setPendingPasswordReset((prev) => ({
        firstName: loginPayload.firstName || prev?.firstName || '',
        lastName: loginPayload.lastName || prev?.lastName || '',
        defaultOldPassword: meta?.password || prev?.defaultOldPassword || ''
      }));
    }
    await refreshSession();
  };

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    setIsLoggedIn(false);
    setRole(null);
    setPendingPasswordReset(null);
    pendingResetMetaRef.current = '';
  };

  const handlePasswordResetComplete = async () => {
    setPendingPasswordReset(null);
    pendingResetMetaRef.current = '';
    await refreshSession();
  };

  const handlePasswordResetCancel = async () => {
    await handleLogout();
  };

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {isLoggedIn ? (
              // --- LOGGED-IN ROUTES ---
              <Route
                path="/*"
                element={
                  <MainLayout
                    onLogout={handleLogout}
                    role={role}
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
              <Route
                path="/*"
                element={
                  <LandingPage
                    onLoginSuccess={handleLoginSuccess}
                    pendingPasswordReset={pendingPasswordReset}
                    onPasswordResetComplete={handlePasswordResetComplete}
                    onPasswordResetCancel={handlePasswordResetCancel}
                  />
                }
              />
            )}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;