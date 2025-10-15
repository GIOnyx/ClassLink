import React, { useState } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import Login from '../components/Login.jsx';
import '../App.css';

const LandingPage = ({ onLoginSuccess }) => {
    // State to control the visibility of the login pop-up
    const [isLoginVisible, setIsLoginVisible] = useState(false);

    return (
        <div className="landing-page">
            {/* Pass a function to the header to open the modal */}
            <BrandHeader onLoginClick={() => setIsLoginVisible(true)} />
            
            <main className="landing-page-content">
                {/* The hero content has been removed from this section */}
                <section id="home" className="hero-section">
                </section>

                <section id="vision" className="vision-section">
                    <div className="vision-content">
                        <div className="vision-title-box">
                            <span>VISION</span>
                        </div>
                        <p className="vision-subtitle">WE ENVISION TO BE A</p>
                        <h2 className="vision-main-title">
                            TOP Philippine University <br /> in 2025
                        </h2>
                        <div className="vision-pillars">
                            <div className="pillar-box">
                                <h3>TRUSTED EDUCATION PROVIDER</h3>
                            </div>
                            <div className="pillar-box">
                                <h3>OUTCOMES-BASED INSTITUTION OF RESEARCH AND LEARNING</h3>
                            </div>
                            <div className="pillar-box">
                                <h3>PEOPLE-ORIENTED ORGANIZATION</h3>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Conditionally render the Login modal based on state */}
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