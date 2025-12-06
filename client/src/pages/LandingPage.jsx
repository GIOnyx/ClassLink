import React, { useState, useRef } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import Footer from '../components/Footer.jsx';
import '../App.css';
import './LandingPage.css';
import useDepartments from '../hooks/useDepartments';

const LandingPage = ({ onLoginSuccess }) => {
    // State to control the visibility of the login pop-up
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [isRegisterVisible, setIsRegisterVisible] = useState(false);

    const sliderRef = useRef(null);
    const { departments } = useDepartments();

    const visionPillars = [
        'TRUSTED EDUCATION PROVIDER',
        'OUTCOMES-BASED INSTITUTION OF RESEARCH AND LEARNING',
        'PEOPLE-ORIENTED ORGANIZATION'
    ];

    const missionCommitments = [
        {
            title: 'Guide',
            copy: 'learners to become industry-preferred and life ready professionals'
        },
        {
            title: 'Empower',
            copy: 'people for knowledge generation and creativity'
        },
        {
            title: 'Accelerate',
            copy: 'community development'
        },
        {
            title: 'Respond',
            copy: 'proactively to a fast-changing world'
        }
    ];

    const coreValues = [
        {
            title: 'Culture of Excellence',
            copy: 'We raise the bar in scholarship, service, and the student experience.'
        },
        {
            title: 'Integrity',
            copy: 'We honor commitments and act with transparency across every interaction.'
        },
        {
            title: 'Teamwork',
            copy: 'We collaborate across disciplines to solve problems with empathy and respect.'
        },
        {
            title: 'Universality',
            copy: 'We celebrate diversity and ensure learning spaces remain inclusive and accessible.'
        }
    ];

    const programClassNames = ['accent-one', 'accent-two', 'accent-three', 'accent-four'];


    return (
        <div className="landing-page">
            {/* Pass functions to open login/register modals */}
            <BrandHeader />
            
            <main className="landing-page-content">
                {/* The hero content has been removed from this section */}
                <section id="home" className="hero-section">
                    <div className="hero-overlay" aria-label="Quick access">
                        <div className="access-shell">
                            <article
                                className="access-card"
                                role="button"
                                tabIndex={0}
                                onClick={() => setIsLoginVisible(true)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsLoginVisible(true)}
                            >
                                <div className="access-icon" aria-hidden="true">🔐</div>
                                <div className="access-text">
                                    <p>Existing Students & Staff</p>
                                    <h3>Log in to ClassLink</h3>
                                </div>
                                <span className="access-arrow" aria-hidden="true">→</span>
                            </article>
                            <article
                                className="access-card"
                                role="button"
                                tabIndex={0}
                                onClick={() => setIsRegisterVisible(true)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsRegisterVisible(true)}
                            >
                                <div className="access-icon" aria-hidden="true">📝</div>
                                <div className="access-text">
                                    <p>New to CIT-U?</p>
                                    <h3>Create your account</h3>
                                </div>
                                <span className="access-arrow" aria-hidden="true">→</span>
                            </article>
                        </div>
                    </div>
                </section>

                <section id="vision" className="vision-section modern-shell">
                    <div className="section-header">
                        <span className="label-pill">VISION</span>
                        <p className="section-eyebrow">WE ENVISION TO BE A</p>
                        <h2>TOP Philippine University <br /> in 2025</h2>
                    </div>
                    <div className="vision-grid">
                        {visionPillars.map((pillar) => (
                            <article className="vision-card" key={pillar}>
                                <div className="vision-card-marker" />
                                <h3>{pillar}</h3>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="mission" className="mission-section modern-shell">
                    <div className="section-header">
                        <span className="label-pill">MISSION</span>
                        <h2>
                            We <span className="emphasize-gear">GEAR</span> for Life.
                        </h2>
                        <p className="section-eyebrow">CIT commits to:</p>
                    </div>
                    <div className="mission-grid">
                        {missionCommitments.map((item) => (
                            <article className="mission-card" key={item.title}>
                                <span className="mission-highlight">{item.title}</span>
                                <p>{item.copy}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="core-values" className="core-values-section modern-shell">
                    <div className="core-values-layout">
                        <div className="core-values-intro">
                            <span className="label-pill">Core Values</span>
                            <h2>Grounded on character and community.</h2>
                            <p>
                                Our culture is built on values that guide every decision—from classrooms and labs to
                                partnerships with industry and communities we serve.
                            </p>
                            <div className="core-values-tags">
                                <span>Leadership</span>
                                <span>Service</span>
                                <span>Innovation</span>
                            </div>
                        </div>
                        <div className="values-grid">
                            {coreValues.map((value) => (
                                <article className="value-card" key={value.title}>
                                    <div className="value-card-top">
                                        <span className="value-badge" />
                                        <h3>{value.title}</h3>
                                    </div>
                                    <p>{value.copy}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="programs" className="programs-section modern-shell">
                    <div className="programs-header">
                        <div>
                            <span className="label-pill">Program Offerings</span>
                            <h2>Enroll NOW in our Future-Forward programs and UNLEASH your creative power!</h2>
                        </div>
                    </div>
                    <div className="programs-panel-grid" ref={sliderRef}>
                        {departments.length > 0 ? (
                            departments.map((d, index) => (
                                <article
                                    key={d.id}
                                    className={`program-panel ${programClassNames[index % programClassNames.length]}`}
                                >
                                    <span className="program-panel-label">Department</span>
                                    <h3>{d.name}</h3>
                                    <span className="program-panel-dots" aria-hidden="true">•••</span>
                                </article>
                            ))
                        ) : (
                            <article className="program-panel accent-one loading">
                                <span className="program-panel-label">Department</span>
                                <h3>Loading programs…</h3>
                            </article>
                        )}
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

            {isRegisterVisible && (
                <Register
                    onRegisterSuccess={onLoginSuccess}
                    onClose={() => setIsRegisterVisible(false)}
                />
            )}

            <Footer />
        </div>
    );
};

export default LandingPage;