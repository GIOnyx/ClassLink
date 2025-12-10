import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../App.css';
import './Navbar.css';
import './BrandHeader.css';

const typeLabels = {
    APPLICATION_STATUS: 'Application Update',
    CALENDAR_EVENT: 'Calendar Event',
    GENERAL: 'Notification'
};

const NOTIFICATION_FILTERS = {
    ALL: 'ALL',
    UNREAD: 'UNREAD'
};

const Navbar = ({
    onLogout,
    role,
    notifications = [],
    unreadCount = 0,
    onRefreshNotifications,
    onMarkNotificationRead,
    notificationsLoading = false,
    userProfile = {},
    profileLoading = false
}) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState(NOTIFICATION_FILTERS.ALL);
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
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
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (isDropdownOpen && typeof onRefreshNotifications === 'function') {
            onRefreshNotifications();
        }
    }, [isDropdownOpen, onRefreshNotifications]);

    const unreadNotifications = useMemo(
        () => notifications.filter((item) => !item.read),
        [notifications]
    );

    const filteredNotifications = useMemo(
        () => (notificationFilter === NOTIFICATION_FILTERS.UNREAD ? unreadNotifications : notifications),
        [notificationFilter, notifications, unreadNotifications]
    );

    const totalNotificationsCount = notifications.length;
    const unreadNotificationsCount = unreadNotifications.length;

    const handleMarkAllAsRead = useCallback(async () => {
        if (typeof onMarkNotificationRead !== 'function' || role !== 'STUDENT') return;
        if (unreadNotificationsCount === 0) return;
        const ids = unreadNotifications
            .map((item) => item.id)
            .filter(Boolean);
        if (ids.length === 0) return;
        try {
            await Promise.all(ids.map((id) => onMarkNotificationRead(id)));
            await onRefreshNotifications?.();
        } catch (err) {
            console.error('Failed to mark all notifications as read', err);
        }
    }, [onMarkNotificationRead, onRefreshNotifications, role, unreadNotifications, unreadNotificationsCount]);

    const toggleDropdown = () => setDropdownOpen((prev) => !prev);
    const closeDropdown = () => setDropdownOpen(false);

    const formatRelativeTime = (value) => {
        if (!value) return '';
        const timestamp = new Date(value);
        if (Number.isNaN(timestamp.getTime())) return '';
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    };

    const getTitle = (notification) => {
        if (!notification) return 'Notification';
        if (notification.title && notification.title.trim().length > 0) {
            return notification.title;
        }
        return typeLabels[notification.type] || 'Notification';
    };

    const renderNotifications = () => (
        <li
            className="notification-wrapper"
            ref={dropdownRef}
        >
            <button
                type="button"
                className={`notification-link ${isDropdownOpen ? 'open' : ''}`}
                aria-label="Notifications"
                aria-expanded={isDropdownOpen}
                onClick={toggleDropdown}
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
                    <span
                        className="notification-badge notification-badge--dot"
                        aria-label={`${unreadCount} unread notifications`}
                        role="status"
                    />
                )}
            </button>
            {isDropdownOpen && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown__header">
                        <div>
                            <p className="notification-dropdown__title">Notifications</p>
                            <p className="notification-dropdown__subtitle">We will alert you about application updates and new events.</p>
                        </div>
                        {role === 'STUDENT' && (
                            <button
                                type="button"
                                className="notification-dropdown__refresh"
                                onClick={handleMarkAllAsRead}
                                disabled={notificationsLoading || unreadNotificationsCount === 0}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    {role === 'STUDENT' && (
                        <div className="notification-dropdown__tabs" role="tablist" aria-label="Notification filters">
                            <button
                                type="button"
                                className={`notification-tab ${notificationFilter === NOTIFICATION_FILTERS.ALL ? 'is-active' : ''}`}
                                onClick={() => setNotificationFilter(NOTIFICATION_FILTERS.ALL)}
                                aria-pressed={notificationFilter === NOTIFICATION_FILTERS.ALL}
                            >
                                All
                                <span>{totalNotificationsCount}</span>
                            </button>
                            <button
                                type="button"
                                className={`notification-tab ${notificationFilter === NOTIFICATION_FILTERS.UNREAD ? 'is-active' : ''}`}
                                onClick={() => setNotificationFilter(NOTIFICATION_FILTERS.UNREAD)}
                                aria-pressed={notificationFilter === NOTIFICATION_FILTERS.UNREAD}
                            >
                                Unread
                                <span>{unreadNotificationsCount}</span>
                            </button>
                        </div>
                    )}
                    <div className="notification-dropdown__list">
                        {role !== 'STUDENT' ? (
                            <p className="notification-empty">Notifications are currently available to student accounts.</p>
                        ) : notificationsLoading ? (
                            <p className="notification-empty">Loading notifications…</p>
                        ) : totalNotificationsCount === 0 ? (
                            <p className="notification-empty">You're all caught up!</p>
                        ) : filteredNotifications.length === 0 ? (
                            <p className="notification-empty">
                                {notificationFilter === NOTIFICATION_FILTERS.UNREAD ? 'No unread notifications.' : 'Nothing to show yet.'}
                            </p>
                        ) : (
                            filteredNotifications.map((notification) => (
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
    );

    const renderBrand = () => (
        <div className="navbar-brand landing-navbar__brand">
            <img src="/CIT-logo.png" alt="CIT-U Logo" className="navbar-logo landing-navbar__logo" />
            <div className="landing-navbar__text">
                <p className="landing-navbar__headline">Cebu Institute of Technology - University</p>
                <p className="landing-navbar__status" aria-live="polite">
                    <span className={`landing-navbar__status-dot ${isOnline ? 'online' : 'offline'}`} aria-hidden="true" />
                    {isOnline ? 'Online' : 'Offline'}
                </p>
            </div>
        </div>
    );

    const displayName = profileLoading
        ? 'Loading account…'
        : (userProfile?.name && userProfile.name.trim().length > 0
            ? userProfile.name.trim()
            : role === 'ADMIN'
                ? 'Admin Account'
                : 'Student Account');
    const roleLabel = userProfile?.roleLabel || (role === 'ADMIN' ? 'Administrator' : 'Student');
    const avatarSrc = userProfile?.avatarUrl;
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase() || '')
        .join('') || role?.[0] || '?';

    const renderProfileCard = () => (
        <li className="navbar-profile-item">
            <div className={`navbar-profile-card ${profileLoading ? 'is-loading' : ''}`}>
                <div className="navbar-profile-avatar" aria-hidden={avatarSrc ? 'true' : 'false'}>
                    {avatarSrc ? (
                        <img src={avatarSrc} alt={`${displayName} avatar`} />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
                <div className="navbar-profile-copy">
                    <p>{displayName}</p>
                    <span>{roleLabel}</span>
                </div>
                <button
                    type="button"
                    className="navbar-profile-signout"
                    onClick={onLogout}
                    aria-label="Logout"
                >
                    <img src="/icons/logout.png" alt="" />
                </button>
            </div>
        </li>
    );

    return (
        <nav className={`navbar ${role === 'ADMIN' ? 'navbar--admin' : ''}`}>
            {renderBrand()}
            <ul className="navbar-links">
                {renderNotifications()}
                {renderProfileCard()}
            </ul>
        </nav>
    );
};

export default Navbar;