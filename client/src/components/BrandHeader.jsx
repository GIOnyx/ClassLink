import React from 'react';
import '../App.css';
import './BrandHeader.css';

// The header now accepts an 'onLoginClick' function as a prop
const BrandHeader = ({ onLoginClick, onRegisterClick }) => {
    return (
        <header className="navbar">
            <div className="navbar-brand">
                <img src="/CIT-logo.png" alt="CIT-U Logo" className="navbar-logo" />
                <div className="navbar-text">
                    <p>Cebu Institute of Technology - University</p>
                    <p><span className="online-text">Online</span></p>
                </div>
            </div>
            
            <nav>
                <ul className="navbar-links">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#vision">Vision</a></li>
                    <li><a href="#mission">Mission</a></li>
                    <li><a href="#core-values">Core Values</a></li>
                    <li><a href="#programs">Programs</a></li>
                    {/* ✨ This is now a button that calls the function from LandingPage */}
                    <li><button onClick={onLoginClick} className="login-button-link">Login</button></li>
                    <li><button onClick={onRegisterClick} className="login-button-link">Register</button></li>
                </ul>
            </nav>
        </header>
    );
};

export default BrandHeader;