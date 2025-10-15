import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';

// The layout now only accepts the 'onLogout' prop from App.jsx
const MainLayout = ({ onLogout }) => {
    return (
        <div className="app-container">
        {/* Pass the onLogout function directly to the Navbar */}
        <Navbar onLogout={onLogout} />

        {/* SecondaryNavbar no longer needs props because NavLink handles the active state */}
        <SecondaryNavbar />
        
        <main className="main-content">
            {/*
            The 'context' prop on Outlet passes data down to the child route component that is being rendered.
            This is how AccountPage will get access to the onLogout function.
            */}
            <Outlet context={{ handleLogout: onLogout }} />
        </main>

        <Footer />
        </div>
    );
};

export default MainLayout;
