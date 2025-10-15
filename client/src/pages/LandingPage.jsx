import React, { useState } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import Login from '../components/Login.jsx';
import Footer from '../components/Footer.jsx';
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

                <section id="mission" className="mission-section">
                    <div className="mission-content">
                        <div className="mission-title-box">
                            <span>MISSION</span>
                        </div>
                        <h2 className="mission-main-title">
                            We <span className="emphasize-gear">GEAR</span> for Life.
                        </h2>
                        <p className="mission-subtitle">CIT commits to:</p>
                        <div className="mission-pillars">
                            <div className="pillar-box">
                                <p><strong>Guide</strong> learners to become industry-preferred and life ready professionals</p>
                            </div>
                            <div className="pillar-box">
                                <p><strong>Empower</strong> people for knowledge generation and creativity</p>
                            </div>
                            <div className="pillar-box">
                                <p><strong>Accelerate</strong> community development</p>
                            </div>
                            <div className="pillar-box">
                                <p><strong>Respond</strong> proactively to a fast-changing world</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="core-values" className="core-values-section">
                    <div className="core-values-content">
                        <div className="core-values-title-box">
                            <h2>Core Values</h2>
                        </div>
                        <div className="values-list">
                            <div className="value-bar">
                                <h3>Culture of Excellence</h3>
                            </div>
                            <div className="value-bar">
                                <h3>Integrity</h3>
                            </div>
                            <div className="value-bar">
                                <h3>Teamwork</h3>
                            </div>
                            <div className="value-bar">
                                <h3>Universality</h3>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="programs" className="programs-section">
                    <div className="programs-content">
                        <h2>Program Offerings</h2>
                        <p className="programs-subtitle">
                            Enroll NOW in our Future-Forward programs and UNLEASH your creative power!
                        </p>
                        <div className="programs-grid">
                            <div className="program-card"><h3>College of Computer Studies</h3></div>
                            <div className="program-card"><h3>College of Arts, Sciences & Education</h3></div>
                            <div className="program-card"><h3>College of Management, Business & Accountancy</h3></div>
                            <div className="program-card"><h3>College of Nursing & Allied Sciences</h3></div>
                            <div className="program-card"><h3>College of Criminal Justice</h3></div>
                            <div className="program-card"><h3>College of Engineering & Architecture</h3></div>
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

            <Footer />
        </div>
    );
};

export default LandingPage;