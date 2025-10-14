import React from 'react';
import '../App.css';

const Navbar = () => {
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
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        </nav>
    );
};

export default Navbar;