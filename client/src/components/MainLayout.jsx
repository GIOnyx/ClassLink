import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';

const MainLayout = ({ onLogout, role }) => {
    return (
        <div className="app-container">
            <Navbar onLogout={onLogout} />
            
            {/* Sidebar Navigation */}
            <SecondaryNavbar role={role} />
            
            {/* Main Content Area */}
            <main className="main-content">
                <Outlet context={{ handleLogout: onLogout, role: role }} />
            </main>
        </div>
    );
};

export default MainLayout;