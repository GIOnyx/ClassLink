import React from 'react';
import '../App.css';
import './Footer.css';

const Footer = () => {
    const quickLinks = [
        { label: 'Enrollment', href: '#' },
        { label: 'Scholarships', href: '#' },
        { label: 'Campus News', href: '#' },
        { label: 'Student Portal', href: '#' },
    ];

    const socials = [
        { label: 'Facebook', icon: '📘', href: '#' },
        { label: 'Instagram', icon: '📸', href: '#' },
        { label: 'YouTube', icon: '▶️', href: '#' },
        { label: 'TikTok', icon: '🎵', href: '#' },
    ];

    return (
        <footer className="footer">
            <div className="footer-top">
                <div className="footer-brand">
                    <div className="footer-logo" aria-hidden="true">CIT</div>
                    <div>
                        <p className="footer-brand-name">Cebu Institute of Technology</p>
                        <p className="footer-brand-sub">University</p>
                    </div>
                </div>
                <div className="footer-contact">
                    <h4>Contact Us</h4>
                    <p>N. Bacalso Avenue, Cebu City, Philippines 6000</p>
                    <p>+63 32 411 2000 (trunkline)</p>
                    <p>info@cit.edu</p>
                </div>
                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        {quickLinks.map(link => (
                            <li key={link.label}><a href={link.href}>{link.label}</a></li>
                        ))}
                    </ul>
                </div>
                <div className="footer-touch">
                    <h4>Follow Us</h4>
                    <div className="footer-socials">
                        {socials.map(social => (
                            <a key={social.label} href={social.href} aria-label={social.label}>{social.icon}</a>
                        ))}
                    </div>
                    <small className="footer-note">Stay connected with campus news, events, and announcements.</small>
                </div>
            </div>
            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Cebu Institute of Technology - University</span>
                <span>For inquiries and comments, email citu@classlink.com</span>
            </div>
        </footer>
    );
};

export default Footer;