import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';

// The layout now only accepts the 'onLogout' prop from App.jsx
const MainLayout = ({ onLogout, role }) => {
    return (
        <div className="app-container">
        {/* Pass the onLogout function directly to the Navbar */}
        <Navbar onLogout={onLogout} />

        {/* SecondaryNavbar no longer needs props because NavLink handles the active state */}
        <SecondaryNavbar role={role} />
        
        <main className="main-content">
            {/*
            The 'context' prop on Outlet passes data down to the child route component that is being rendered.
            
            ✅ FIXED: We must pass the 'role' in the context so child pages
            (like FacultyPage) can check permissions.
            */}
            <Outlet context={{ handleLogout: onLogout, role: role }} />
        </main>

        </div>
    );
};

export default MainLayout;