import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Login from './components/Login.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

// A simple placeholder for your home page content
const HomePage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to the Home Page!</h1>
      <p>This is where your main content will go.</p>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // This function will be passed to the Login component
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="app-container">
      {/* Conditionally render Navbar or nothing */}
      {isLoggedIn ? <Navbar /> : null}

      <main className="main-content">
        {/* Show Login page or Home page based on state */}
        {!isLoggedIn ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <HomePage />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;