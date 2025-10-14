import React from 'react';
import '../App.css';

const BrandHeader = () => {
    return (
        <div className="navbar-brand">
        <img src="/CIT-logo.png" alt="CIT-U Logo" className="navbar-logo" />
        <div className="navbar-text">
            <p>Cebu Institute of Technology - Univeristy</p>
            <p><span className="online-text">Online</span></p>
        </div>
        </div>
    );
};

export default BrandHeader;