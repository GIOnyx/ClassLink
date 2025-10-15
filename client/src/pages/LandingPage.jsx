import React, { useState } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import Login from '../components/Login.jsx'; // ✅ Import the Login component
import '../App.css';

// The LandingPage now receives onLoginSuccess to pass it down to the Login modal
const LandingPage = ({ onLoginSuccess }) => {
    // ✨ State to control the visibility of the login pop-up
    const [isLoginVisible, setIsLoginVisible] = useState(false);

    return (
        <div className="landing-page">
            {/* Pass a function to the header to open the modal */}
            <BrandHeader onLoginClick={() => setIsLoginVisible(true)} />
            
            <main className="landing-page-content">
                <section id="home" className="hero-section">
                </section>
                {/* You can add your other sections (vision, mission, etc.) here */}
            </main>

            {/* ✨ Conditionally render the Login modal based on state */}
            {isLoginVisible && (
                <Login
                    onLoginSuccess={onLoginSuccess}
                    onClose={() => setIsLoginVisible(false)}
                />
            )}
        </div>
    );
};

export default LandingPage;