import React, { useEffect, useState } from 'react';
import '../App.css';
import './BrandHeader.css';

const navLinks = [
    { label: 'Home', target: '#home' },
    { label: 'Vision', target: '#vision' },
    { label: 'Mission', target: '#mission' },
    { label: 'Core Values', target: '#core-values' },
    { label: 'Programs', target: '#programs' },
];

const BrandHeader = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSmoothScroll = (event, target) => {
        event.preventDefault();
        const section = document.querySelector(target);
        if (!section) return;

        const navbarOffset = 100;
        const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: elementPosition - navbarOffset,
            behavior: 'smooth',
        });
    };

    return (
        <header className="landing-navbar">
            <div className="landing-navbar__brand">
                <img src="/CIT-logo.png" alt="CIT-U Logo" className="landing-navbar__logo" />
                <div className="landing-navbar__text">
                    <p className="landing-navbar__headline">Cebu Institute of Technology - University</p>
                    <p className="landing-navbar__status" aria-live="polite">
                        <span
                            className={`landing-navbar__status-dot ${isOnline ? 'online' : 'offline'}`}
                            aria-hidden="true"
                        />
                        {isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>

            <nav className="landing-navbar__nav" aria-label="Primary">
                <ul>
                    {navLinks.map(link => (
                        <li key={link.label}>
                            <a
                                href={link.target}
                                onClick={event => handleSmoothScroll(event, link.target)}
                                className="landing-navbar__link"
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

        </header>
    );
};

export default BrandHeader;