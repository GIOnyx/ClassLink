import React from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Footer from './components/Footer';
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