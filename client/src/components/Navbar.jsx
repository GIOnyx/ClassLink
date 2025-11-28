import React, { useEffect, useRef, useState } from 'react';
import '../App.css';
import './Navbar.css';

const typeLabels = {
    APPLICATION_STATUS: 'Application Update',
    CALENDAR_EVENT: 'Calendar Event',
    GENERAL: 'Notification'
};

const Navbar = ({
    onLogout,
    role,
    notifications = [],
    unreadCount = 0,
    onRefreshNotifications,
    onMarkNotificationRead,
    notificationsLoading = false
}) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isDropdownOpen && typeof onRefreshNotifications === 'function') {
            onRefreshNotifications();
        }
    }, [isDropdownOpen, onRefreshNotifications]);

    const toggleDropdown = () => {
        setDropdownOpen((open) => !open);
    };

    const formatRelativeTime = (value) => {
        if (!value) {
            return '';
        }
        const timestamp = new Date(value);
        if (Number.isNaN(timestamp.getTime())) {
            return '';
        }
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 60) {
            return 'Just now';
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes}m ago`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }
        const days = Math.floor(hours / 24);
        if (days < 7) {
            return `${days}d ago`;
        }
        return timestamp.toLocaleDateString();
    };

    const getTitle = (notification) => {
        if (!notification) {
            return 'Notification';
        }
        if (notification.title && notification.title.trim().length > 0) {
            return notification.title;
        }
        return typeLabels[notification.type] || 'Notification';
    };

    return (
        <nav className="navbar">
        <div className="navbar-brand">
            <img src="/CIT-logo.png" alt="CIT-U Logo" className="navbar-logo" />
            <div className="navbar-text">
                <p>Cebu Institute of Technology - Univeristy</p>
                <p><span className="online-text">Online</span></p>
            </div>
        </div>
        <ul className="navbar-links">
            <li className="notification-wrapper" ref={dropdownRef}>
                <button
                    type="button"
                    className={`notification-link ${isDropdownOpen ? 'open' : ''}`}
                    onClick={toggleDropdown}
                    aria-label="Notifications"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="notification-icon"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {role === 'STUDENT' && unreadCount > 0 && (
                        <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                </button>
                {isDropdownOpen && (
                    <div className="notification-dropdown">
                        <div className="notification-dropdown__header">
                            <div>
                                <p className="notification-dropdown__title">Notifications</p>
                                <p className="notification-dropdown__subtitle">We will alert you about application updates and new events.</p>
                            </div>
                            <button
                                type="button"
                                className="notification-dropdown__refresh"
                                onClick={onRefreshNotifications}
                                disabled={notificationsLoading}
                            >
                                {notificationsLoading ? 'Refreshing…' : 'Refresh'}
                            </button>
                        </div>
                        <div className="notification-dropdown__list">
                            {role !== 'STUDENT' ? (
                                <p className="notification-empty">Notifications are currently available to student accounts.</p>
                            ) : notificationsLoading ? (
                                <p className="notification-empty">Loading notifications…</p>
                            ) : notifications.length === 0 ? (
                                <p className="notification-empty">You're all caught up!</p>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.read ? 'notification-item--read' : ''}`}
                                    >
                                        <div className="notification-item__content">
                                            <p className="notification-item__title">{getTitle(notification)}</p>
                                            <p className="notification-item__message">{notification.message || 'No additional details provided.'}</p>
                                            <span className="notification-item__timestamp">{formatRelativeTime(notification.createdAt)}</span>
                                        </div>
                                        {!notification.read && (
                                            <button
                                                type="button"
                                                className="notification-item__mark"
                                                onClick={() => onMarkNotificationRead?.(notification.id)}
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </li>
            <li>
                <button onClick={onLogout} className="logout-button">Logout</button>
            </li>
        </ul>
        </nav>
    );
};

export default Navbar;