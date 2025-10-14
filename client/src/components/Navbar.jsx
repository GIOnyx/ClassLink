import React from 'react';
import '../App.css';

const Navbar = () => {
    return (
        <nav className="navbar">
        <div className="navbar-brand">MyApp</div>
        <ul className="navbar-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        </nav>
    );
};

export default Navbar;