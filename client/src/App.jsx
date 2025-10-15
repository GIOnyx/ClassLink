import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout.jsx';
import Login from './components/Login.jsx';
import Footer from './components/Footer.jsx'; // ✨ Make sure Footer is imported
import EnrollmentPage from './pages/EnrollmentPage.jsx';
import './App.css';

// Placeholder Pages
const FacultyPage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Faculty Page</h1></div>;
const StudentPage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Student Page</h1></div>;
const CoursePage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Course Page</h1></div>;
const AccountPage = () => <div style={{ textAlign: 'center', padding: '180px 20px 50px' }}><h1>Account Page</h1></div>;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* If logged in, show the main layout and its nested pages */}
        {isLoggedIn ? (
          <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
            <Route index element={<EnrollmentPage />} /> 
            <Route path="faculty" element={<FacultyPage />} />
            <Route path="student" element={<StudentPage />} />
            <Route path="course" element={<CoursePage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          /* If not logged in, show a layout with Login + Footer */
          <Route 
            path="/login" 
            element={
              <div className="app-container"> {/* Use the same container class */}
                <main className="main-content">
                  <Login onLoginSuccess={handleLoginSuccess} />
                </main>
                <Footer /> {/* ✅ Add the Footer here */}
              </div>
            } 
          />
        )}
        {/* If not logged in, redirect any other path to the login page */}
        {!isLoggedIn && <Route path="*" element={<Navigate to="/login" />} />}
      </Routes>
    </BrowserRouter>
  );
}

export default App;