import React from 'react';
import { NavLink } from 'react-router-dom'; // ✨ Import NavLink
import '../App.css';

const SecondaryNavbar = () => {
    return (
        <nav className="secondary-navbar">
        <ul>
            {/* Replace <a> with <NavLink> and href with to */}
            <li>
                <NavLink
                    to="/"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    Enrollment
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/faculty"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    Faculty
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/student"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    Student
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/course"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    Course
                </NavLink>
            </li>
            <li>
                <NavLink
                    to="/account"
                    className={({ isActive }) => isActive ? 'active' : ''}
                >
                    Account
                </NavLink>
            </li>
        </ul>
        </nav>
    );
};

export default SecondaryNavbar;