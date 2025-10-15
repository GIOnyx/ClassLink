import React from 'react';
import '../App.css';

const Navbar = ({ onLogout }) => {
    return (
        <nav className="navbar">
        <div className="navbar-brand">
            <img src="/CIT-logo.png" alt="CIT-U Logo" className="navbar-logo" />
            <div className="navbar-text">
                <p>Cebu Institute of Technology - Univeristy</p>
                <p><span className="online-text">Online</span></p>
            </div>
        </div>
        <ul className="navbar-links">
            <li>
                <a href="#notifications" className="notification-link">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="notification-icon"
                    >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </a>
            </li>
            <li>
                <button onClick={onLogout} className="logout-button">Logout</button>
            </li>
        </ul>
        </nav>
    );
};

export default Navbar;