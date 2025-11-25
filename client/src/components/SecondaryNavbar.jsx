import React from 'react';
import { NavLink } from 'react-router-dom'; // ✨ Import NavLink
import '../App.css';
import './SecondaryNavbar.css';

const SecondaryNavbar = ({ role }) => {
    return (
        <nav className="secondary-navbar">
            <ul>
                {role === 'ADMIN' ? (
                    <>
                        {/* --- ADMIN LINKS --- */}
                        {/* 'Enrollment' for admin links to '/' which App.jsx maps to AdminPage */}
                        <li>
                            <NavLink
                                to="/"
                                className={({ isActive }) => isActive ? 'active' : ''}
                                end 
                            >
                                Enrollment
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/calendar"
                                className={({ isActive }) => isActive ? 'active' : ''}
                                end
                            >
                                Calendar
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/admins"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Admins
                            </NavLink>
                        </li>
                        
                        <li>
                            <NavLink
                                to="/curriculum"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Curriculum
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/profile"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Profile
                            </NavLink>
                        </li>
                    </>
                ) : (
                    <>
                        {/* --- STUDENT LINKS --- */}
                        {/* 'Enrollment' for student links to '/' which App.jsx maps to EnrollmentPage */}
                        <li>
                            <NavLink
                                to="/"
                                className={({ isActive }) => isActive ? 'active' : ''}
                                end
                            >
                                Enrollment
                            </NavLink>
                        </li>
                        
                        <li>
                            <NavLink
                                to="/calendar"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Calendar
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/curriculum"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Curriculum
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/profile"
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                Profile
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default SecondaryNavbar;