import React from 'react';
import Navbar from './components/Navbar.jsx';
import Login from './components/Login.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Login />
      </main>
      <Footer />
    </div>
  );
}

export default App;