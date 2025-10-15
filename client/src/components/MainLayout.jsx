import React from 'react';
import { Outlet } from 'react-router-dom'; // Import Outlet
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import Footer from './Footer';

const MainLayout = ({ handleLogout, activePage, setActivePage }) => {
    return (
        <div className="app-container">
        <Navbar onLogout={handleLogout} />
        <SecondaryNavbar
            activePage={activePage}
            onNavClick={setActivePage}
        />
        
        {/* Outlet will render the current page's component */}
        <main className="main-content">
            <Outlet />
        </main>

        <Footer />
        </div>
    );
};

export default MainLayout;