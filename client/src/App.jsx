import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Imports from the 'components' folder
import MainLayout from './components/MainLayout.jsx';
import Login from './components/Login.jsx';
import Footer from './components/Footer.jsx';

// Imports from the 'pages' folder
import EnrollmentPage from './pages/EnrollmentPage.jsx';
import FacultyPage from './pages/FacultyPage.jsx'; // ✅ You correctly added this import

import './App.css';

// 🗑️ The line for FacultyPage has been DELETED from here.
const StudentPage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Student Page</h1></div>;
const CoursePage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Course Page</h1></div>;
const AccountPage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Account Page</h1></div>;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ... (rest of your App.jsx code remains the same)

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {isLoggedIn ? (
          <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
            <Route index element={<EnrollmentPage />} /> 
            <Route path="faculty" element={<FacultyPage />} /> {/* This now uses the imported component */}
            <Route path="student" element={<StudentPage />} />
            <Route path="course" element={<CoursePage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <Route 
            path="/login" 
            element={
              <div className="app-container">
                <main className="main-content">
                  <Login onLoginSuccess={handleLoginSuccess} />
                </main>
                <Footer />
              </div>
            } 
          />
        )}
        {!isLoggedIn && <Route path="*" element={<Navigate to="/login" />} />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;