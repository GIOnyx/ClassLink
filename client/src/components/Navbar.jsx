import React from 'react';
import BrandHeader from './BrandHeader.jsx'; // Import the new component
import '../App.css';

const Navbar = () => {
    return (
        <nav className="navbar">
        <BrandHeader /> {/* Use the new component here */}
        
        <ul className="navbar-links">
            <li>
            <a href="#notifications" className="notification-link">{/*...icon svg...*/}</a>
            </li>
            <li>
            <button className="logout-button">Logout</button>
            </li>
        </ul>
        </nav>
    );
};

export default Navbar;