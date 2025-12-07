import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import BrandHeader from '../components/BrandHeader.jsx';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import Footer from '../components/Footer.jsx';
import '../App.css';
import './LandingPage.css';
import useDepartments from '../hooks/useDepartments';
import usePrograms from '../hooks/usePrograms';

const ProgramModal = ({ department, anchor, onMouseEnter, onMouseLeave }) => {
    const { programs, loading } = usePrograms(department?.id);
    if (!department || !anchor) {
        return null;
    }

    const hasPrograms = programs && programs.length > 0;

    const overlayClass = anchor.isMobile
        ? 'program-modal-overlay program-modal-overlay--mobile'
        : 'program-modal-overlay';

    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className={overlayClass}
            style={{ left: anchor.left, top: anchor.top }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="dialog"
            aria-live="polite"
            aria-label={`${department.name} programs`}
        >
            <div className="program-modal-card">
                <div className="program-modal-header">
                    <span className="program-modal-label">Programs</span>
                    <h3>{department.name}</h3>
                </div>
                <div className="program-modal-body">
                    {loading ? (
                        <p className="program-modal-state">Loading programs…</p>
                    ) : hasPrograms ? (
                        <ul className="program-modal-list">
                            {programs.map((program) => (
                                <li key={program.id ?? program.name}>{program.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="program-modal-state">Programs coming soon.</p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const LandingPage = ({ onLoginSuccess }) => {
    // State to control the visibility of the login pop-up
    const [isLoginVisible, setIsLoginVisible] = useState(false);
    const [isRegisterVisible, setIsRegisterVisible] = useState(false);
    const [hoveredDepartment, setHoveredDepartment] = useState(null);
    const [modalAnchor, setModalAnchor] = useState(null);
    const hoverTimeoutRef = useRef(null);
    const hoveredCardRef = useRef(null);

    const { departments } = useDepartments();

    const updateModalAnchor = useCallback((target) => {
        if (!target || typeof window === 'undefined') {
            setModalAnchor(null);
            return;
        }
        const rect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 768;
        setModalAnchor({
            left: isMobile ? viewportWidth / 2 : rect.left + rect.width / 2,
            top: isMobile ? viewportHeight : rect.top,
            isMobile,
        });
    }, []);

    const cancelScheduledClose = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    useEffect(() => () => cancelScheduledClose(), []);

    const scheduleModalClose = () => {
        const closeModal = () => {
            setHoveredDepartment(null);
            setModalAnchor(null);
            hoveredCardRef.current = null;
        };
        cancelScheduledClose();
        if (typeof window === 'undefined') {
            closeModal();
            return;
        }
        hoverTimeoutRef.current = window.setTimeout(closeModal, 120);
    };

    const handleDepartmentHover = (department, target) => {
        if (!target || typeof window === 'undefined') {
            return;
        }
        cancelScheduledClose();
        hoveredCardRef.current = target;
        updateModalAnchor(target);
        setHoveredDepartment(department);
    };

    const handleModalMouseEnter = () => cancelScheduledClose();
    const handleModalMouseLeave = () => scheduleModalClose();

    useEffect(() => {
        if (!hoveredDepartment || !hoveredCardRef.current) {
            return undefined;
        }

        const reposition = () => updateModalAnchor(hoveredCardRef.current);
        reposition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);

        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [hoveredDepartment, updateModalAnchor]);

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
                    <div className="programs-panel-grid">
                        {departments.length > 0 ? (
                            departments.map((department) => (
                                <article
                                    className="program-card-red"
                                    key={department.id ?? department.name}
                                    tabIndex={0}
                                    onMouseEnter={(event) => handleDepartmentHover(department, event.currentTarget)}
                                    onFocus={(event) => handleDepartmentHover(department, event.currentTarget)}
                                    onMouseLeave={scheduleModalClose}
                                    onBlur={scheduleModalClose}
                                >
                                    <span className="program-card-red__tag">Department</span>
                                    <h3>{department.name}</h3>
                                    <div className="program-card-red__footer">
                                        <p className="program-card-red__hint">Hover to view programs</p>
                                        <span className="program-card-red__dots" aria-hidden="true">•••</span>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <article className="program-card-red program-card-red--loading">
                                <span className="program-card-red__tag">Department</span>
                                <h3>Loading programs…</h3>
                                <div className="program-card-red__footer">
                                    <p className="program-card-red__hint">Hover to view programs</p>
                                    <span className="program-card-red__dots" aria-hidden="true">•••</span>
                                </div>
                            </article>
                        )}
                    </div>
                    {hoveredDepartment && modalAnchor && (
                        <ProgramModal
                            department={hoveredDepartment}
                            anchor={modalAnchor}
                            onMouseEnter={handleModalMouseEnter}
                            onMouseLeave={handleModalMouseLeave}
                        />
                    )}
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