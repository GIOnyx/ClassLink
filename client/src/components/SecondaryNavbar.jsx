import React from 'react';
import '../App.css';

const SecondaryNavbar = ({ activePage, onPageChange }) => {
    const pages = ['Enrollment', 'Faculty', 'Student', 'Course', 'Account'];

    return (
        <nav className="secondary-navbar">
        {pages.map(page => (
            <button
            key={page}
            className={`nav-button ${activePage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
            >
            {page}
            </button>
        ))}
        </nav>
    );
};

export default SecondaryNavbar;
